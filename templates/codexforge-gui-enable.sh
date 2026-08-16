#!/usr/bin/env bash
set -euo pipefail
STACK_HOME="__STACK_HOME__"; HEADROOM_BIN="__HEADROOM_BIN__"
if [[ "${CODEX_FORGE_LEGACY_HEADROOM:-0}" == "1" ]]; then
  PORT="8787"; LOG_DIR="${STACK_HOME}/logs"; mkdir -p "${LOG_DIR}"
  [[ -x "${HEADROOM_BIN}" ]] || { echo "Headroom is not installed." >&2; exit 1; }
  if ! curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then nohup "${HEADROOM_BIN}" proxy --port "${PORT}" >"${LOG_DIR}/headroom-gui.log" 2>&1 & sleep 2; fi
  launchctl setenv OPENAI_BASE_URL "http://127.0.0.1:${PORT}/v1"
  echo "Legacy Headroom GUI mode enabled. Restart Codex.app."; exit 0
fi
command -v ocx >/dev/null 2>&1 || { echo "OpenCodex is not installed. Run ./install.sh first." >&2; exit 1; }
# OpenCodex integrates through Codex config; a launchctl override would bypass it.
launchctl unsetenv OPENAI_BASE_URL >/dev/null 2>&1 || true
if ! ocx health >/dev/null 2>&1; then echo "OpenCodex is installed but not running. Start it with: ocx start (or ocx service start)" >&2; exit 1; fi
echo "OpenCodex GUI mode ready. Restart Codex.app so it reloads the Codex config/catalog."
