#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
set +e
node "$ROOT/scripts/benchmark-live-ab.mjs" >"$TMP/out" 2>"$TMP/err"
status=$?
set -e
test "$status" -eq 2
grep -q -- '--live --yes' "$TMP/err"
echo '[ok] live benchmark refuses accidental quota use'
