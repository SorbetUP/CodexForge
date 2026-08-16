# Token and cost efficiency

CodexForge optimizes repeated context without making decisive evidence unrecoverable. The target metric is **successful-task cost/quality**, not raw text deletion.

## Tool-result aging

Textual `function_call_output` and `custom_tool_call_output` entries become candidates only after a later model action proves the result was consumed, they are outside the newest protected frontier (4 outputs by default), and the compact receipt is smaller than the original.

The exact original is stored under a SHA-256 content address with private filesystem permissions. The model receives a compact receipt with head/tail previews and a recovery command rather than an instruction to rerun the original tool.

```bash
codex-forge output get SHA256
codex-forge output grep SHA256 'needle'
codex-forge output tail SHA256 8192
codex-forge optimizer stats
```

### Adaptive floor

The default initial floor remains 32 KiB. With adaptive aging enabled, clearly historical results can use a lower threshold:

| later model decisions | effective default floor |
|---:|---:|
| 0-1 | 32 KiB |
| 2-3 | 16 KiB |
| 4+ | 8 KiB |

This does **not** bypass the protected frontier and does not age a result before the model has acted after it. Set `CODEX_FORGE_AGING_ADAPTIVE=0` for a fixed threshold.

## Programmatic tool calling

For bounded workflows with 3+ deterministic calls, native Codex Code Mode/PTC can be cheaper than exposing every intermediate result to the model. Keep filtering/aggregation in the program and return only decisive evidence. Fall back to direct tools if the runtime/model/provider does not expose Code Mode correctly.

`codex-forge doctor` reports whether `codex-code-mode-host` is discoverable. This is a capability hint, not a proof that a specific provider supports the feature.

## Context footprint

```bash
codex-forge context audit
codex-forge context audit --global
codex-forge context audit --json
```

The audit finds `AGENTS.md`, `SKILL.md`, and `.codex-memory` files and reports their byte/character footprint plus an explicitly rough `chars/4` token heuristic. Real provider telemetry is authoritative.

## Output-side savings

The optional `compact-output` skill removes routine tool narration, filler, repeated context, and oversized proof dumps while preserving exact code, paths, errors, hashes, security warnings, and values needed for verification.

## Cache-aware rules

- Keep stable reusable prompt/tool prefixes stable rather than rewriting them every turn.
- Prefer ranges, search, diffs, and exact retrieval over repeated full-file reads.
- Use exact tool-output aging before adding lossy summarization.
- Do not stack independent lossy compactors blindly on top of Codex/OpenCodex context management.
- Keep session/model affinity unless verification or provider failure justifies switching.
- Route bounded mechanical work to cheaper/already-paid models only when capability tests pass.
- Measure final success, retries, cache traffic, turns, latency, and quota/cost together.

## Environment controls

`CODEX_FORGE_TOOL_AGING`, `CODEX_FORGE_AGING_ADAPTIVE`, `CODEX_FORGE_AGING_MIN_BYTES`, `CODEX_FORGE_AGING_FRONTIER`, `CODEX_FORGE_OUTPUT_STORE_MAX_BYTES`, `CODEX_FORGE_OUTPUT_STORE_TTL_MS`, and `CODEX_FORGE_MAX_REQUEST_BYTES`.

See `docs/HERMES_AND_RESEARCH.md` for the mechanisms evaluated and the features intentionally deferred until live evidence justifies them.
