---
name: forge-project-build
description: Build or substantially redesign a software project from a technical specification using staged architecture, implementation, independent review, and validation gates.
---

# Project build

Use this skill for large, long-horizon engineering work: starting a project from zero, implementing a substantial technical specification, major rewrites, or multi-phase architecture changes.

The objective is sustained correctness over many steps. Do not treat a large project as one giant coding turn.

## Reasoning and delegation profile

- The root agent owns integration, sequencing, and final decisions.
- Use `forge_architect_high` for architecture, specification decomposition, architecture-drift checks, and difficult cross-cutting decisions.
- Use `forge_reviewer_medium` for bounded code, contract, test, security, performance, and documentation reviews.
- Use `forge_adversary_medium` to attack assumptions and reviewer conclusions.
- Prefer multiple focused medium-effort reviews over high effort everywhere.
- Escalate a disputed or genuinely difficult question to high reasoning only after gathering concrete evidence.
- Do not silently multiply agents when the work is sequential or they would edit the same files.

Independent reviewers should not see each other's conclusions until after their first pass.

## Phase 0: ingest the source of truth

Before designing or coding:

1. Read the technical specification, project instructions, and relevant existing documentation completely enough to identify requirements and constraints.
2. Read `.codex-memory/PROJECT.md`, `DECISIONS.md`, `TASKS.md`, and `SESSION.md` when they exist.
3. Inspect the repository structure and existing implementation only as deeply as needed to understand constraints.
4. Build a requirement ledger with stable IDs such as `R1`, `R2`, ... for externally observable requirements, important non-functional constraints, and explicit exclusions.
5. Mark ambiguities instead of silently inventing requirements.

If the project is new and project memory is absent, create or initialize the memory layer before sustained implementation.

## Phase 1: architecture before implementation

Spawn three independent read-only workstreams in parallel:

- `forge_architect_high`: propose the minimum architecture that satisfies the specification, including boundaries, data flow, interfaces, deployment/runtime assumptions, and major trade-offs.
- `forge_reviewer_medium`: audit the specification for missing requirements, incompatible assumptions, migration/integration constraints, and testability.
- `forge_adversary_medium`: try to break the proposed direction before code exists. Look for failure modes, security boundaries, scaling/performance traps, lifecycle problems, and simpler alternatives.

The root agent synthesizes these into:

- an architecture outline;
- a phased implementation plan;
- explicit acceptance criteria per phase;
- a risk register;
- a test strategy;
- a mapping from requirements to planned components/tests.

Record durable architectural choices in `.codex-memory/DECISIONS.md` and actionable phases in `.codex-memory/TASKS.md`.

Do not begin broad implementation while a fundamental architecture contradiction remains unresolved.

## Phase 2: build in vertical slices

Prefer end-to-end vertical slices over implementing every layer separately.

For each slice:

1. State which requirement IDs it satisfies.
2. Identify interfaces and files it is allowed to change.
3. Ask a `forge_reviewer_medium` subagent to inspect the relevant existing code/contracts and flag hidden dependencies.
4. Ask a `forge_adversary_medium` subagent, independently, to identify likely failure cases and assumptions the slice plan relies on.
5. Implement the slice.
6. Add deterministic tests or a reproducible validation path.
7. Run the narrow validation suite.
8. Perform the review gate below.
9. Update project memory before moving to the next substantial slice.

Parallel implementation is allowed only when components have clear ownership and do not contend over the same mutable files or state.

## Per-slice review gate

After initial validation, run independent reviews in parallel. Give each reviewer a narrow role rather than asking several agents the same generic question.

Use `forge_reviewer_medium` for separate tasks such as:

- correctness and contract compliance;
- test adequacy and false-green scenarios;
- security/data-validation boundaries;
- performance/resource risks when relevant;
- integration and backward-compatibility risks.

Then use `forge_adversary_medium` to inspect the implementation plus the reviewers' findings and answer a different question:

> What material failure could all of these reviews still have missed, and which conclusion is least supported by evidence?

The adversary is a critic of the evidence and review process, not another vote.

The root agent verifies material findings, fixes confirmed defects, reruns affected checks, and only then closes the slice.

After two review/fix cycles on the same unresolved issue, stop spawning equivalent reviewers. Gather stronger runtime evidence or escalate that specific question to high reasoning.

## Phase boundaries

Before advancing to a new major phase, ask `forge_architect_high` to perform an architecture-drift review:

- Does the implemented system still match the documented boundaries and data flow?
- Did local fixes introduce accidental coupling or duplicated concepts?
- Are earlier assumptions invalidated?
- Does the next phase require an architecture decision now?

Also run integration tests that exercise the completed phases together.

Update:

- `.codex-memory/PROJECT.md` for the current architecture;
- `.codex-memory/DECISIONS.md` for durable decisions;
- `.codex-memory/TASKS.md` for completed and remaining work;
- `.codex-memory/SESSION.md` with a compact handoff state.

## Final system gate

Before declaring the project complete:

1. Build a requirement traceability table: every requirement ID must map to implementation evidence and validation evidence.
2. Run the broadest practical deterministic suite: tests, typecheck/static analysis, lint where useful, build/package, and representative runtime/integration flows.
3. Run independent final reviews:
   - architecture/spec compliance with `forge_architect_high`;
   - correctness/regression/test review with `forge_reviewer_medium`;
   - adversarial failure analysis with `forge_adversary_medium`.
4. Review security and performance explicitly when they are relevant to the project, not as generic checkbox prose.
5. Check installation/deployment/configuration from a clean or representative environment when practical.
6. Ensure technical documentation reflects the implemented system, not the original plan when those differ legitimately.
7. Search for temporary stubs, TODOs, disabled checks, hard-coded test values, and dead compatibility paths introduced during implementation.

A project is not complete because all agents agree. It is complete when requirements are traceable to implementation and evidence, material review findings are resolved, and the system passes its defined gates.

## Final report

Summarize:

- implemented scope;
- architecture and important decisions;
- requirement coverage;
- validation performed and results;
- unresolved risks or unavailable validations;
- deliberate deviations from the specification and why.

Never hide partial completion behind a successful-looking summary.
