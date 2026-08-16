import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { auditContext, roughTokens } from '../../scripts/context-audit.mjs';

test('roughTokens is explicit and deterministic', () => {
  assert.equal(roughTokens(0), 0);
  assert.equal(roughTokens(5), 2);
});

test('auditContext finds AGENTS, skills, and codex memory but skips node_modules', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'codexforge-context-'));
  await mkdir(path.join(root, '.agents/skills/demo'), { recursive: true });
  await mkdir(path.join(root, '.codex-memory'), { recursive: true });
  await mkdir(path.join(root, 'node_modules/pkg'), { recursive: true });
  await writeFile(path.join(root, 'AGENTS.md'), 'abc');
  await writeFile(path.join(root, '.agents/skills/demo/SKILL.md'), '12345678');
  await writeFile(path.join(root, '.codex-memory/PROJECT.md'), 'project');
  await writeFile(path.join(root, 'node_modules/pkg/AGENTS.md'), 'ignore me');
  const report = await auditContext(root);
  assert.equal(report.totals.files, 3);
  assert.deepEqual(report.files.map((x) => x.file).sort(), ['.agents/skills/demo/SKILL.md','.codex-memory/PROJECT.md','AGENTS.md'].sort());
});
