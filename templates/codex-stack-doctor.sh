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
check "reviewed-change skill" "[ -f '${CODEX_DIR}/skills/forge-reviewed-change/SKILL.md' ]"
check "project-build skill" "[ -f '${CODEX_DIR}/skills/forge-project-build/SKILL.md' ]"
check "medium reviewer agent" "[ -f '${CODEX_DIR}/agents/forge-reviewer-medium.toml' ]"
check "medium adversary agent" "[ -f '${CODEX_DIR}/agents/forge-adversary-medium.toml' ]"
check "high architect agent" "[ -f '${CODEX_DIR}/agents/forge-architect-high.toml' ]"
check "codex-stack wrapper" "~/.local/bin/codex-stack --version"

printf '%s\n' "Stack home: ${STACK_HOME}"
