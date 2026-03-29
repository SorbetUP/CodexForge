#!/usr/bin/env bash
set -euo pipefail

STACK_HOME="__STACK_HOME__"
HEADROOM_BIN="__HEADROOM_BIN__"
LOG_DIR="${STACK_HOME}/logs"
LOG_FILE="${LOG_DIR}/headroom-gui.log"
PID_FILE="${STACK_HOME}/headroom-gui.pid"
PORT="8787"
APP_PATH="${CODEXFORGE_APP_PATH:-/Applications/Codex.app}"

mkdir -p "${LOG_DIR}"

proxy_running() {
  curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1
}

start_proxy() {
  if proxy_running; then
    return
  fi

  nohup "${HEADROOM_BIN}" proxy --port "${PORT}" >"${LOG_FILE}" 2>&1 &
  echo $! > "${PID_FILE}"
  sleep 2
}

if [[ ! -x "${HEADROOM_BIN}" ]]; then
  echo "Headroom is not installed. Run ./install.sh first." >&2
  exit 1
fi

start_proxy

launchctl setenv OPENAI_BASE_URL "http://127.0.0.1:${PORT}/v1"

echo "GUI mode enabled."
echo "OPENAI_BASE_URL is now set for GUI apps via launchctl."
echo "Restart Codex.app to apply it."
echo "App path expected: ${APP_PATH}"
