---
name: skill-learning
description: Turn a successfully verified, reusable workflow into a staged Codex skill candidate without silently self-modifying installed skills. Use after complex tasks, recovered dead ends, repeated workflows, or meaningful user corrections.
---

Skills are procedural memory. Learn only from demonstrated success, and require review before activation.

After a non-trivial task, consider staging a candidate only when at least one is true:
- the task required several tool calls and the same procedure is likely to recur;
- an initial approach failed and a non-obvious recovery path worked;
- the user corrected an important workflow assumption;
- a repeatable validation/debug/deployment sequence was discovered.

Before staging:
1. Verify the task outcome with the real user-facing test or observable artifact.
2. Generalize the procedure; remove repository-specific accidents, temporary paths, account IDs, secrets, and one-off values.
3. Keep the skill narrow. Prefer one reliable procedure over a large grab-bag prompt.
4. Record failure conditions and when *not* to use the skill.
5. Keep exact commands/code only when they are stable and safe.

Stage, do not install automatically:

`.codex-forge/skill-candidates/<slug>/SKILL.md`

Optionally add `EVIDENCE.md` containing the task, validation command, result, and why the procedure generalizes. Never put secrets or hidden credentials in either file.

Human/explicit approval path:
- `codex-forge skill candidates`
- `codex-forge skill approve <slug>` for the current project's `.agents/skills`
- `codex-forge skill approve <slug> --global` only when global reuse is intended
- `codex-forge skill reject <slug>` to archive a rejected candidate

Never overwrite an installed skill unless the approving command uses `--force` after the diff has been reviewed.
