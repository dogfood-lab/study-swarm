---
title: The five steps
description: The locked execution shape of the study-swarm protocol.
sidebar:
  order: 1
---

The protocol is a fixed five-step shape. Steps 1–3 produce a research-grounded design dispatch; Step 4 verifies it; Step 5 wires the evidence to the architecture.

> **The one-line guard:** no finding reaches Step 5 unverified. If you cannot verify — verifier down, no different family reachable, retrieval oracle unreachable — you **halt and escalate**; you do not proceed.

## Step 1 — Identify load-bearing decisions

List the specific questions where empirical evidence would change the answer.

Aim for 3–5. **Fewer is fine** when the decision is genuinely substantial — run with 1–2 agents. The decision-to-investigate governs *invocation*; the number of evidence-changing questions governs *breadth*. Don't manufacture questions to hit a count, and don't abort for being under three. More than ~6 → split into multiple passes.

## Step 2 — Dispatch parallel research agents

One agent per question, dispatched **in parallel** (a single batch). Each agent's prompt must demand:

- the context — what's being built, why the question matters;
- the question scoped to **evidence**, not opinion;
- **specific** findings: paper titles, authors, years, URLs, and a one-sentence key finding per source;
- a word cap (typically 500–600);
- *"specificity over breadth — 6–8 well-sourced findings beat 20 vague gestures."*

Existence is established in Step 4 by **resolving the identifier**, not by recall — so a paper an agent "remembers" but cannot retrieve does not enter the dispatch.

## Step 3 — Synthesize into a "Research grounding" section

Put a dedicated section near the top of the design doc, before the decisions. One template per finding:

```
N. **<one-sentence finding>.** <Authors> <year> (<arXiv:NNNN.NNNNN or DOI>). <design implication>.
```

For example:

> 1. **Contrastive explanations with a predicted human foil improve independent decision-making.** Buçinca et al. 2024 (arXiv:2410.04253). Implication: every recommendation carries a "you might think X; I'm recommending Y because…" frame.

The template does three things at once: states the finding, cites a verifiable source, and names the design implication — so the link from evidence to choice is visible.

## Step 4 — External verification gate

A verifier of a **different model family**, reasoning-stripped, checks every citation before it informs the design. This step is large enough to have [its own page](./verification-gate/).

## Step 5 — Connect findings to architecture

The decision section references findings by number where they justify a choice; each load-bearing choice traces to at least one finding. Citations without a connection are noise.

> *"Retry uses a fresh prompt without the previous output. (sycophancy mitigation, Kim 2025.)"*

The choice is annotated with the source **and** the reason, so a reader knows why the rule exists — not just that it does.
