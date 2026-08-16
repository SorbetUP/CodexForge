#!/usr/bin/env bash
set -euo pipefail
STACK_HOME="__STACK_HOME__"; APP_PATH="${CODEXFORGE_APP_PATH:-/Applications/Codex.app}"; failed=0
check(){ if eval "$2" >/dev/null 2>&1; then printf '[ok] %s\n' "$1"; else printf '[ko] %s\n' "$1"; failed=1; fi; }
check "OpenCodex installed" "command -v ocx"
check "OpenCodex healthy" "ocx health"
check "no GUI OPENAI_BASE_URL override" "test -z \"$(launchctl getenv OPENAI_BASE_URL 2>/dev/null || true)\""
check "Codex app installed" "test -d \"${APP_PATH}\""
printf '%s\n' "Stack home: ${STACK_HOME}"
exit "$failed"
