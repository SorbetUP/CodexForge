---
name: token-efficiency
description: Reduce Codex/LLM token usage without losing task evidence or correctness. Use for long sessions, large tool outputs, repeated repository reads, prompt/cache efficiency, context pressure, and cost analysis. Do not delete evidence merely to make token counts look smaller.
---

Optimize measured waste while preserving recoverability and task quality.

1. Measure first: request/input tokens, cached tokens, cache writes when exposed, tool-output share, number of turns, compactions, latency, and task success. Use `codex-forge context audit` for instruction-size hotspots and the live A/B benchmark for provider-reported usage.
2. Keep stable reusable instructions/tool schemas early and deterministic; move volatile request-specific content later when the provider benefits from prefix caching.
3. Avoid replaying large tool outputs after the model has already acted on them. CodexForge may age eligible old outputs, but must store the exact original content-addressably and provide a retrieval command.
4. Never re-run a side-effecting tool merely to recover an aged result.
5. Prefer targeted reads, diffs, ranges, and search results over repeatedly loading whole files/repositories.
6. For deterministic 3+ tool workflows, prefer healthy Code Mode/programmatic tool calling so intermediate bulk results can be filtered outside model context. Fall back to direct tools when fresh model judgment is required.
7. Do not summarize away exact values needed for correctness. Retrieve the original by hash when needed.
8. Use the provider/OpenCodex compaction path for context pressure; do not stack independent lossy compactors blindly. A cheap auxiliary summarizer is useful only after benchmarked quality checks.
9. Keep the latest tool-result frontier byte-for-byte intact.
10. Keep final agent reports compact: changed artifacts, validation, blockers. Remove narration/filler before removing evidence.
11. Compare quality before/after on representative tasks. A token reduction is a regression if completion correctness, evidence, or recovery worsens.
