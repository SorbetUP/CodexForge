# Testing philosophy

CodexForge follows a user-equivalent validation rule: internal unit coverage is useful, but it is not proof that a user workflow works.

Run deterministic tests:

```bash
scripts/test-all.sh
```

They include unit tests, a real local HTTP/SSE proxy flow, exact-output recovery, negative safety checks, and CLI execution from an isolated HOME.

A live OpenCodex/Codex test exists but is intentionally excluded from CI because it consumes real quota:

```bash
scripts/test-all.sh --live --yes
```

The live test creates a scratch git repository, invokes the real `codex exec` surface, asks the agent to read one file and create another, then verifies the exact resulting file. It is an observable user action rather than a mocked provider assertion.
