---
name: forge-notebook-operator
description: Work on Python Jupyter notebooks incrementally through a persistent kernel, editing and executing only the cells that need to change instead of restarting the notebook on every iteration.
---

# Persistent notebook operator

Use this skill whenever the task requires reading, modifying, debugging, experimenting in, or iterating on a Python `.ipynb` notebook and preserving expensive live state matters.

The objective is to operate the notebook like a careful human in Jupyter: keep one kernel alive, inspect current state, modify a small number of cells, execute the minimum necessary dependency chain, observe the result, and iterate.

## Core rules

- Use `cnb` as the primary notebook interface. Do not convert the notebook to a monolithic Python script merely to make it easier to execute.
- Preserve the current kernel whenever possible. Loaded datasets, models, GPU objects, caches, imports, and intermediate results are valuable state.
- Do not restart the kernel or replay the entire notebook for a local change unless clean-state validation is actually required.
- Treat notebook source and live kernel state as separate facts. A cell can be edited but not executed, or the live value of a symbol can have been overwritten out of order.
- Before executing a dependency plan containing expensive training, preprocessing, downloads, writes, or destructive operations, inspect the proposed cells first.
- Prefer deterministic runtime evidence over assumptions about what a cell probably contains.
- Do not run two agents that mutate the same notebook/kernel concurrently.

## 1. Establish the notebook and environment

Locate the target `.ipynb` and relevant project instructions.

Check the kernel first:

```bash
cnb status path/to/notebook.ipynb
```

If no kernel is active, start one using the project's Python environment. Prefer, in order:

1. an explicitly required interpreter;
2. the active project virtualenv;
3. a project-local `.venv` or `venv`;
4. the normal Python available in the shell.

Examples:

```bash
cnb start analysis.ipynb --python .venv/bin/python
```

or, when the correct environment is already active:

```bash
cnb start analysis.ipynb
```

If the selected project Python lacks `ipykernel`, install only that missing runtime dependency in the project environment when installation is permitted.

## 2. Inspect before changing state

Start with the smallest useful inspection set:

```bash
cnb list analysis.ipynb
cnb stale analysis.ipynb
cnb vars analysis.ipynb
```

For the target cell or computation:

```bash
cnb show analysis.ipynb CELL
cnb deps analysis.ipynb CELL
cnb plan analysis.ipynb CELL
```

Use `--json` when structured output is easier to reason over.

Do not assume execution counts stored in the `.ipynb` describe the current kernel. `cnb` tracks the current session separately.

## 3. Probe without polluting the notebook

Use `cnb exec` for temporary inspection, sanity checks, shapes, metrics, small visual/debug probes, or hypothesis testing:

```bash
cnb exec analysis.ipynb <<'PY'
print(type(model))
print(features.shape)
print(results.head())
PY
```

Remember that an ephemeral probe can still mutate live objects. If a probe writes a tracked Python symbol, `cnb plan` can detect that the live writer differs from the notebook producer. External side effects cannot always be inferred or reversed.

## 4. Edit narrowly

Replace an existing cell with `cnb set`:

```bash
cnb set analysis.ipynb 12 <<'PY'
features = build_features(df, version=3)
print(features.shape)
PY
```

Add a new experiment with `cnb add`:

```bash
cnb add analysis.ipynb --after 12 <<'PY'
worst_cases = evaluate_worst_cases(model, features)
worst_cases.head(20)
PY
```

Preserve unrelated code and markdown. Do not reorder cells unless the task requires it.

## 5. Execute the minimum necessary work

After an edit:

```bash
cnb stale analysis.ipynb
cnb plan analysis.ipynb TARGET
```

Inspect every expensive or side-effecting cell in the plan with `cnb show` before executing it.

If the plan is safe and appropriate:

```bash
cnb run analysis.ipynb TARGET --deps
```

For a cheap isolated cell whose prerequisites are already clean, execute only that cell:

```bash
cnb run analysis.ipynb TARGET
```

`cnb plan` may intentionally restore an earlier producer when a variable has been overwritten by out-of-order execution. Respect those warnings unless direct runtime evidence shows the notebook intentionally relies on the overwritten state.

## 6. Iterate from outputs

After each execution, inspect the actual output and relevant live variables. When a cell fails:

1. read the traceback;
2. inspect the involved cell and dependencies;
3. decide whether the failure comes from source, stale state, environment, or data;
4. change the smallest relevant unit;
5. rerun only the minimal required cells.

For ML/data work, avoid recomputing expensive datasets/features or retraining models unless they are genuinely invalidated by the change.

## 7. Reproducibility gate

Human-style notebook iteration intentionally permits out-of-order execution. That is useful during exploration but is not final reproducibility evidence.

When the user requests a clean validation, or when final correctness depends on clean execution:

1. save the notebook state;
2. stop the current kernel;
3. start a fresh kernel in the same project environment;
4. execute the required cells in canonical order, using a deliberate plan rather than blindly replaying destructive cells;
5. verify final outputs/metrics and report any difference from the exploratory session.

Do not perform this expensive clean-state gate by default when the task is only exploratory.

## Useful commands

```text
cnb start NB [--python PATH]
cnb stop NB
cnb status NB
cnb list NB
cnb show NB INDEX
cnb run NB INDEX [--deps]
cnb set NB INDEX [--run | --deps] < code.py
cnb add NB [--after INDEX] [--run | --deps] < code.py
cnb exec NB < code.py
cnb vars NB
cnb deps NB [INDEX] [--json]
cnb stale NB [--json]
cnb plan NB INDEX [--json]
```

## Limitations

- Current kernels are Python/ipykernel only.
- Static dependency inference is conservative and cannot prove arbitrary Python side effects, reflection, dynamic `exec`, external files/databases, native extension state, or hidden state in third-party libraries.
- A live kernel dies with its process or machine.
- Rich notebook outputs are preserved in the `.ipynb`, while terminal rendering focuses on text.
- Concurrent writers to the same notebook/kernel are unsupported.
