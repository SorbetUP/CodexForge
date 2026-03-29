#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${1:-https://github.com/SorbetUP/CodexForge.git}"
TARGET_DIR="${2:-CodexForge}"

if [[ -e "${TARGET_DIR}" ]]; then
  echo "Target already exists: ${TARGET_DIR}" >&2
  exit 1
fi

git clone "${REPO_URL}" "${TARGET_DIR}"
cd "${TARGET_DIR}"
./install.sh

echo ""
echo "Bootstrap complete."
echo "Run: codex-stack"
