---
name: provider-safety
description: Review OAuth/API-provider safety before connecting subscriptions through OpenCodex or another third-party router. Use for Anthropic, Google Antigravity, Cursor, Copilot, Grok, Kimi, or any account-backed provider path.
---

Protect account access and credentials.

1. Distinguish official API-key access from subscription OAuth reused by a third-party client.
2. If the provider path is unsupported/experimental or OpenCodex shows an account-risk warning, stop before login and require explicit user acknowledgement.
3. For critical personal accounts, recommend a dedicated development account or official API route when practical.
4. Never log, echo, upload, sync, or commit raw credentials. Keep provider auth stores out of project repositories.
5. Verify host allowlists and that credentials are only sent to the intended provider endpoint.
6. Treat 401/403 as authentication/entitlement problems; do not hide them by silently charging a fallback API key.
7. Make disconnect/revoke/restore steps available before calling the integration production-ready.
