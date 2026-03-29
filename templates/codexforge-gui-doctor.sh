#!/usr/bin/env bash
set -euo pipefail

STACK_HOME="__STACK_HOME__"
APP_NAME="${CODEXFORGE_APP_NAME:-Codex}"
APP_PATH="${CODEXFORGE_APP_PATH:-/Applications/Codex.app}"

check() {
  local name="$1"
  local cmd="$2"
  if eval "${cmd}" >/dev/null 2>&1; then
    printf '[ok] %s\n' "${name}"
  else
    printf '[ko] %s\n' "${name}"
  fi
}

check "launchctl OPENAI_BASE_URL set" "test \"$(launchctl getenv OPENAI_BASE_URL 2>/dev/null)\" = \"http://127.0.0.1:8787/v1\""
check "headroom proxy listening" "curl -fsS http://127.0.0.1:8787/health"
check "codex app installed" "test -d \"${APP_PATH}\""
check "codex app running" "pgrep -f '/Applications/Codex.app/Contents/MacOS/Codex|/Applications/Codex.app/Contents/Resources/codex app-server|Codex Helper'"

printf '%s\n' "Stack home: ${STACK_HOME}"
printf '%s\n' "launchctl OPENAI_BASE_URL: $(launchctl getenv OPENAI_BASE_URL 2>/dev/null || true)"
