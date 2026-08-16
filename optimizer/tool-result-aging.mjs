import { createHash } from 'node:crypto';

export const DEFAULT_MIN_BYTES = 32 * 1024;
export const DEFAULT_FRONTIER = 4;
export const ADAPTIVE_MEDIUM_BYTES = 16 * 1024;
export const ADAPTIVE_OLD_BYTES = 8 * 1024;
const PREVIEW_CODE_UNITS = 1024;
const OUTPUT_TYPES = new Set(['function_call_output', 'custom_tool_call_output']);
const MODEL_ACTION_TYPES = new Set(['function_call', 'custom_tool_call', 'reasoning']);
const MODEL_DECISION_TYPES = new Set(['function_call', 'custom_tool_call']);

function modelActed(item) {
  return MODEL_ACTION_TYPES.has(item?.type) || (item?.type === 'message' && item.role === 'assistant');
}

function modelDecision(item) {
  return MODEL_DECISION_TYPES.has(item?.type) || (item?.type === 'message' && item.role === 'assistant');
}

function textualOutput(item) {
  if (!OUTPUT_TYPES.has(item?.type)) return undefined;
  if (typeof item.output === 'string') return item.output;
  if (!Array.isArray(item.output)) return undefined;
  const parts = [];
  for (const part of item.output) {
    if (!part || typeof part !== 'object' || !['input_text', 'text'].includes(part.type) || typeof part.text !== 'string') return undefined;
    parts.push(part.text);
  }
  return parts.join('');
}

function safeHead(value) { return value.slice(0, Math.min(value.length, PREVIEW_CODE_UNITS)); }
function safeTail(value) { return value.slice(Math.max(0, value.length - PREVIEW_CODE_UNITS)); }

function callNames(input) {
  const names = new Map();
  for (const item of input) if (['function_call', 'custom_tool_call'].includes(item?.type) && item.call_id && item.name) names.set(item.call_id, item.name);
  return names;
}

export function effectiveMinBytes(baseMinBytes, laterDecisions, adaptive = true) {
  const base = Math.max(0, Number(baseMinBytes));
  if (!adaptive) return base;
  if (laterDecisions >= 4) return Math.min(base, ADAPTIVE_OLD_BYTES);
  if (laterDecisions >= 2) return Math.min(base, ADAPTIVE_MEDIUM_BYTES);
  return base;
}

function receipt(value, hash, toolName) {
  const bytes = Buffer.byteLength(value, 'utf8');
  return [
    `[Older tool result compacted by CodexForge after the model acted on it: ${bytes} bytes, sha256:${hash}.`,
    `The exact original is stored locally. Recover it with: codex-forge output get ${hash}.`,
    `Do not repeat the original tool call solely to recover this output${toolName ? ` (${toolName})` : ''}.]`,
    '',
    '--- beginning of original result ---',
    safeHead(value),
    '--- omitted middle of original result ---',
    safeTail(value),
    '--- end of original result ---',
  ].join('\n');
}

export async function ageToolResults(input, { enabled = true, minBytes = DEFAULT_MIN_BYTES, frontier = DEFAULT_FRONTIER, adaptive = true, store } = {}) {
  const stats = { evaluated: 0, aged: 0, adaptiveAged: 0, bytesBefore: 0, bytesAfter: 0, bytesSaved: 0 };
  if (!enabled || !Array.isArray(input)) return { input, stats };

  const outputs = input.map((x, i) => OUTPUT_TYPES.has(x?.type) ? i : -1).filter((i) => i >= 0);
  const protectedCount = Math.max(0, frontier);
  const protectedIndexes = new Set(protectedCount > 0 ? outputs.slice(-protectedCount) : []);

  const actedAfter = new Array(input.length).fill(false);
  const decisionsAfter = new Array(input.length).fill(0);
  let laterAction = false;
  let laterDecisions = 0;
  for (let i = input.length - 1; i >= 0; i--) {
    actedAfter[i] = laterAction;
    decisionsAfter[i] = laterDecisions;
    if (modelActed(input[i])) laterAction = true;
    if (modelDecision(input[i])) laterDecisions++;
  }

  const names = callNames(input);
  const replacements = new Map();
  for (let i = 0; i < input.length; i++) {
    if (protectedIndexes.has(i) || !actedAfter[i]) continue;
    const value = textualOutput(input[i]);
    if (value === undefined) continue;
    stats.evaluated++;
    const before = Buffer.byteLength(value, 'utf8');
    const threshold = effectiveMinBytes(minBytes, decisionsAfter[i], adaptive);
    if (before <= threshold) continue;
    const hash = createHash('sha256').update(value, 'utf8').digest('hex');
    const compact = receipt(value, hash, names.get(input[i].call_id));
    const after = Buffer.byteLength(compact, 'utf8');
    if (after >= before) continue;
    if (store) await store.put(value);
    replacements.set(i, { ...input[i], output: compact });
    stats.aged++;
    if (threshold < minBytes) stats.adaptiveAged++;
    stats.bytesBefore += before;
    stats.bytesAfter += after;
  }
  stats.bytesSaved = stats.bytesBefore - stats.bytesAfter;
  return { input: replacements.size ? input.map((item, i) => replacements.get(i) ?? item) : input, stats };
}
