#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { chmod, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { OPENCODEX_URL, OPTIMIZER_URL, setOptimizerRouting } from '../optimizer/codex-config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function parseCodexJsonl(text) {
  const events = [];
  const invalid = [];
  for (const [index, raw] of String(text || '').split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line) continue;
    try { events.push(JSON.parse(line)); }
    catch { invalid.push({ line: index + 1, text: raw.slice(0, 500) }); }
  }
  const turns = events.filter((event) => event?.type === 'turn.completed' && event.usage);
  const usage = turns.length ? normalizeUsage(turns.at(-1).usage) : normalizeUsage({});
  return { events, invalid, usage, turnCompleted: turns.length > 0 };
}

export function normalizeUsage(usage = {}) {
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const input = number(usage.input_tokens);
  const cached = number(usage.cached_input_tokens);
  return {
    input_tokens: input,
    cached_input_tokens: cached,
    cache_write_input_tokens: number(usage.cache_write_input_tokens),
    output_tokens: number(usage.output_tokens),
    reasoning_output_tokens: number(usage.reasoning_output_tokens),
    uncached_input_tokens: Math.max(0, input - cached),
  };
}

export function percentDelta(baseline, optimized) {
  if (!Number.isFinite(baseline) || baseline === 0 || !Number.isFinite(optimized)) return null;
  return ((optimized - baseline) / baseline) * 100;
}

export function summarizePairs(results) {
  const groups = new Map();
  for (const result of results) {
    const key = `${result.task}::${result.round}`;
    const group = groups.get(key) || { task: result.task, round: result.round };
    group[result.arm] = result;
    groups.set(key, group);
  }
  return [...groups.values()].filter((group) => group.baseline && group.optimized).map((group) => {
    const b = group.baseline; const o = group.optimized;
    return {
      task: group.task,
      round: group.round,
      baseline_pass: b.pass,
      optimized_pass: o.pass,
      quality_equal: Boolean(b.pass && o.pass),
      input_delta_pct: percentDelta(b.usage.input_tokens, o.usage.input_tokens),
      uncached_input_delta_pct: percentDelta(b.usage.uncached_input_tokens, o.usage.uncached_input_tokens),
      output_delta_pct: percentDelta(b.usage.output_tokens, o.usage.output_tokens),
      wall_delta_pct: percentDelta(b.wall_ms, o.wall_ms),
      optimizer_bytes_saved: o.optimizer?.toolResultBytesSaved || 0,
      optimizer_results_aged: o.optimizer?.toolResultsAged || 0,
      optimizer_adaptive_aged: o.optimizer?.adaptiveToolResultsAged || 0,
    };
  });
}

function parseArgs(argv) {
  const out = { live: false, yes: false, rounds: 1, model: '', keep: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--live') out.live = true;
    else if (arg === '--yes') out.yes = true;
    else if (arg === '--keep') out.keep = true;
    else if (arg === '--rounds') out.rounds = Number(argv[++i]);
    else if (arg === '--model') out.model = argv[++i] || '';
    else if (arg === '--task') out.only = argv[++i] || null;
    else if (arg === '--help' || arg === '-h') out.help = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isInteger(out.rounds) || out.rounds < 1 || out.rounds > 10) throw new Error('--rounds must be an integer from 1 to 10');
  return out;
}

function help() {
  console.log(`Usage: node scripts/benchmark-live-ab.mjs --live --yes [options]\n\n` +
    `Runs real Codex/OpenCodex A/B tasks and consumes provider/subscription quota.\n\n` +
    `Options:\n` +
    `  --rounds N    Paired rounds. Round 2 reverses arm order to reduce cache/order bias.\n` +
    `  --model ID    Pass an explicit Codex model.\n` +
    `  --task NAME   Only run micro-fix or noisy-debug.\n` +
    `  --keep        Keep scratch workspaces.\n`);
}

function commandOk(command, args) {
  return spawnSync(command, args, { stdio: 'ignore' }).status === 0;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });
}

async function optimizerStats() {
  try {
    const response = await fetch('http://127.0.0.1:10101/_codex_forge/stats', { signal: AbortSignal.timeout(1500) });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

function metricDelta(before, after) {
  const keys = ['requests','optimizedRequests','bypassedRequests','toolResultsAged','adaptiveToolResultsAged','toolResultBytesBefore','toolResultBytesAfter','toolResultBytesSaved'];
  const out = {};
  for (const key of keys) out[key] = Math.max(0, Number(after?.[key] || 0) - Number(before?.[key] || 0));
  return out;
}

async function ensureOptimizer(benchRoot) {
  if (await optimizerStats()) return { child: null, owned: false };
  const child = spawn(process.execPath, [path.join(ROOT, 'optimizer/server.mjs')], {
    stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...process.env, CODEX_FORGE_STATE_DIR: path.join(benchRoot, 'optimizer-state') },
  });
  let stderr = '';
  child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); if (stderr.length > 32_768) stderr = stderr.slice(-32_768); });
  for (let i = 0; i < 50; i++) {
    if (await optimizerStats()) return { child, owned: true };
    if (child.exitCode !== null) throw new Error(`optimizer exited early (${child.exitCode}): ${stderr}`);
    await sleep(100);
  }
  child.kill('SIGTERM');
  throw new Error(`optimizer did not become healthy: ${stderr}`);
}

async function writeText(file, text) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text, 'utf8');
}

const TASKS = {
  'micro-fix': {
    async setup(dir) {
      await writeText(path.join(dir, 'src/calc.mjs'), `export function add(a, b) {\n  return a - b;\n}\n`);
      await writeText(path.join(dir, 'test.mjs'), `import assert from 'node:assert/strict';\nimport { add } from './src/calc.mjs';\nassert.equal(add(2, 3), 5);\nconsole.log('PASS micro-fix');\n`);
      return `Run node test.mjs. Fix the implementation so the test passes. Do not modify test.mjs. Re-run the test before finishing.`;
    },
    validate(dir) {
      const protectedTest = run('git', ['diff', '--exit-code', '--', 'test.mjs'], { cwd: dir });
      const test = run(process.execPath, ['test.mjs'], { cwd: dir });
      return { pass: protectedTest.status === 0 && test.status === 0, details: { protected_test: protectedTest.status === 0, test_exit: test.status } };
    },
  },
  'noisy-debug': {
    async setup(dir) {
      await writeText(path.join(dir, 'src/parser.mjs'), `export function lastFatal(lines) {\n  const hit = lines.find((line) => line.startsWith('FATAL:'));\n  return hit ? hit.slice(6).trim() : null;\n}\n`);
      await writeText(path.join(dir, 'test.mjs'), `import assert from 'node:assert/strict';\nimport { lastFatal } from './src/parser.mjs';\nconst lines = [];\nfor (let i = 0; i < 5000; i++) lines.push('INFO ' + String(i).padStart(5, '0') + ' ' + 'x'.repeat(42));\nlines.splice(1200, 0, 'FATAL: stale-error');\nlines.push('FATAL: final-error');\nfor (const line of lines) console.log(line);\nassert.equal(lastFatal(lines), 'final-error');\nconsole.log('PASS noisy-debug');\n`);
      return `Run node test.mjs normally and inspect the failure. Fix only src/parser.mjs so it returns the last FATAL message. Do not modify test.mjs and do not silence, redirect, truncate, or rewrite the test output. Re-run node test.mjs before finishing.`;
    },
    validate(dir) {
      const protectedTest = run('git', ['diff', '--exit-code', '--', 'test.mjs'], { cwd: dir, stdio: 'ignore' });
      const test = spawnSync(process.execPath, ['test.mjs'], { cwd: dir, stdio: 'ignore' });
      return { pass: protectedTest.status === 0 && test.status === 0, details: { protected_test: protectedTest.status === 0, test_exit: test.status } };
    },
  },
};

async function makeWorkspace(root, taskName, round, arm) {
  const dir = path.join(root, 'workspaces', `${taskName}-r${round}-${arm}`);
  await mkdir(dir, { recursive: true });
  const init = run('git', ['init', '-q'], { cwd: dir });
  if (init.status !== 0) throw new Error(`git init failed: ${init.stderr}`);
  const prompt = await TASKS[taskName].setup(dir);
  run('git', ['add', '.'], { cwd: dir });
  run('git', ['-c','user.email=codexforge@example.invalid','-c','user.name=CodexForge','commit','-qm','fixture'], { cwd: dir });
  return { dir, prompt };
}

async function routeArm(arm, codexHome) {
  const result = await setOptimizerRouting({ enable: arm === 'optimized', codexHome });
  return { result, content: await readFile(path.join(codexHome, 'config.toml'), 'utf8') };
}

async function runArm({ taskName, round, arm, benchRoot, codexHome, model }) {
  const route = await routeArm(arm, codexHome);
  const { dir, prompt } = await makeWorkspace(benchRoot, taskName, round, arm);
  const before = await optimizerStats();
  const jsonlPath = path.join(benchRoot, 'runs', `${taskName}-r${round}-${arm}.jsonl`);
  const stderrPath = path.join(benchRoot, 'runs', `${taskName}-r${round}-${arm}.stderr.txt`);
  await mkdir(path.dirname(jsonlPath), { recursive: true });
  const args = ['exec', '--json', '--ephemeral', '--full-auto', '--skip-git-repo-check'];
  if (model) args.push('--model', model);
  args.push(prompt);
  const start = process.hrtime.bigint();
  const child = run('codex', args, { cwd: dir, env: process.env });
  const wallMs = Number(process.hrtime.bigint() - start) / 1e6;
  await writeFile(jsonlPath, child.stdout || '', { mode: 0o600 });
  await writeFile(stderrPath, child.stderr || '', { mode: 0o600 });
  const parsed = parseCodexJsonl(child.stdout || '');
  const validation = TASKS[taskName].validate(dir);
  const after = await optimizerStats();
  return {
    task: taskName,
    round,
    arm,
    route_url: arm === 'optimized' ? OPTIMIZER_URL : OPENCODEX_URL,
    route_changed: route.result.changed,
    codex_exit: child.status,
    signal: child.signal,
    pass: child.status === 0 && validation.pass && parsed.turnCompleted,
    validation,
    usage: parsed.usage,
    jsonl_invalid_lines: parsed.invalid.length,
    wall_ms: Math.round(wallMs),
    optimizer: metricDelta(before, after),
    artifacts: { jsonl: jsonlPath, stderr: stderrPath, workspace: dir },
    _managedConfig: route.content,
  };
}

function renderMarkdown(report) {
  const lines = [
    '# CodexForge live A/B benchmark', '',
    `Generated: ${report.generated_at}`, `Rounds: ${report.rounds}`, `Model: ${report.model || 'Codex default'}`, `Scratch workspaces retained: ${report.scratch_workspaces_retained ? 'yes' : 'no'}`, '',
    '> Real Codex/OpenCodex runs. Token fields are reported by Codex. Subscription quota impact is provider-specific; this report does not convert them to billing unless the provider exposes a price.', '',
    '| task | round | baseline pass | optimized pass | input Δ | uncached input Δ | output Δ | wall Δ | aged | adaptive | bytes saved |',
    '|---|---:|:---:|:---:|---:|---:|---:|---:|---:|---:|---:|',
  ];
  const fmt = (value) => value === null ? 'n/a' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  for (const pair of report.pairs) {
    lines.push(`| ${pair.task} | ${pair.round} | ${pair.baseline_pass ? 'PASS' : 'FAIL'} | ${pair.optimized_pass ? 'PASS' : 'FAIL'} | ${fmt(pair.input_delta_pct)} | ${fmt(pair.uncached_input_delta_pct)} | ${fmt(pair.output_delta_pct)} | ${fmt(pair.wall_delta_pct)} | ${pair.optimizer_results_aged} | ${pair.optimizer_adaptive_aged} | ${pair.optimizer_bytes_saved} |`);
  }
  lines.push('', '## Interpretation', '', '- A negative token delta means the optimized arm used fewer reported tokens.', '- Treat any optimized failure as a quality regression regardless of token savings.', '- One round is order-sensitive. Use `--rounds 2` or more for counterbalanced A/B ↔ B/A ordering.', '- `optimizer_bytes_saved` is request-body reduction measured by CodexForge, not billed-token savings.', '');
  return lines.join('\n');
}

async function main() {
  let args;
  try { args = parseArgs(process.argv.slice(2)); } catch (error) { console.error(error.message); help(); process.exit(2); }
  if (args.help) { help(); return; }
  if (!args.live || !args.yes) { console.error('Refusing: this benchmark consumes real provider/subscription quota. Re-run with --live --yes.'); process.exit(2); }
  if (!commandOk('codex', ['--version'])) throw new Error('codex CLI is missing');
  if (!commandOk('ocx', ['--help'])) throw new Error('OpenCodex (ocx) is missing');
  if (!commandOk('ocx', ['health'])) throw new Error('OpenCodex is not healthy; run `ocx start` and `ocx doctor` first');
  if (!commandOk('ocx', ['ready', '--wait', '--timeout', '30'])) throw new Error('OpenCodex did not become ready');

  const selected = args.only ? [args.only] : Object.keys(TASKS);
  for (const task of selected) if (!TASKS[task]) throw new Error(`unknown task ${task}; expected ${Object.keys(TASKS).join(', ')}`);

  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  const configPath = path.join(codexHome, 'config.toml');
  const configStat = await stat(configPath);
  const originalConfig = await readFile(configPath, 'utf8');
  if (!originalConfig.includes(OPENCODEX_URL) && !originalConfig.includes(OPTIMIZER_URL)) {
    throw new Error(`refusing benchmark: config does not contain managed OpenCodex/CodexForge URL (${OPENCODEX_URL} or ${OPTIMIZER_URL})`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const benchRoot = path.join(process.env.CODEX_FORGE_STATE_DIR || path.join(os.homedir(), '.codex-forge'), 'benchmarks', stamp);
  await mkdir(benchRoot, { recursive: true, mode: 0o700 });
  await chmod(benchRoot, 0o700).catch(() => {});
  const optimizer = await ensureOptimizer(benchRoot);
  const results = [];
  let lastManagedConfig = originalConfig;
  try {
    for (let round = 1; round <= args.rounds; round++) {
      const order = round % 2 === 1 ? ['baseline', 'optimized'] : ['optimized', 'baseline'];
      for (const taskName of selected) {
        for (const arm of order) {
          console.error(`[benchmark] ${taskName} round=${round} arm=${arm}`);
          const result = await runArm({ taskName, round, arm, benchRoot, codexHome, model: args.model });
          lastManagedConfig = result._managedConfig;
          delete result._managedConfig;
          results.push(result);
          console.error(`[benchmark] ${result.pass ? 'PASS' : 'FAIL'} input=${result.usage.input_tokens} cached=${result.usage.cached_input_tokens} output=${result.usage.output_tokens} wall=${result.wall_ms}ms aged=${result.optimizer.toolResultsAged}`);
        }
      }
    }
  } finally {
    const current = await readFile(configPath, 'utf8').catch(() => null);
    if (current === lastManagedConfig || current === originalConfig) {
      await writeFile(configPath, originalConfig, { encoding: 'utf8', mode: configStat.mode & 0o777 });
    } else {
      console.error('[benchmark] WARNING: ~/.codex/config.toml changed concurrently; refusing to overwrite it during restore. Restore the route manually if needed.');
    }
    if (optimizer.owned && optimizer.child && optimizer.child.exitCode === null) {
      optimizer.child.kill('SIGTERM');
      await Promise.race([new Promise((resolve) => optimizer.child.once('exit', resolve)), sleep(2000)]);
      if (optimizer.child.exitCode === null) optimizer.child.kill('SIGKILL');
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    rounds: args.rounds,
    model: args.model || null,
    tasks: selected,
    results,
    pairs: summarizePairs(results),
    scratch_workspaces_retained: args.keep,
  };
  const reportJson = path.join(benchRoot, 'report.json');
  const reportMd = path.join(benchRoot, 'report.md');
  if (!args.keep) await rm(path.join(benchRoot, 'workspaces'), { recursive: true, force: true });
  await writeFile(reportJson, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  await writeFile(reportMd, renderMarkdown(report), { mode: 0o600 });
  console.log(renderMarkdown(report));
  console.log(`Report: ${reportMd}`);
  console.log(`Raw JSON: ${reportJson}`);
  console.log(args.keep ? `Scratch workspaces: ${path.join(benchRoot, 'workspaces')}` : 'Scratch workspaces removed; JSONL/stderr and benchmark metrics were kept.');
  if (results.some((result) => !result.pass)) process.exitCode = 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((error) => { console.error(`[benchmark] ${error.stack || error.message}`); process.exit(1); });
