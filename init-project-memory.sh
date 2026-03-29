#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$(pwd)}"
PROJECT_DIR="$(cd "${PROJECT_DIR}" && pwd)"
MEM_DIR="${PROJECT_DIR}/.codex-memory"
AGENTS_FILE="${PROJECT_DIR}/AGENTS.md"

mkdir -p "${MEM_DIR}"

write_if_missing() {
  local file="$1"
  local content="$2"
  if [[ ! -f "${file}" ]]; then
    printf '%s\n' "${content}" > "${file}"
  fi
}

write_if_missing "${MEM_DIR}/PROJECT.md" "# Project Memory

## Purpose
- Describe the project in 5-10 lines.

## Architecture
- Key modules
- Runtime dependencies
- Entry points

## Constraints
- Coding rules
- Deployment constraints
- Performance or security requirements
"

write_if_missing "${MEM_DIR}/DECISIONS.md" "# Decisions

## ADR Log
- Date: decision, reason, impact
"

write_if_missing "${MEM_DIR}/TASKS.md" "# Persistent Tasks

## Current
- Active work items that survive across sessions

## Backlog
- Later work
"

write_if_missing "${MEM_DIR}/SESSION.md" "# Session Handoff

## Last known state
- What was changed
- What still blocks
- What to verify next
"

if [[ ! -f "${AGENTS_FILE}" ]]; then
  cat > "${AGENTS_FILE}" <<'EOF'
# AGENTS

Before scanning large parts of the repository, consult `.codex-memory/PROJECT.md`, `.codex-memory/DECISIONS.md`, `.codex-memory/TASKS.md`, and `.codex-memory/SESSION.md`.

Use those files as the default persistent memory and update them when architecture decisions, long-running tasks, or handoff state changes.

Prefer targeted reads informed by the memory files instead of re-reading the whole codebase when the task does not require it.
EOF
elif ! grep -q ".codex-memory/PROJECT.md" "${AGENTS_FILE}" 2>/dev/null; then
  cat >> "${AGENTS_FILE}" <<'EOF'

Before scanning large parts of the repository, consult `.codex-memory/PROJECT.md`, `.codex-memory/DECISIONS.md`, `.codex-memory/TASKS.md`, and `.codex-memory/SESSION.md`.
EOF
fi

printf '%s\n' "Memoire projet initialisee dans ${PROJECT_DIR}"
