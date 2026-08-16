# Testing philosophy

CodexForge follows a user-equivalent validation rule: internal unit coverage is useful, but it is not proof that a user workflow works.

## Deterministic suite

```bash
scripts/test-all.sh
```

The suite includes unit tests, a real local HTTP/SSE proxy flow, exact-output recovery, negative safety checks, CLI execution from an isolated HOME, and syntax checks in CI. No provider quota is consumed.

## Live user flow

A real OpenCodex/Codex test is opt-in because it consumes real quota:

```bash
scripts/test-all.sh --live --yes
```

It creates a scratch git repository, invokes the real `codex exec` surface, asks the agent to read one file and create another, then verifies the exact resulting file.

## Paired live A/B benchmark

Use this to decide whether an optimization actually helps rather than merely deleting text:

```bash
codex-forge benchmark --live --yes --rounds 2
# lower-quota targeted run
codex-forge benchmark --live --yes --rounds 2 --task noisy-debug
```

Each pair runs the same fixture twice:

- baseline: Codex -> OpenCodex directly
- optimized: Codex -> CodexForge optimizer -> OpenCodex

Rounds alternate A/B and B/A order to reduce warm-cache/order bias. The benchmark records:

- task validation PASS/FAIL
- `input_tokens`
- `cached_input_tokens`
- `cache_write_input_tokens` when emitted by Codex
- derived uncached input tokens
- output/reasoning tokens when emitted
- wall time
- number of aged tool results and request bytes removed
- raw Codex JSONL and stderr

Reports are written under `~/.codex-forge/benchmarks/<timestamp>/` (or `$CODEX_FORGE_STATE_DIR/benchmarks/...`). Scratch repos are deleted by default; pass `--keep` to retain them.

A negative token delta is not considered a win if the optimized task fails. Provider/subscription quota semantics are not inferred from token counts unless the provider exposes them.
