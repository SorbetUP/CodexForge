---
name: forge-reviewed-change
description: Implement a bounded code change with independent preflight and post-implementation review before declaring it complete.
---

# Reviewed change

Use this skill for a relatively bounded implementation, fix, refactor, or feature that still deserves independent review.

The goal is not maximum deliberation. The goal is a cheap, evidence-based review loop that catches logic errors, regressions, missing tests, and unjustified assumptions before the task is declared done.

## Operating rules

- Treat the current/root agent as the implementer and final integrator.
- Keep subagents read-only unless a task explicitly requires an independent implementation.
- Prefer `forge_reviewer_medium` and `forge_adversary_medium` for review work.
- Give independent reviewers the task, acceptance criteria, relevant files/diff, and evidence. Do not give them another reviewer's conclusion before their first pass.
- Ask reviewers for concrete findings, not general approval. A finding should point to a file/symbol, violated requirement, failing scenario, or missing evidence.
- Do not continue merely because reviewers agree. Deterministic tests and direct inspection outrank consensus.
- Avoid style-only churn unless style causes a correctness, maintainability, or policy problem.
- Do not create commits, push, merge, or modify unrelated files unless the user asked for it.

## Workflow

### 1. Establish the target

Before editing:

1. Read relevant project instructions and, when present, the compact project memory under `.codex-memory/`.
2. Identify the smallest relevant execution path and files.
3. Write concise acceptance criteria for the requested behavior.
4. Identify the likely regression surface and the cheapest deterministic checks.

Do not scan the whole repository when targeted reads are enough.

### 2. Independent preflight

Spawn two independent read-only subagents in parallel:

- `forge_reviewer_medium`: inspect the proposed approach, relevant code path, compatibility risks, and likely missing tests.
- `forge_adversary_medium`: try to falsify the plan. Look for hidden assumptions, edge cases, a simpler explanation, or a reason the proposed change could be wrong.

Do not expose one agent's conclusions to the other before both finish.

Synthesize their evidence. Change the plan only when the evidence warrants it. If they disagree materially, inspect the disputed code or run a focused experiment before editing.

For an extremely mechanical change with no behavioral risk, one preflight reviewer is enough.

### 3. Implement narrowly

Make the smallest coherent change that satisfies the acceptance criteria.

While implementing:

- preserve existing behavior outside the requested scope;
- add or update tests close to the changed behavior when practical;
- prefer existing project patterns over inventing new abstractions;
- record an architectural decision in `.codex-memory/DECISIONS.md` only if the change actually introduces one.

### 4. Deterministic validation

Run the narrowest useful checks first, then broader checks when justified:

- targeted tests;
- typecheck/static analysis;
- lint where it has signal;
- build or runtime reproduction when behavior crosses integration boundaries.

A successful command is evidence, not proof that the implementation satisfies the request.

### 5. Independent post-review

After the implementation and initial tests, spawn two fresh review tasks in parallel:

- `forge_reviewer_medium`: review the actual diff for correctness, regressions, API/contract violations, and missing test coverage.
- `forge_adversary_medium`: assume the implementation is subtly wrong and try to construct a concrete counterexample or failure mode. Also challenge whether the tests could pass while the requested behavior is still broken.

Require severity and evidence for findings. Ignore unsupported style preferences.

### 6. Repair and re-check

For every material finding:

1. verify it against the repository or runtime;
2. fix confirmed problems;
3. rerun the affected deterministic checks.

If review-triggered fixes materially change behavior, ask one fresh reviewer to inspect the changed area again. Do not create endless review loops: after two review/fix cycles, escalate the unresolved question with stronger evidence or higher reasoning rather than spawning more identical reviewers.

### 7. Completion gate

Do not declare success until all of these are true:

- acceptance criteria are satisfied;
- relevant deterministic checks pass, or any unavailable check is explicitly identified;
- no confirmed high-severity review finding remains;
- no unresolved contradiction exists between implementation and project documentation;
- the final response distinguishes verified facts from remaining uncertainty.

Report what changed, what was tested, and any residual risk.
