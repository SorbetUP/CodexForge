# Hermes and research-derived improvements

CodexForge borrows mechanisms, not branding or provider state. OpenCodex remains the account/provider layer and Codex remains the agent runtime.

## Integrated

### 1. Programmatic tool calling / Code Mode

Hermes' `execute_code` keeps intermediate tool results outside the model context and returns only the script's selected output. CodexForge does not reimplement a second RPC tool runtime; the `programmatic-tool-calling` skill prefers native Codex Code Mode/PTC when its host is available, with direct-tool fallback when it is not.

Best fit: 3+ bounded calls with filtering, fan-out/fan-in, aggregation, or deterministic branching. Poor fit: steps that each require fresh model judgment.

### 2. Skill learning, but approval-gated

Hermes treats skills as procedural memory. CodexForge adds a staging flow:

```text
verified recurring workflow
  -> .codex-forge/skill-candidates/<name>/SKILL.md
  -> review
  -> codex-forge skill approve <name>
```

The agent may propose/stage a skill after a verified task, but it may not silently install or overwrite it. `skill reject` archives rejected candidates.

### 3. Cheap pruning before lossy compression

Hermes first removes old verbose tool results before asking a model to summarize the conversation. CodexForge keeps this stage losslessly recoverable: old consumed tool outputs are replaced with a SHA-256 receipt while the exact bytes stay in the local output store.

Adaptive aging lowers the size floor only as an output becomes clearly historical:

- baseline: 32 KiB
- >=2 later model decisions: 16 KiB
- >=4 later model decisions: 8 KiB
- newest 4 tool outputs remain protected byte-for-byte

Set `CODEX_FORGE_AGING_ADAPTIVE=0` to keep a fixed floor.

### 4. Context observability

`codex-forge context audit` reports instruction/skill/memory footprint so context growth is visible before adding another summarizer. It deliberately labels token counts as rough estimates; real Codex/provider usage telemetry is authoritative.

### 5. Verify before stopping

User-facing code work should finish on an observable validation result. Skills now make this an explicit completion gate rather than relying on the model to remember a prose checklist.

### 6. Compact agent speech

A `compact-output` skill removes tool narration, filler, repeated context and decorative output while preserving commands, paths, code, errors and safety warnings. The objective is smaller **output** without weakening internal reasoning or evidence.

Evaluate it with at least three arms when practical:

1. normal/default response style;
2. a generic terse control such as "answer concisely";
3. the specialized `compact-output` skill.

The incremental skill gain is arm 3 versus arm 2. Comparing only arm 1 versus arm 3 confounds the effect of the skill with the generic benefit of simply asking for shorter answers.

### 7. Executable skill harnesses

Recent skill-harness research suggests prose-only skills can lose mandatory steps because the model reinterprets the procedure on every run. `executable-skill-harness` therefore moves deterministic invariants into tested code and leaves model judgment in prose.

## Intentionally deferred

### A second always-on LLM compressor

Hermes can use a cheap auxiliary model for context compression. CodexForge does not enable another lossy compressor on top of Codex/OpenCodex by default. Compression can reduce visible tokens while worsening cache economics, trajectory length, or task success. Add it only after paired live measurement shows lower success-adjusted cost.

### Continuous micro-compaction

Hermes supports incremental micro-compaction after turns. It is interesting for latency smoothing, but every pass is another model call. CodexForge currently prefers exact tool aging plus the native context engine until live benchmarks justify the extra calls.

### Aggressive per-turn model switching

Cheap/strong model cascades can help, but switching can destroy prompt-cache locality and create behavioral discontinuities. Keep session affinity by default; escalate on verification failure or provider/quota failure, and benchmark the full successful-task cost.

### Blind autonomous self-modification

A model may stage a learned skill; it may not approve its own persistent behavior change. This is deliberately stricter than fully autonomous skill learning.

## Measurement rule

Do not optimize `bytes removed` or `tokens removed` in isolation. The live A/B benchmark records quality, input/cached/uncached/output tokens, wall time, and optimizer effects on paired real tasks. A cheaper-looking arm that fails validation is a regression.

## Sources

- Hermes Agent code execution / PTC: https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/code-execution.md
- Hermes context compression/caching: https://github.com/NousResearch/hermes-agent/blob/main/website/docs/developer-guide/context-compression-and-caching.md
- Hermes context engine plugins: https://github.com/NousResearch/hermes-agent/blob/main/website/docs/developer-guide/context-engine-plugin.md
- Hermes micro-compaction: https://github.com/NousResearch/hermes-agent/blob/main/docs/micro-compaction.md
- Caveman skill/eval methodology: https://github.com/JuliusBrussee/caveman
- SIGIL executable skill-harness paper: https://arxiv.org/abs/2607.27309
- Token Reduction Is Not Cost Reduction: https://arxiv.org/abs/2607.12161
