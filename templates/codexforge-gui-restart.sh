#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${CODEXFORGE_APP_NAME:-Codex}"
APP_PATH="${CODEXFORGE_APP_PATH:-/Applications/Codex.app}"

osascript -e "tell application \"${APP_NAME}\" to quit" >/dev/null 2>&1 || true
sleep 2
open -a "${APP_PATH}"

echo "Codex.app restart requested."
