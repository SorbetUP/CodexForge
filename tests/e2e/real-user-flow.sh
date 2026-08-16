#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"; TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
export HOME="$TMP/home" CODEX_FORGE_STATE_DIR="$TMP/state"; mkdir -p "$HOME"
node "$ROOT/bin/codex-forge" --help | grep -q 'opencodex install --yes'
if node "$ROOT/bin/codex-forge" opencodex install >"$TMP/out" 2>"$TMP/err"; then echo 'expected install without --yes to fail' >&2; exit 1; fi
grep -q 'Refusing network install without --yes' "$TMP/err"
HASH="$(ROOT="$ROOT" node --input-type=module <<'NODE'
const { pathToFileURL } = await import('node:url');
const { OutputStore } = await import(pathToFileURL(process.env.ROOT + '/optimizer/output-store.mjs'));
const store = new OutputStore({ root: process.env.CODEX_FORGE_STATE_DIR + '/tool-output' });
const result = await store.put('line one\nimportant exact evidence\nline three\n'); console.log(result.hash);
NODE
)"
[[ "$(node "$ROOT/bin/codex-forge" output get "$HASH")" == $'line one\nimportant exact evidence\nline three' ]]
node "$ROOT/bin/codex-forge" output grep "$HASH" evidence | grep -q '^2:important exact evidence$'
echo '[ok] real-user CLI flow'
