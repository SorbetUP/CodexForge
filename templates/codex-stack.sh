#!/usr/bin/env bash
set -euo pipefail

HEADROOM_BIN="__HEADROOM_BIN__"

if [[ ! -x "${HEADROOM_BIN}" ]]; then
  echo "Headroom n'est pas installe. Lance d'abord install.sh" >&2
  exit 1
fi

exec "${HEADROOM_BIN}" wrap codex --no-rtk "$@"
