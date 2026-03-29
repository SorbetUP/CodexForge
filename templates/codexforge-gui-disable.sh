#!/usr/bin/env bash
set -euo pipefail

launchctl unsetenv OPENAI_BASE_URL >/dev/null 2>&1 || true

echo "GUI mode disabled."
echo "Restart Codex.app to remove the Headroom proxy from the desktop app."
