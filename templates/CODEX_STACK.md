# Codex Stack

This machine uses a token-efficiency stack for Codex.

## Runtime

- Prefer launching Codex through `codex-stack` so requests go through Headroom.
- Shell output may be compacted by RTK. Do not expand it unless the task needs raw output.

## Project memory

- Before reading large portions of a repository, look for `.codex-memory/PROJECT.md`, `.codex-memory/DECISIONS.md`, `.codex-memory/TASKS.md`, and `.codex-memory/SESSION.md`.
- Use those files as the default persistent summary layer.
- Update them when you make important architectural decisions or when a task needs a clean handoff.

## Reading strategy

- Prefer targeted file reads over broad scans when the memory layer already identifies the relevant area.
- Use shell tools that cooperate well with RTK, especially `rg`, `find`, `head`, `tail`, and focused `git` commands.
- Only request raw or full outputs when compression hides information needed to complete the task safely.
