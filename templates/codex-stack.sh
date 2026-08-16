#!/usr/bin/env bash
set -euo pipefail
HEADROOM_BIN="__HEADROOM_BIN__"

# OpenCodex owns Codex provider/auth routing. Do not put Headroom in front of it by default,
# because that would replace the OpenCodex base URL and defeat subscription/provider routing.
if command -v ocx >/dev/null 2>&1 && [[ "${CODEX_FORGE_LEGACY_HEADROOM:-0}" != "1" ]]; then
  exec codex "$@"
fi
if [[ ! -x "${HEADROOM_BIN}" ]]; then
  echo "Neither OpenCodex nor Headroom is available. Run install.sh" >&2
  exit 1
fi
exec "${HEADROOM_BIN}" wrap codex --no-rtk "$@"
