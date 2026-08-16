# CodexForge

[![CI](https://github.com/SorbetUP/CodexForge/actions/workflows/ci.yml/badge.svg)](https://github.com/SorbetUP/CodexForge/actions/workflows/ci.yml)

Portable quality + token-efficiency stack for Codex, with **OpenCodex as the primary provider/auth layer**.

CodexForge now combines OpenCodex for accounts/providers/model routing, a conservative exact-recovery token optimizer, RTK for compact shell output, Headroom as a legacy fallback, persistent project memory, focused Codex skills, and user-equivalent automated validation.

## Quick start

```bash
git clone https://github.com/SorbetUP/CodexForge.git
cd CodexForge
./install.sh
ocx start
ocx init
ocx doctor
codex-stack-doctor
codex-stack
```

`install.sh` installs OpenCodex but deliberately does not authenticate accounts or accept risky OAuth warnings for you.

## OpenCodex

CodexForge treats OpenCodex as the source of truth for credentials/providers instead of rebuilding its account system.

```bash
codex-forge opencodex doctor
codex-forge opencodex gui
codex-forge opencodex service
```

See [`docs/OPENCODEX.md`](docs/OPENCODEX.md).

## Optional token optimizer

```text
Codex -> CodexForge optimizer :10101 -> OpenCodex :10100 -> provider
```

```bash
codex-forge optimizer start
codex-forge optimizer enable
codex-forge optimizer stats
# restore direct OpenCodex routing
codex-forge optimizer disable
```

The config editor is fail-closed: it only rewrites the exact standard local OpenCodex URL and refuses an unknown/corporate/custom `openai_base_url`.

### Exact tool-output recovery

Inspired by Codex Router's tool-result aging, CodexForge stops replaying eligible old large tool results after the model has acted on them. The exact original is stored locally under SHA-256 with private permissions, rather than telling the model to rerun a potentially side-effecting tool.

```bash
codex-forge output get SHA256
codex-forge output grep SHA256 'needle'
codex-forge output tail SHA256 8192
```

Defaults: 32 KiB minimum, newest 4 tool outputs protected byte-for-byte, 512 MiB bounded exact-output store, 7-day retention. See [`docs/TOKEN_EFFICIENCY.md`](docs/TOKEN_EFFICIENCY.md).

## Skills

CodexForge includes focused skills under `.agents/skills` and installs them to `$HOME/.agents/skills`:

- `$opencodex-operator`
- `$real-user-validation`
- `$token-efficiency`
- `$cost-quality-routing`
- `$provider-safety`

They follow Codex's current `SKILL.md` model and stay deliberately narrow so the skill catalog itself remains cheap in context.

## Tests: proof like a user

```bash
codex-forge test
# or
scripts/test-all.sh
```

The deterministic suite uses actual local HTTP sockets, streamed SSE, subprocess CLI calls, isolated HOME/state directories, exact filesystem assertions and negative safety checks. Unit tests supplement rather than replace the user-facing flow.

A real provider test is opt-in because it consumes quota:

```bash
scripts/test-all.sh --live --yes
```

It initializes a scratch git repo, invokes the real `codex exec` surface, asks the agent to read a file and create another, then verifies the exact artifact. See [`docs/TESTING.md`](docs/TESTING.md).

## Synthetic optimizer benchmark

```bash
node scripts/benchmark-aging.mjs
```

This reports controlled byte savings, not claimed billed-token savings. Real savings depend on tokenizer, provider caching and workload.

## Project memory

```bash
./init-project-memory.sh /path/to/project
```

Creates `.codex-memory/{PROJECT,DECISIONS,TASKS,SESSION}.md` plus compact `AGENTS.md` guidance so Codex can reuse durable state rather than repeatedly rediscovering the repository.

## GUI app (macOS)

```bash
codexforge-gui-enable
codexforge-gui-restart
codexforge-gui-doctor
codexforge-gui-disable
```

The GUI helper now preserves OpenCodex as the default route. A launchctl `OPENAI_BASE_URL` override would bypass OpenCodex, so it is removed in normal mode. Legacy Headroom GUI routing remains available only with `CODEX_FORGE_LEGACY_HEADROOM=1`.

## Legacy Headroom fallback

When OpenCodex is installed, `codex-stack` launches Codex directly so OpenCodex's config remains authoritative. To intentionally use the old wrapper:

```bash
CODEX_FORGE_LEGACY_HEADROOM=1 codex-stack
```

## Cost/quality principles

Keep reusable prompt/tool prefixes stable, avoid volatile data in common prefixes, prefer targeted reads and diffs, use OpenCodex's context compaction, cache deterministic expensive preprocessing, and escalate reasoning/model strength only when verification says the cheaper path is insufficient. Provider-specific caching flags are not injected blindly into arbitrary routed requests.

## Uninstall

```bash
./uninstall.sh
```

The uninstaller restores direct OpenCodex routing if the optimizer is enabled and leaves OpenCodex installed because it may be used independently.
