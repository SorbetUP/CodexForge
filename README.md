# CodexForge

[![CI](https://github.com/SorbetUP/CodexForge/actions/workflows/ci.yml/badge.svg)](https://github.com/SorbetUP/CodexForge/actions/workflows/ci.yml)

Portable quality + token-efficiency stack for Codex, with **OpenCodex as the primary provider/auth layer**.

CodexForge combines OpenCodex for accounts/providers/model routing, a conservative exact-recovery token optimizer, RTK for compact shell output, Headroom as a legacy fallback, persistent project memory, focused Codex skills, learned-skill staging, context auditing, and user-equivalent automated validation.

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

OpenCodex is the source of truth for credentials/providers instead of CodexForge rebuilding an account system.

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
codex-forge optimizer disable   # restore direct OpenCodex routing
```

The config editor is fail-closed: it only rewrites the exact standard local OpenCodex URL and refuses an unknown/corporate/custom `openai_base_url`.

### Exact + adaptive tool-output aging

Old tool results are eligible only after the model has acted on them and after they leave the newest protected frontier. The exact original is stored locally by SHA-256 rather than asking the model to rerun a potentially side-effecting tool.

Default threshold starts at 32 KiB and, when adaptive aging is enabled, drops to 16 KiB after 2 later model decisions and 8 KiB after 4. The newest 4 tool outputs remain byte-for-byte protected.

```bash
codex-forge output get SHA256
codex-forge output grep SHA256 'needle'
codex-forge output tail SHA256 8192
```

Disable the adaptive threshold with `CODEX_FORGE_AGING_ADAPTIVE=0`. See [`docs/TOKEN_EFFICIENCY.md`](docs/TOKEN_EFFICIENCY.md).

## Context audit

Before adding another summarizer, measure how much persistent instruction/memory context exists:

```bash
codex-forge context audit
codex-forge context audit --global
codex-forge context audit --json
```

The displayed token number is intentionally marked as a rough character heuristic; provider-reported usage remains the source of truth.

## Skills

CodexForge installs focused skills from `.agents/skills` to `$HOME/.agents/skills`:

- `$opencodex-operator`
- `$real-user-validation`
- `$token-efficiency`
- `$cost-quality-routing`
- `$provider-safety`
- `$programmatic-tool-calling`
- `$skill-learning`
- `$compact-output`
- `$executable-skill-harness`

The catalog stays narrow and progressively loaded. Deterministic mandatory mechanics should move into tested harnesses instead of growing giant prose prompts.

### Learned skills with explicit approval

After a verified reusable workflow, an agent may stage:

```text
.codex-forge/skill-candidates/<name>/SKILL.md
```

Review/activate it explicitly:

```bash
codex-forge skill candidates
codex-forge skill approve <name>
codex-forge skill approve <name> --global
codex-forge skill reject <name>
```

Installed skills are never overwritten unless `--force` is explicitly supplied. Candidates are never self-approved.

## Programmatic tool calling

The `$programmatic-tool-calling` skill borrows the useful Hermes pattern of keeping multi-call deterministic processing outside the main model context. CodexForge prefers **native Codex Code Mode/PTC** rather than implementing a second tool RPC runtime. `codex-forge doctor` reports whether a code-mode host is discoverable and the skill falls back to direct tools if it is not healthy.

## Tests: prove it like a user

```bash
codex-forge test
# or
scripts/test-all.sh
```

The deterministic suite uses actual local HTTP sockets, streamed SSE, subprocess CLI calls, isolated HOME/state directories, exact filesystem assertions, staged-skill approval/rejection, and negative safety checks. Unit tests supplement rather than replace user-facing flows.

A real provider test is opt-in because it consumes quota:

```bash
scripts/test-all.sh --live --yes
```

See [`docs/TESTING.md`](docs/TESTING.md).

## Real cost/quality A/B benchmark

Raw bytes removed are not the target. Compare the same real Codex task with and without the optimizer:

```bash
codex-forge benchmark --live --yes --rounds 2
# cheaper focused experiment
codex-forge benchmark --live --yes --rounds 2 --task noisy-debug
```

The benchmark counterbalances A/B order and records task PASS/FAIL, input/cached/uncached/output tokens reported by Codex, wall time, aged results, and request bytes removed. Reports and raw JSONL are saved under `~/.codex-forge/benchmarks/`.

An optimized failure is always a regression even if tokens fall. Subscription quota/billing is not inferred when the provider does not expose it.

## Synthetic optimizer benchmark

```bash
node scripts/benchmark-aging.mjs
```

This reports controlled byte savings only. It does not claim equivalent billed-token or dollar savings.

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

The GUI helper preserves OpenCodex as the default route. Legacy Headroom GUI routing remains available only with `CODEX_FORGE_LEGACY_HEADROOM=1`.

## Research-derived policy

Useful mechanisms taken from Hermes and adjacent agent work are documented in [`docs/HERMES_AND_RESEARCH.md`](docs/HERMES_AND_RESEARCH.md). The important design choice is what **not** to enable blindly: no second always-on lossy compressor, no autonomous persistent skill rewrite, and no aggressive model switching without paired success/cost evidence.

## Legacy Headroom fallback

When OpenCodex is installed, `codex-stack` launches Codex directly so OpenCodex's config remains authoritative. To intentionally use the old wrapper:

```bash
CODEX_FORGE_LEGACY_HEADROOM=1 codex-stack
```

## Uninstall

```bash
./uninstall.sh
```

The uninstaller restores direct OpenCodex routing if the optimizer is enabled and leaves OpenCodex installed because it may be used independently.
