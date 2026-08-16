---
name: real-user-validation
description: Validate CodexForge or an agent feature with concrete user-equivalent tests, negative cases, and observable outcomes. Use when asked to prove something works, production-readiness, regression testing, or to reproduce a user workflow. Do not accept mocks alone as proof of a user-facing path.
---

Treat "works" as an observable contract, not a code-path claim.

1. Reproduce the same public command/UI/API surface a user exercises.
2. Create an isolated temporary HOME/CODEX_HOME/workspace unless the test explicitly targets the real profile.
3. Assert final artifacts and externally visible state: files, exit codes, HTTP bodies, streamed events, config restoration, or rendered/UI state.
4. Include at least one negative/adversarial case for every state-changing path: missing dependency, malformed input, pre-existing user config, interruption, quota/provider failure, or rollback.
5. Unit tests may localize bugs but never replace the end-to-end proof.
6. Never spend provider quota in CI. Live provider tests require both `--live` and `--yes`.
7. Fail if a test merely checks that a function was called. Prefer actual process execution, real HTTP sockets, filesystem state, and the same CLI a user runs.
8. For code-changing work, do not claim completion before running the narrowest relevant real test/build/lint. If it fails, keep working unless an external blocker makes further progress impossible.
9. Verification itself has a cost. Start narrow, then broaden only when the change or risk warrants it; do not rerun a full suite after every tiny edit.
10. Report exactly what was tested, what was not, and any remaining environment-dependent risk.

For CodexForge run `scripts/test-all.sh`. For a real provider path run `scripts/test-all.sh --live --yes` only with explicit permission to consume quota. For cost/quality comparison use `codex-forge benchmark --live --yes`.
