#!/usr/bin/env node
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import path from 'node:path';
import { ageToolResults, DEFAULT_FRONTIER, DEFAULT_MIN_BYTES } from './tool-result-aging.mjs';
import { OutputStore } from './output-store.mjs';

const HOST = process.env.CODEX_FORGE_LISTEN_HOST || '127.0.0.1';
const PORT = Number(process.env.CODEX_FORGE_LISTEN_PORT || 10101);
const UPSTREAM = new URL(process.env.CODEX_FORGE_UPSTREAM || 'http://127.0.0.1:10100');
const MAX_BODY = Number(process.env.CODEX_FORGE_MAX_REQUEST_BYTES || 64 * 1024 * 1024);
const enabled = (value, fallback = '1') => !['0', 'false', 'off', 'no'].includes(String(value ?? fallback).toLowerCase());
const AGING = enabled(process.env.CODEX_FORGE_TOOL_AGING);
const ADAPTIVE_AGING = enabled(process.env.CODEX_FORGE_AGING_ADAPTIVE);
const MIN_BYTES = Number(process.env.CODEX_FORGE_AGING_MIN_BYTES || DEFAULT_MIN_BYTES);
const FRONTIER = Number(process.env.CODEX_FORGE_AGING_FRONTIER || DEFAULT_FRONTIER);
const STATE_DIR = process.env.CODEX_FORGE_STATE_DIR || path.join(process.env.HOME || '.', '.codex-forge');
const store = new OutputStore({
  root: path.join(STATE_DIR, 'tool-output'),
  maxBytes: Number(process.env.CODEX_FORGE_OUTPUT_STORE_MAX_BYTES || 512 * 1024 * 1024),
  ttlMs: Number(process.env.CODEX_FORGE_OUTPUT_STORE_TTL_MS || 7 * 24 * 60 * 60 * 1000),
});
const metrics = {
  startedAt: new Date().toISOString(), requests: 0, optimizedRequests: 0, bypassedRequests: 0,
  toolResultsAged: 0, adaptiveToolResultsAged: 0,
  toolResultBytesBefore: 0, toolResultBytesAfter: 0, toolResultBytesSaved: 0,
};

function json(res, status, body) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': data.length, 'cache-control': 'no-store' });
  res.end(data);
}

function filteredHeaders(headers, bodyLength) {
  const out = {};
  const hop = new Set(['host', 'content-length', 'connection', 'transfer-encoding', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'upgrade']);
  for (const [key, value] of Object.entries(headers)) if (!hop.has(key.toLowerCase()) && value !== undefined) out[key] = value;
  if (bodyLength !== undefined) out['content-length'] = String(bodyLength);
  return out;
}

async function readBody(req) {
  const chunks = []; let total = 0;
  for await (const chunk of req) { total += chunk.length; chunks.push(chunk); }
  return { tooLarge: total > MAX_BODY, body: Buffer.concat(chunks) };
}

function proxyRaw(req, res, body) {
  const target = new URL(req.url, UPSTREAM);
  const transport = target.protocol === 'https:' ? https : http;
  const upstreamReq = transport.request(target, { method: req.method, headers: filteredHeaders(req.headers, body?.length) }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, filteredHeaders(upstreamRes.headers));
    upstreamRes.pipe(res);
  });
  upstreamReq.on('error', (error) => {
    if (!res.headersSent) json(res, 502, { error: 'upstream_unreachable', message: error.message });
    else res.destroy(error);
  });
  if (body) upstreamReq.end(body); else req.pipe(upstreamReq);
}

const server = http.createServer(async (req, res) => {
  metrics.requests++;
  if (req.url === '/_codex_forge/health') return json(res, 200, { ok: true, upstream: UPSTREAM.origin, aging: AGING, adaptiveAging: ADAPTIVE_AGING, minBytes: MIN_BYTES, frontier: FRONTIER });
  if (req.url === '/_codex_forge/stats') return json(res, 200, metrics);

  const isResponses = req.method === 'POST' && new URL(req.url, 'http://local').pathname === '/v1/responses';
  const isJson = String(req.headers['content-type'] || '').toLowerCase().includes('application/json');
  if (!isResponses || !isJson || !AGING) return proxyRaw(req, res);

  const read = await readBody(req).catch((error) => ({ error }));
  if (read.error) return json(res, 400, { error: 'request_read_failure', message: read.error.message });
  if (read.tooLarge) { metrics.bypassedRequests++; return proxyRaw(req, res, read.body); }

  let parsed;
  try { parsed = JSON.parse(read.body.toString('utf8')); }
  catch { metrics.bypassedRequests++; return proxyRaw(req, res, read.body); }
  if (!Array.isArray(parsed.input)) { metrics.bypassedRequests++; return proxyRaw(req, res, read.body); }

  let result;
  try {
    result = await ageToolResults(parsed.input, { enabled: true, minBytes: MIN_BYTES, frontier: FRONTIER, adaptive: ADAPTIVE_AGING, store });
  } catch {
    metrics.bypassedRequests++;
    return proxyRaw(req, res, read.body);
  }
  if (!result.stats.aged) { metrics.bypassedRequests++; return proxyRaw(req, res, read.body); }

  parsed.input = result.input;
  const body = Buffer.from(JSON.stringify(parsed));
  metrics.optimizedRequests++;
  metrics.toolResultsAged += result.stats.aged;
  metrics.adaptiveToolResultsAged += result.stats.adaptiveAged || 0;
  metrics.toolResultBytesBefore += result.stats.bytesBefore;
  metrics.toolResultBytesAfter += result.stats.bytesAfter;
  metrics.toolResultBytesSaved += result.stats.bytesSaved;
  return proxyRaw(req, res, body);
});

await store.init();
server.listen(PORT, HOST, () => console.error(`[codex-forge] optimizer listening on http://${HOST}:${PORT} -> ${UPSTREAM.origin} (adaptive-aging=${ADAPTIVE_AGING})`));
