---
name: token-efficiency
description: Reduce Codex/LLM token usage without losing task evidence or correctness. Use for long sessions, large tool outputs, repeated repository reads, prompt/cache efficiency, context pressure, and cost analysis. Do not delete evidence merely to make token counts look smaller.
---

Optimize measured waste while preserving recoverability and task quality.

1. Measure first: request bytes/tokens, cached tokens when exposed, tool-output share, number of turns, compactions, latency, and task success.
2. Keep stable reusable instructions/tool schemas early and deterministic; move volatile request-specific content later when the provider benefits from prefix caching.
3. Avoid replaying large tool outputs after the model has already acted on them. CodexForge may age eligible old outputs, but must store the exact original content-addressably and provide a retrieval command.
4. Never re-run a side-effecting tool merely to recover an aged result.
5. Prefer targeted reads, diffs, ranges, and search results over repeatedly loading whole files/repositories.
6. Do not summarize away exact values needed for correctness. Retrieve the original by hash when needed.
7. Use OpenCodex compaction for context pressure; do not stack independent lossy compactors blindly.
8. Keep the latest tool-result frontier byte-for-byte intact.
9. Compare quality before/after on representative tasks. A token reduction is a regression if completion correctness, evidence, or recovery worsens.
