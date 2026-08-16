---
name: executable-skill-harness
description: Move mandatory deterministic skill steps into executable, testable harnesses instead of asking the model to re-derive them from prose every run. Use for repetitive workflows, release/checklist procedures, migrations, validation pipelines, or any skill where skipping one required step would invalidate the result.
---

Use prose for judgment; use code for invariants.

1. Identify which skill steps are deterministic and mandatory: setup, parsing, ordering, safety gates, artifact checks, rollback checks, or final validation.
2. Put those mechanics in a small script/program under the skill directory when practical. Keep ambiguous decisions and domain judgment in `SKILL.md`.
3. Give the harness explicit inputs and machine-checkable outputs/exit codes. Do not hide failures behind best-effort success.
4. Test the harness directly with positive, negative, and interruption/partial-state cases before relying on it.
5. Never auto-run a newly generated destructive harness merely because a skill proposed it. Review it first; require explicit approval for irreversible or credential-affecting actions.
6. Keep harness output compact: final status plus decisive evidence; save verbose logs to an artifact/file and expose targeted retrieval.
7. If the harness and prose disagree, fail closed and fix the skill rather than silently choosing one.
8. Benchmark the harnessed workflow against the prose-only workflow on task success, required-step adherence, turns, tokens, latency, and recovery behavior.
