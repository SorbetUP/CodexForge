---
name: programmatic-tool-calling
description: Reduce agent turns and intermediate context by batching deterministic multi-tool workflows in Codex code mode/programmatic tool calling when that runtime is healthy. Use for 3+ dependent tool calls, loops, filtering large results, fan-out/fan-in, or structured extraction. Do not use when every intermediate result needs fresh model judgment.
---

Use a programmatic tool/runtime only when it removes model round-trips without hiding evidence required for correctness.

1. Prefer normal direct tools for one or two calls, interactive decisions, or steps whose result changes the reasoning strategy.
2. Prefer Code Mode/PTC for bounded workflows with 3+ calls, deterministic branching, loops, retries, joins, or filtering/reduction of large tool outputs.
3. Keep intermediate bulk data inside the program whenever possible; return only the compact evidence the model needs plus exact references/paths for recovery.
4. Never suppress a decisive failure, security warning, test assertion, exact identifier, or value needed by the next reasoning step.
5. Set explicit limits: timeouts, maximum calls, maximum stdout, and no recursive agent spawning unless the task explicitly requires it.
6. Treat credentials as host-owned. Do not copy API keys/tokens into generated scripts or logs.
7. If Codex code mode/PTC is unavailable or unhealthy, fall back to ordinary tools instead of repeatedly retrying the broken runtime.
8. Benchmark on representative tasks: final success, evidence completeness, turns, input/output tokens, cache usage, latency, and cost/quota. Fewer calls alone are not a win.

CodexForge `doctor` reports whether a `codex-code-mode-host` executable is discoverable. That is only a capability signal, not proof that the current model/provider exposes Code Mode correctly.
