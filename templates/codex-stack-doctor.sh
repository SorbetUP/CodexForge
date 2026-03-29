#!/usr/bin/env bash
set -euo pipefail

STACK_HOME="__STACK_HOME__"
HEADROOM_BIN="__HEADROOM_BIN__"
CODEX_DIR="__CODEX_DIR__"

check() {
  local name="$1"
  local cmd="$2"
  if eval "${cmd}" >/dev/null 2>&1; then
    printf '[ok] %s\n' "${name}"
  else
    printf '[ko] %s\n' "${name}"
  fi
}

check "codex present" "command -v codex"
check "rtk present" "command -v rtk"
check "headroom present" "[ -x '${HEADROOM_BIN}' ]"
check "codex-stack config" "[ -f '${CODEX_DIR}/CODEX_STACK.md' ]"
check "codex AGENTS" "[ -f '${CODEX_DIR}/AGENTS.md' ]"
check "codex-stack wrapper" "~/.local/bin/codex-stack --version"

printf '%s\n' "Stack home: ${STACK_HOME}"
