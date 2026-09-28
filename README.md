# CodexForge

[![CI](https://github.com/SorbetUP/CodexForge/actions/workflows/ci.yml/badge.svg)](https://github.com/SorbetUP/CodexForge/actions/workflows/ci.yml)

Portable token-efficiency stack for Codex.

CodexForge bundles:

- `Headroom` to compress LLM traffic through a local proxy
- `RTK` to compact shell output before it reaches Codex
- a Codex-native persistent memory layer inspired by `MemStack`
- `cnb`, a persistent Jupyter-kernel CLI so Codex can work cell-by-cell without restarting expensive notebook state

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

## GUI App (macOS)

CodexForge can also be used with the Codex desktop app on macOS.

The GUI path works differently from the CLI:

- `AGENTS.md` and `.codex-memory` are already shared through `~/.codex`
- `Headroom` must be injected into the app through the macOS GUI environment
- this requires restarting `Codex.app` after enabling the environment

Enable GUI mode:

```bash
codexforge-gui-enable
```

Restart the app:

```bash
codexforge-gui-restart
```

Verify GUI mode:

```bash
codexforge-gui-doctor
```

Disable GUI mode:

```bash
codexforge-gui-disable
```

## What It Does

- installs `Headroom` into an isolated virtualenv under `~/.codex-stack/venv`
- installs `RTK` if missing
- creates a `codex-stack` launcher in `~/.local/bin`
- routes Codex through `Headroom` with `headroom wrap codex --no-rtk`
- configures `RTK` globally for Codex via `rtk init -g --codex`
- adds global Codex guidance in `~/.codex/CODEX_STACK.md`
- installs three reusable Codex skills for reviewed changes, long-horizon project builds, and persistent notebook operation
- installs `cnb` in an isolated CodexForge environment while allowing notebook kernels to run in the project Python environment
- installs dedicated Luna review subagents with cost-aware reasoning levels
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

## Agent Workflows

CodexForge installs three global skills under `~/.codex/skills`:

- `$forge-reviewed-change`: for bounded changes that still need independent preflight, implementation review, adversarial review, and deterministic validation.
- `$forge-project-build`: for large projects or major rewrites driven by a technical specification, with architecture gates, vertical slices, persistent project memory, requirement traceability, and final system review.
- `$forge-notebook-operator`: for Python/Jupyter notebooks operated incrementally through a persistent kernel, with live-state inspection and minimal dependency replay through `cnb`.

It also installs three read-only custom subagents under `~/.codex/agents`:

- `forge_reviewer_medium`: GPT-6 Luna at `medium` effort for focused correctness, regression, contract, and test review.
- `forge_adversary_medium`: GPT-6 Luna at `medium` effort for falsification, edge cases, and challenging false consensus.
- `forge_architect_high`: GPT-6 Luna at `high` effort for architecture and specification decisions that justify deeper reasoning.

The skills deliberately avoid using high reasoning everywhere. Medium-effort agents handle bounded independent reviews; high effort is reserved for architecture, cross-cutting decisions, or escalation when evidence conflicts.

Example:

```text
$forge-reviewed-change Fix the cache invalidation bug and review the implementation before declaring it done.

$forge-project-build Implement this project from TECHNICAL_SPEC.md. Use the specification as the source of truth and stop each phase at its validation gate.

$forge-notebook-operator Work incrementally in analysis.ipynb. Keep the current kernel and avoid recomputing expensive state unless dependencies require it.
```

## Persistent Jupyter Notebooks

CodexForge vendors `codex-notebook-cli` 0.3.0 and installs the `cnb` command.

The CLI keeps a Jupyter kernel alive across independent terminal commands, records live execution state separately from the `.ipynb`, tracks symbol-level cell dependencies, and can propose the minimum stale cells to replay.

Typical flow:

```bash
cnb start analysis.ipynb --python .venv/bin/python
cnb list analysis.ipynb
cnb vars analysis.ipynb
cnb deps analysis.ipynb 12
cnb plan analysis.ipynb 18
cnb run analysis.ipynb 18 --deps
```

`cnb start` can select the project interpreter explicitly with `--python`. Without it, the CLI checks `CNB_KERNEL_PYTHON`, the active `VIRTUAL_ENV`, project-local `.venv` / `venv` environments, and then normal Python fallbacks. This lets the `cnb` controller stay isolated inside CodexForge while the actual kernel still sees the project's pandas, PyTorch, CUDA stack, and other dependencies.

The source package, README, and tests are contained in `vendor/codex-notebook-cli-0.3.0.tar.gz`.

## Uninstall

```bash
./uninstall.sh
```

## Notes

- `MemStack` is designed for Claude Code. CodexForge adapts the same useful idea, persistent compact memory, using files and conventions that Codex can read directly.
- `Headroom` does not permanently rewrite your whole shell environment. `OPENAI_BASE_URL` is injected by `codex-stack`.
- `RTK` remains globally installed because that is how it integrates with Codex.
- For the macOS desktop app, `OPENAI_BASE_URL` is injected with `launchctl setenv`, then applied after restarting `Codex.app`.
- Sources: [Headroom](https://github.com/chopratejas/headroom), [RTK](https://github.com/rtk-ai/rtk), [MemStack](https://github.com/cwinvestments/memstack)
