#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
export HOME="$TMP/home"
mkdir -p "$HOME" "$TMP/project/.codex-forge/skill-candidates/demo-skill"
cat > "$TMP/project/.codex-forge/skill-candidates/demo-skill/SKILL.md" <<'SKILL'
---
name: demo-skill
description: deterministic approval fixture
---
Do the verified thing.
SKILL

candidates="$(node "$ROOT/bin/codex-forge" skill candidates "$TMP/project")"
grep -qx 'demo-skill' <<<"$candidates"
node "$ROOT/bin/codex-forge" skill approve demo-skill --project "$TMP/project" >/dev/null
test -f "$TMP/project/.agents/skills/demo-skill/SKILL.md"

if node "$ROOT/bin/codex-forge" skill approve demo-skill --project "$TMP/project" >/dev/null 2>&1; then
  echo 'skill overwrite unexpectedly succeeded without --force' >&2
  exit 1
fi

touch "$TMP/project/.agents/skills/demo-skill/stale.txt"
node "$ROOT/bin/codex-forge" skill approve demo-skill --project "$TMP/project" --force >/dev/null
test ! -e "$TMP/project/.agents/skills/demo-skill/stale.txt"

node "$ROOT/bin/codex-forge" skill reject demo-skill --project "$TMP/project" >/dev/null
test ! -d "$TMP/project/.codex-forge/skill-candidates/demo-skill"
find "$TMP/project/.codex-forge/skill-rejected" -maxdepth 1 -type d -name '*-demo-skill' | grep -q .

echo '[ok] staged skill approval/rejection user flow'
