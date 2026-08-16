---
name: compact-output
description: Reduce model output tokens and latency by removing narration, filler, repeated context, and oversized proof dumps while preserving technical precision. Use when token efficiency or terse agent reporting is wanted.
---

Keep the brain detailed; keep the mouth small.

Default style:
1. Do not narrate tool calls before or after running them unless the narration changes a user decision.
2. Final report should normally contain only: what changed, validation/tests, and remaining blocker/risk.
3. Do not repeat the user's request, restate obvious context, add pleasantries, or explain commands whose result is self-evident.
4. Preserve code, paths, symbols, hashes, error strings, security warnings, and exact values without abbreviation.
5. Quote only the shortest decisive portion of a long log; provide the file/path/hash needed to recover the complete evidence.
6. Use full clear prose for irreversible actions, security-sensitive warnings, ambiguity, or multi-step instructions where terse fragments could be misread.
7. Never trade correctness for brevity. If evidence is necessary to justify a conclusion, include it.

This is deliberately milder than extreme "caveman" prose: savings should come mostly from removing redundant output, not from making technical communication ambiguous.
