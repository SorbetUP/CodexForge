#!/usr/bin/env bash
set -euo pipefail

STACK_HOME="${HOME}/.codex-stack"
BIN_DIR="${HOME}/.local/bin"
CODEX_DIR="${HOME}/.codex"

rm -f "${BIN_DIR}/codex-stack" "${BIN_DIR}/codex-stack-doctor"
rm -rf "${STACK_HOME}"

if command -v rtk >/dev/null 2>&1; then
  rtk init -g --codex --uninstall >/dev/null 2>&1 || true
fi

if [[ -f "${CODEX_DIR}/AGENTS.md" ]]; then
  python3 - <<'PY'
from pathlib import Path
path = Path.home() / ".codex" / "AGENTS.md"
if path.exists():
    marker = "<!-- CODEX_PORTABLE_STACK -->"
    lines = path.read_text().splitlines()
    out = []
    skip = False
    for line in lines:
        if line.strip() == marker and not skip:
            skip = True
            continue
        if line.strip() == marker and skip:
            skip = False
            continue
        if not skip:
            out.append(line)
    path.write_text("\n".join(out).rstrip() + ("\n" if out else ""))
PY
fi

rm -f "${CODEX_DIR}/CODEX_STACK.md"

printf '%s\n' "Desinstallation terminee."
