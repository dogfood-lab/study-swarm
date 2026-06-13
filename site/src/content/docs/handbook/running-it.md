---
title: Running it
description: How to run study-swarm — by hand, or with the roleos verify-citations runner.
sidebar:
  order: 4
---

study-swarm is a protocol you can run by hand. Two sibling tools make the verification step one command, but neither is required.

## By hand

1. **Identify** 3–5 load-bearing questions.
2. **Dispatch** one research agent per question, in parallel, demanding cited findings (titles, authors, years, URLs, one-sentence finding).
3. **Synthesize** into a *Research grounding* section using the `N. **finding.** Authors year (id). implication.` template.
4. **Verify** — give the bare citation claims (no reasoning) to **any model from a different family** than the one that synthesized them, and **resolve every arXiv ID / DOI yourself** to confirm existence. Apply the [halt table](../verification-gate/#the-halt-table).
5. **Connect** each design choice back to a finding by number.

The only hard requirements: a *different family* for the groundedness check, and *retrieval* (not memory) for existence.

## With the tooling

Two public tools in the same ecosystem automate Step 4:

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** — the runtime verifier: family-different routing, reasoning-stripped, a deterministic retrieval existence floor (arXiv → Crossref), a groundedness lens, and signed receipts.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** — provides the runner:

```bash
roleos verify-citations <dispatch>
#  → prism verify --type citations --provider ollama
#  → three-tier gate: fabricated = block · soft-groundedness = revise
#                      low-confidence / unreachable = escalate (never accept)
```

The runner extracts a dispatch's citations, gates them through prism, and emits a receipt chained to prism's signed receipt — so a withdrawn or corrected citation is drift-detectable downstream.

## The CLI

The methodology ships as a zero-dependency npm package with a thin CLI — [`@dogfood-lab/study-swarm`](https://www.npmjs.com/package/@dogfood-lab/study-swarm):

```bash
npm i -g @dogfood-lab/study-swarm      # or: npx @dogfood-lab/study-swarm <command>
```

| Command | What it does |
|---|---|
| `study-swarm protocol` | Print the locked protocol (the source of this page). |
| `study-swarm new <slug>` | Scaffold `<slug>.dispatch.md` — the five-step skeleton to fill in. |
| `study-swarm lint [--json] <path…>` | Check a dispatch's Research grounding: every finding needs author + year + a resolvable arXiv/DOI/URL; vague "studies show…" claims are rejected. Exit `1` on violations. A `<path>` may be a file, a directory (linted recursively for `*.dispatch.md`), or `-` for stdin; `--json` emits a machine-readable report. |

A typical loop:

```bash
study-swarm new my-decision                        # creates my-decision.dispatch.md
# ...fill in the questions, run the research dispatch, write the findings...
study-swarm lint my-decision.dispatch.md           # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md    # model-based Step 4 (different family, via prism)
```

`lint` is deterministic and CI-safe (no model calls) — it covers Step 3's sourcing standard; the model-based Step 4 defers to the tools above. The package also vendors `PROTOCOL.md` + the README in 7 languages, useful for pinning the exact methodology version a decision was grounded against — and `study-swarm new` stamps that version (and a hash of the protocol) into every scaffolded dispatch. Published via OIDC Trusted Publishing with build provenance.

A complete, lint-clean dispatch — study-swarm applied to its own design — ships as [`examples/study-swarm-self.dispatch.md`](https://github.com/dogfood-lab/study-swarm/blob/main/examples/study-swarm-self.dispatch.md); read it as a worked reference for all five steps.

## Gate it in CI

`lint` exits `1` on any sourcing violation, so it gates a pull request directly. Point it at a directory to check a whole corpus, and use `--json` for inline annotations. Copy this into your repo (a ready sample also ships as `examples/study-swarm-ci.yml`):

```yaml
# .github/workflows/dispatches.yml
name: study-swarm lint
on:
  pull_request:
    paths: ['**/*.dispatch.md', '.github/workflows/dispatches.yml']
  workflow_dispatch:
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npx @dogfood-lab/study-swarm@latest lint dispatches/
```

The handoff to Step 4 is the dispatch format itself: a finding written `N. **finding.** Authors year (arXiv|DOI). implication.` — one resolvable identifier per finding — is exactly what `roleos verify-citations` extracts and gates. A `lint`-clean dispatch hands off cleanly.
