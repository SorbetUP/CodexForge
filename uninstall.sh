#!/usr/bin/env bash
set -euo pipefail
STACK_HOME="${HOME}/.codex-stack"; FORGE_HOME="${HOME}/.codex-forge"; BIN_DIR="${HOME}/.local/bin"; CODEX_DIR="${HOME}/.codex"; USER_SKILLS_DIR="${HOME}/.agents/skills"
if [[ -x "${BIN_DIR}/codex-forge" ]]; then "${BIN_DIR}/codex-forge" optimizer disable >/dev/null 2>&1 || true; fi
rm -f "${BIN_DIR}/codex-stack" "${BIN_DIR}/codex-stack-doctor" "${BIN_DIR}/codex-forge" "${BIN_DIR}/codexforge-gui-enable" "${BIN_DIR}/codexforge-gui-disable" "${BIN_DIR}/codexforge-gui-doctor" "${BIN_DIR}/codexforge-gui-restart"
rm -rf "${STACK_HOME}" "${FORGE_HOME}"
for skill in opencodex-operator real-user-validation token-efficiency cost-quality-routing provider-safety programmatic-tool-calling skill-learning compact-output executable-skill-harness; do rm -rf "${USER_SKILLS_DIR}/${skill}"; done
launchctl unsetenv OPENAI_BASE_URL >/dev/null 2>&1 || true
if command -v rtk >/dev/null 2>&1; then rtk init -g --codex --uninstall >/dev/null 2>&1 || true; fi
if [[ -f "${CODEX_DIR}/AGENTS.md" ]]; then python3 - <<'PY'
from pathlib import Path
path=Path.home()/'.codex'/'AGENTS.md'
if path.exists():
    marker='<!-- CODEX_PORTABLE_STACK -->'; lines=path.read_text().splitlines(); out=[]; skip=False
    for line in lines:
        if line.strip()==marker: skip=not skip; continue
        if not skip: out.append(line)
    path.write_text('\n'.join(out).rstrip()+('\n' if out else ''))
PY
fi
rm -f "${CODEX_DIR}/CODEX_STACK.md"
printf '%s\n' "Desinstallation CodexForge terminee. OpenCodex n'est pas desinstalle automatiquement car il peut etre utilise independamment."
