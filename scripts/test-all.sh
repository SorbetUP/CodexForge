#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node --test "$ROOT/tests/unit"/*.test.mjs "$ROOT/tests/integration"/*.test.mjs
"$ROOT/tests/e2e/real-user-flow.sh"
"$ROOT/tests/e2e/skill-learning-flow.sh"
"$ROOT/tests/e2e/benchmark-safety-flow.sh"
if [[ "${1:-}" == "--live" && "${2:-}" == "--yes" ]]; then
  "$ROOT/tests/e2e/live-opencodex-user.sh" --live --yes
fi
