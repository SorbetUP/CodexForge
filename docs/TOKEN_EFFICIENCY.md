# Token and cost efficiency

CodexForge optimizes repeated context without making evidence unrecoverable.

## Tool-result aging

Large textual `function_call_output` and `custom_tool_call_output` entries are candidates only when they exceed the configured size floor (32 KiB by default), a later model action proves they were consumed, they are not in the newest protected frontier (4 by default), and the receipt is smaller than the original.

The exact output is stored under a SHA-256 content address with private filesystem permissions. The model receives a compact receipt with head/tail previews and a recovery command instead of an instruction to repeat the original tool call.

```bash
codex-forge output get SHA256
codex-forge output grep SHA256 'needle'
codex-forge output tail SHA256 8192
codex-forge optimizer stats
```

Additional policies:

- Keep common prompt/tool prefixes stable to improve provider cache hit probability.
- Prefer ranges, search and diffs to repeated full-file reads.
- Use OpenCodex's own conversation compaction instead of adding another independent lossy summarizer.
- Cache deterministic image transcription by image hash when a vision bridge is added.
- Route bounded mechanical work to cheaper/already-paid models, but escalate on failed verification.
- Measure successful-task cost and quality, not token count in isolation.

Environment controls: `CODEX_FORGE_TOOL_AGING`, `CODEX_FORGE_AGING_MIN_BYTES`, `CODEX_FORGE_AGING_FRONTIER`, `CODEX_FORGE_OUTPUT_STORE_MAX_BYTES`, `CODEX_FORGE_OUTPUT_STORE_TTL_MS`, and `CODEX_FORGE_MAX_REQUEST_BYTES`.
