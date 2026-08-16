#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" != "--live" || "${2:-}" != "--yes" ]]; then echo 'Live test spends real provider quota. Run explicitly: live-opencodex-user.sh --live --yes' >&2; exit 2; fi
command -v ocx >/dev/null || { echo 'ocx missing' >&2; exit 1; }; command -v codex >/dev/null || { echo 'codex missing' >&2; exit 1; }
ocx health >/dev/null; ocx ready --wait --timeout 30 >/dev/null
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT; cd "$TMP"; git init -q; printf 'alpha\n' > input.txt
codex exec --full-auto 'Read input.txt and create output.txt containing exactly: verified-alpha' >/dev/null
test "$(cat output.txt)" = 'verified-alpha'; echo '[ok] live OpenCodex user-equivalent flow'
