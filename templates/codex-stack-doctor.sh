#!/usr/bin/env bash
set -euo pipefail
STACK_HOME="__STACK_HOME__"; HEADROOM_BIN="__HEADROOM_BIN__"; CODEX_DIR="__CODEX_DIR__"; failed=0
check(){ if eval "$2" >/dev/null 2>&1; then printf '[ok] %s\n' "$1"; else printf '[ko] %s\n' "$1"; failed=1; fi; }
info(){ if eval "$2" >/dev/null 2>&1; then printf '[ok] %s\n' "$1"; else printf '[info] %s\n' "$1"; fi; }
check "codex present" "command -v codex"
check "OpenCodex present" "command -v ocx"
check "rtk present" "command -v rtk"
check "headroom fallback present" "[ -x '${HEADROOM_BIN}' ]"
check "codex-stack config" "[ -f '${CODEX_DIR}/CODEX_STACK.md' ]"
check "CodexForge CLI" "command -v codex-forge"
check "CodexForge skills" "[ -f '${HOME}/.agents/skills/token-efficiency/SKILL.md' ]"
info "OpenCodex reachable on localhost:10100 (start/service if not)" "curl -fsS --max-time 1 http://127.0.0.1:10100/healthz"
info "CodexForge optimizer reachable on localhost:10101 (optional)" "curl -fsS --max-time 1 http://127.0.0.1:10101/_codex_forge/health"
printf '%s\n' "Stack home: ${STACK_HOME}"
exit "$failed"
