---
title: Research grounding
description: The empirical evidence behind study-swarm's verifier design — and the proof it works.
sidebar:
  order: 3
---

study-swarm is itself research-grounded. Every load-bearing choice in the verification gate traces to published evidence. (Naturally, these citations were themselves verified by the protocol — see the proof at the bottom.)

## LLMs can't reliably self-verify

- **Huang et al. 2023** ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)) — LLMs struggle to self-correct without external feedback; performance can even degrade.
- **Kambhampati et al. 2024** ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo) — pair the generator with an external model-based verifier; autoregressive LLMs can't self-verify.
- **Stechly et al. 2024** ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — the external verifier carries the gains; the self-critique content is largely inert.

## Same-family judges self-prefer

- **Panickssery, Bowman & Feng 2024** ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — self-recognition correlates *linearly* with self-preference, so partial blinding doesn't help.
- **Verga et al. 2024** ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — a panel across disjoint families has less bias at ~7× lower cost than one large judge.

## Citations are where LLMs lie — so check by retrieval

- **Walters & Wilder 2023** ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — 55% of GPT-3.5 / 18% of GPT-4 citations are fabricated; many real ones carry bibliographic errors.
- **Onweller et al. 2026** ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — cited links resolve >94% of the time, yet only 39–77% of the content actually supports the claim. "The link resolves" ≠ "the paper says this."

## Hide the generator's reasoning

- **Khalifa et al. 2026** ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — manipulated chain-of-thought alone can inflate a judge's false-positives by up to 90% with actions held fixed.
- **Turpin et al. 2023** ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — CoT is often a post-hoc rationalization, not the real decision path.

## Diversity beats count

- **Rajan 2025** ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — four verifiers at pairwise correlation ρ ∈ [0.05, 0.25] beat any single one via submodular coverage. *(Anchored in code verification; the submodular argument is domain-general.)*
- **Kim et al. 2025** ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — LLM errors are correlated, so lens *diversity*, not raw count, is the load-bearing variable.

## Groundedness is a distinct, measurable axis

- **Min et al. 2023** ([arXiv:2305.14251](https://arxiv.org/abs/2305.14251), FActScore) and **Gao et al. 2023** ([arXiv:2305.14627](https://arxiv.org/abs/2305.14627), ALCE) — even strong models fail to fully support their own citations roughly half the time.

## The proof

As a test, the protocol was run against its own citations. Two decorrelated non-Claude families — **Mistral** (`mistral-small:24b`) and **IBM Granite** (`granite4.1:30b`) — checked a citation set, reasoning-stripped, seeded with two blind traps:

| Planted trap | Mistral | IBM Granite | Truth |
|---|---|---|---|
| CoT prompting attributed to "Nakamura & Olsen" | missed | **caught** | misattributed (really Wei et al. 2022) |
| a fabricated "98% of errors removed" paper | **caught** | **caught** | fabricated |

Neither family caught both alone — their **union caught 2/2**. A single judge would have shipped the misattribution. Meanwhile the retrieval oracle caught two *real* misattributions in adjacent design docs and correctly confirmed genuine 2026 papers that both LLMs false-flagged as fabricated (because the papers postdate their training) — which is exactly why the existence check must be a retrieval oracle, never an LLM.
