import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
export const OPENCODEX_URL = 'http://127.0.0.1:10100/v1';
export const OPTIMIZER_URL = 'http://127.0.0.1:10101/v1';
export function rewriteManagedOpenAIBaseUrl(text, { enable }) {
  const from = enable ? OPENCODEX_URL : OPTIMIZER_URL; const to = enable ? OPTIMIZER_URL : OPENCODEX_URL;
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exact = new RegExp(`(^\\s*openai_base_url\\s*=\\s*["'])${escaped}(["']\\s*(?:#.*)?$)`, 'm');
  if (!exact.test(text)) {
    if (text.includes(`openai_base_url = "${to}"`) || text.includes(`openai_base_url='${to}'`) || text.includes(`openai_base_url = '${to}'`)) return { text, changed:false, already:true };
    throw new Error(`refusing to modify unrecognized openai_base_url; expected ${from}`);
  }
  return { text: text.replace(exact, `$1${to}$2`), changed:true, already:false };
}
export async function setOptimizerRouting({ enable, codexHome = process.env.CODEX_HOME || path.join(process.env.HOME || '.', '.codex') } = {}) {
  const config = path.join(codexHome, 'config.toml'); const original = await readFile(config, 'utf8'); const result = rewriteManagedOpenAIBaseUrl(original, { enable });
  if (!result.changed) return { ...result, config };
  const backupDir = path.join(codexHome, 'codex-forge'); await mkdir(backupDir, { recursive:true, mode:0o700 });
  const backup = path.join(backupDir, 'config.toml.before-optimizer'); if (enable) await copyFile(config, backup).catch(() => {});
  const tmp = `${config}.codex-forge.tmp`; await writeFile(tmp, result.text, { encoding:'utf8', mode:0o600 }); await rename(tmp, config);
  return { ...result, config, backup };
}
