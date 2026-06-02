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
4. **Verify** — give the bare citation claims (no reasoning) to **any model from a different family** than the one that synthesized them, and **resolve every arXiv ID / DOI yourself** to confirm existence. Apply the [halt table](./verification-gate/#the-halt-table).
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

## Installing the package

The methodology ships as an npm package — [`@dogfood-lab/study-swarm`](https://www.npmjs.com/package/@dogfood-lab/study-swarm):

```bash
npm i @dogfood-lab/study-swarm
```

It vendors the protocol (`PROTOCOL.md`), the README, and all 7 translations into your project — useful for pinning the exact version of the methodology a design decision was grounded against. There's no CLI yet; run the protocol by hand (above) or wire the two tools into your own dispatch flow. Published via OIDC Trusted Publishing with build provenance.
