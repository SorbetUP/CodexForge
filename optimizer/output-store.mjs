import { createHash } from 'node:crypto';
import { mkdir, open, readdir, rename, rm, stat, utimes, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_MAX_BYTES = 512 * 1024 * 1024;
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
function assertHash(hash) {
  if (!/^[a-f0-9]{64}$/i.test(hash || '')) throw new Error('invalid sha256');
  return hash.toLowerCase();
}
export class OutputStore {
  constructor({ root, maxBytes = DEFAULT_MAX_BYTES, ttlMs = DEFAULT_TTL_MS } = {}) {
    this.root = root || path.join(process.env.HOME || '.', '.codex-forge', 'tool-output');
    this.maxBytes = Number(maxBytes) > 0 ? Number(maxBytes) : DEFAULT_MAX_BYTES;
    this.ttlMs = Number(ttlMs) > 0 ? Number(ttlMs) : DEFAULT_TTL_MS;
  }
  async init() { await mkdir(this.root, { recursive: true, mode: 0o700 }); }
  file(hash) { return path.join(this.root, `${assertHash(hash)}.txt`); }
  async put(text) {
    if (typeof text !== 'string') throw new TypeError('output must be text');
    await this.init();
    const hash = createHash('sha256').update(text, 'utf8').digest('hex');
    const file = this.file(hash);
    try { await stat(file); const now = new Date(); await utimes(file, now, now); }
    catch {
      const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(tmp, text, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
      try { await rename(tmp, file); } catch (error) { await rm(tmp, { force: true }); if (error?.code !== 'EEXIST') throw error; }
    }
    await this.evict();
    return { hash, bytes: Buffer.byteLength(text, 'utf8'), file };
  }
  async get(hash, { offset = 0, length } = {}) {
    await this.init();
    const file = this.file(hash); const info = await stat(file);
    const start = Math.max(0, Number(offset) || 0); const available = Math.max(0, info.size - start);
    const wanted = length === undefined ? available : Math.max(0, Math.min(available, Number(length) || 0));
    const handle = await open(file, 'r');
    try {
      const buffer = Buffer.alloc(wanted); const { bytesRead } = await handle.read(buffer, 0, wanted, start);
      const now = new Date(); await utimes(file, now, now).catch(() => {});
      return buffer.subarray(0, bytesRead).toString('utf8');
    } finally { await handle.close(); }
  }
  async grep(hash, pattern, { maxMatches = 50 } = {}) {
    const text = await this.get(hash); const needle = String(pattern || ''); if (!needle) return [];
    return text.split(/\r?\n/u).map((line, index) => ({ line: index + 1, text: line })).filter((entry) => entry.text.includes(needle)).slice(0, maxMatches);
  }
  async evict(now = Date.now()) {
    await this.init(); const names = await readdir(this.root).catch(() => []); const entries = []; let total = 0;
    for (const name of names) {
      if (!/^[a-f0-9]{64}\.txt$/i.test(name)) continue;
      const file = path.join(this.root, name); const info = await stat(file).catch(() => null); if (!info) continue;
      if (now - info.mtimeMs > this.ttlMs) { await rm(file, { force: true }); continue; }
      entries.push({ file, size: info.size, mtimeMs: info.mtimeMs }); total += info.size;
    }
    entries.sort((a, b) => a.mtimeMs - b.mtimeMs);
    for (const entry of entries) { if (total <= this.maxBytes) break; await rm(entry.file, { force: true }); total -= entry.size; }
    return { totalBytes: total };
  }
}
