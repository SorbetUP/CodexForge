# Codex Stack

This machine uses CodexForge with OpenCodex as the primary provider/auth layer and optional token-efficiency helpers.

## Runtime

- Prefer launching through `codex-stack` so the installed Codex/OpenCodex configuration remains authoritative.
- Headroom is legacy-only and should not be enabled unless explicitly requested.
- Shell output may be compacted by RTK. Request raw output only when the task needs evidence hidden by compaction.
- If Codex Code Mode/programmatic tool calling is healthy, use it for bounded 3+ tool workflows with deterministic processing; fall back to direct tools when intermediate results need fresh model judgment.

## Project memory

- Before reading large portions of a repository, look for `.codex-memory/PROJECT.md`, `.codex-memory/DECISIONS.md`, `.codex-memory/TASKS.md`, and `.codex-memory/SESSION.md`.
- Use those files as a compact persistent summary layer, but verify stale or safety-critical facts against the repository.
- Update memory after important architectural decisions or when a task needs a clean handoff.

## Reading strategy

- Prefer targeted file reads, ranges, diffs, and `rg` over broad repository scans when the relevant area is already known.
- Avoid repeating a large tool result after acting on it. CodexForge may replace eligible old results with an exact-recovery SHA reference.
- Never rerun a side-effecting command merely to recover an aged output; use `codex-forge output get|grep|tail`.
- Use `codex-forge context audit` when instruction/skill context becomes large.

## Verification and reporting

- For code changes, run the narrowest relevant real test before claiming completion; broaden validation when the change/risk warrants it.
- Do not narrate routine tool calls. Final reports should normally contain only what changed, tests/validation, and remaining blockers/risks.
- Preserve exact errors, commands, paths, hashes, security warnings, and values needed for verification.

## Skill learning

- Reusable workflows may be staged under `.codex-forge/skill-candidates/<name>/SKILL.md` only after the task has been verified.
- Never install or overwrite a learned skill silently. Use the explicit `codex-forge skill approve` flow after review.
