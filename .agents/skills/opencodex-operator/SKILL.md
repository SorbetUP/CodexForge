---
name: opencodex-operator
description: Configure, diagnose, and validate OpenCodex as the provider/auth layer for CodexForge. Use for OpenCodex installation, accounts, model routing, health, doctor, or Codex integration. Do not use to bypass provider safety or silently alter OAuth accounts.
---

Operate OpenCodex as the single owner of provider credentials and model routing.

1. Inspect before changing: `ocx status`, `ocx health`, `ocx doctor`.
2. Never print, copy, or commit OAuth tokens, API keys, authorization headers, or `~/.opencodex/auth.json`.
3. Prefer OpenCodex's normal loopback integration on `127.0.0.1:10100`; do not invent a second provider registry in CodexForge.
4. When adding OAuth, explain provider-specific third-party-login risk before authentication. Never auto-enable a risky subscription OAuth path.
5. After provider/config changes, run `ocx ready --wait --timeout 30` and open a fresh Codex task before declaring success.
6. For a real validation, use `tests/e2e/live-opencodex-user.sh --live --yes`; it intentionally requires explicit opt-in because it consumes real quota.
7. Keep all changes reversible. If enabling the CodexForge optimizer, use `codex-forge optimizer enable`; it only accepts the exact OpenCodex loopback URL.
