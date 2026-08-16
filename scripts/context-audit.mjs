#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP = new Set(['.git','node_modules','.venv','venv','dist','build','target','.next']);

export function roughTokens(chars) { return Math.ceil(Number(chars || 0) / 4); }

async function walk(dir, root, out) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (entry.isDirectory() && SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, root, out);
    else if (entry.isFile() && (entry.name === 'AGENTS.md' || entry.name === 'SKILL.md')) {
      const text = await readFile(full, 'utf8').catch(() => null);
      if (text !== null) out.push(record(path.relative(root, full) || entry.name, text));
    }
  }
}

function record(file, text, scope = 'project') {
  const chars = text.length;
  return { file, scope, bytes: Buffer.byteLength(text), chars, rough_tokens: roughTokens(chars), lines: text.split(/\r?\n/).length };
}

export async function auditContext(root, { includeGlobal = false, home = os.homedir(), codexHome = process.env.CODEX_HOME || path.join(home, '.codex') } = {}) {
  const resolved = path.resolve(root);
  const s = await stat(resolved);
  if (!s.isDirectory()) throw new Error(`not a directory: ${resolved}`);
  const files = [];
  await walk(resolved, resolved, files);
  const memoryDir = path.join(resolved, '.codex-memory');
  for (const name of ['PROJECT.md','DECISIONS.md','TASKS.md','SESSION.md']) {
    const full = path.join(memoryDir, name);
    const text = await readFile(full, 'utf8').catch(() => null);
    if (text !== null) files.push(record(path.relative(resolved, full), text, 'project-memory'));
  }
  if (includeGlobal) {
    const globalAgents = path.join(codexHome, 'AGENTS.md');
    const agentsText = await readFile(globalAgents, 'utf8').catch(() => null);
    if (agentsText !== null) files.push(record(globalAgents, agentsText, 'global'));
    const globalSkills = path.join(home, '.agents', 'skills');
    const entries = await readdir(globalSkills, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const full = path.join(globalSkills, entry.name, 'SKILL.md');
      const text = await readFile(full, 'utf8').catch(() => null);
      if (text !== null) files.push(record(full, text, 'global-skill'));
    }
  }
  files.sort((a,b) => b.rough_tokens - a.rough_tokens || a.file.localeCompare(b.file));
  const totals = files.reduce((acc, item) => { acc.files++; acc.bytes += item.bytes; acc.chars += item.chars; acc.rough_tokens += item.rough_tokens; return acc; }, { files:0, bytes:0, chars:0, rough_tokens:0 });
  return { root: resolved, approximation: 'rough_tokens = ceil(characters / 4); use provider telemetry for real tokens', totals, files };
}

function render(report) {
  console.log(`Context audit: ${report.root}`);
  console.log(`Files: ${report.totals.files}  bytes: ${report.totals.bytes}  rough tokens: ~${report.totals.rough_tokens}`);
  console.log('');
  for (const item of report.files) console.log(`${String(item.rough_tokens).padStart(7)} tok~  ${String(item.bytes).padStart(8)} B  [${item.scope}] ${item.file}`);
  console.log('\nNote: rough token counts are only a size heuristic; prompt caching and selective skill loading determine actual cost.');
}

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const includeGlobal = args.includes('--global');
  const positional = args.filter((arg) => !arg.startsWith('--'));
  const root = positional[0] || process.cwd();
  const report = await auditContext(root, { includeGlobal });
  if (json) console.log(JSON.stringify(report, null, 2)); else render(report);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((error) => { console.error(`[context-audit] ${error.message}`); process.exit(1); });
