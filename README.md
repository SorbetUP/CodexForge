# CodexForge

[![CI](https://github.com/SorbetUP/CodexForge/actions/workflows/ci.yml/badge.svg)](https://github.com/SorbetUP/CodexForge/actions/workflows/ci.yml)

Portable token-efficiency stack for Codex.

CodexForge bundles:

- `Headroom` to compress LLM traffic through a local proxy
- `RTK` to compact shell output before it reaches Codex
- a Codex-native persistent memory layer inspired by `MemStack`

The goal is simple: spend fewer tokens, keep multi-session work usable longer, and make the setup easy to reinstall on a new machine.

## Quick Start

```bash
git clone https://github.com/SorbetUP/CodexForge.git
cd CodexForge
./install.sh
codex-stack-doctor
codex-stack
```

## Try It Now

If you want to test it immediately on your current machine:

```bash
cd /Users/sorbet/Desktop/Dev/agent/CodexForge
./install.sh
~/.local/bin/codex-stack-doctor
~/.local/bin/codex-stack --version
```

Expected result:

- `codex-stack-doctor` should show only `[ok]`
- `codex-stack --version` should print the Headroom wrapper banner, then `codex-cli ...`

## What It Does

- installs `Headroom` into an isolated virtualenv under `~/.codex-stack/venv`
- installs `RTK` if missing
- creates a `codex-stack` launcher in `~/.local/bin`
- routes Codex through `Headroom` with `headroom wrap codex --no-rtk`
- configures `RTK` globally for Codex via `rtk init -g --codex`
- adds global Codex guidance in `~/.codex/CODEX_STACK.md`
- avoids polluting every project with auto-generated local `AGENTS.md` files
- provides a script to initialize persistent project memory

## Install

```bash
git clone https://github.com/SorbetUP/CodexForge.git
cd CodexForge
./install.sh
```

Then launch Codex with:

```bash
codex-stack
```

## Verify

```bash
codex-stack-doctor
```

You can also check that Codex launches through Headroom:

```bash
codex-stack --version
```

## Project Memory

In any project:

```bash
./init-project-memory.sh /path/to/project
```

The script creates:

- `.codex-memory/PROJECT.md`
- `.codex-memory/DECISIONS.md`
- `.codex-memory/TASKS.md`
- `.codex-memory/SESSION.md`
- `AGENTS.md` with compact rules that push Codex to reuse memory instead of re-reading the whole repository

## Uninstall

```bash
./uninstall.sh
```

## Notes

- `MemStack` is designed for Claude Code. CodexForge adapts the same useful idea, persistent compact memory, using files and conventions that Codex can read directly.
- `Headroom` does not permanently rewrite your whole shell environment. `OPENAI_BASE_URL` is injected by `codex-stack`.
- `RTK` remains globally installed because that is how it integrates with Codex.
- Sources: [Headroom](https://github.com/chopratejas/headroom), [RTK](https://github.com/rtk-ai/rtk), [MemStack](https://github.com/cwinvestments/memstack)
