# OpenCodex integration

CodexForge uses OpenCodex as its provider and authentication layer. It does not duplicate OpenCodex's OAuth store, account pool, catalog, or protocol adapters.

## Install and initialize

```bash
codex-forge opencodex install --yes
ocx start
ocx init
ocx doctor
ocx gui
```

For a persistent background service:

```bash
codex-forge opencodex service
```

OpenCodex normally owns `openai_base_url = "http://127.0.0.1:10100/v1"` in the Codex config.

## Optional CodexForge optimizer

```bash
codex-forge optimizer start
codex-forge optimizer enable
```

The path becomes `Codex -> CodexForge :10101 -> OpenCodex :10100 -> provider`.
Disable it with `codex-forge optimizer disable`.

The enable/disable command refuses to touch an unknown/custom `openai_base_url`. It only rewrites the exact local OpenCodex route, so a corporate or user-owned gateway is not overwritten accidentally.

## OAuth safety

Subscription OAuth can be less stable and less officially supported than provider API access. Never make risky OAuth automatic. Keep `~/.opencodex/auth.json` private and do not sync it with a repository.
