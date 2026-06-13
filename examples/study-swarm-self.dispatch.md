<!-- study-swarm vX.Y.Z · protocol-sha256:<vendored> · a worked, lint-clean reference dispatch -->
# Study-swarm dispatch: study-swarm-self

> A complete, **lint-clean** example dispatch — study-swarm applied to its own
> central design decision. Run `study-swarm lint examples/study-swarm-self.dispatch.md`
> (it passes), then read it as a model for what a filled-in dispatch looks like end to end.

## Step 1 — Load-bearing questions

<!-- Each is load-bearing: two real designs hinge on the answer, and the honest prior is "I think", not "evidence says". -->

1. When an LLM makes a substantial design call, can the *same* model reliably verify its own citations, or does the verifier have to be a separate model?
2. Is confirming a cited paper *exists* enough, or must "the source supports this claim" be checked as a separate axis?
3. Does adding *more* verifiers improve coverage, or does the diversity of the verifiers matter more than their count?

## Step 2 — Research dispatch

<!-- One research agent per question, in parallel; each returned paper titles + authors + years + URLs + a one-sentence finding, web-retrieval required (no recall-only citations). -->

Three parallel agents, scoped to empirical evidence (not opinion), word-capped, "specificity over breadth — 6–8 well-sourced findings beat 20 vague gestures." Their citations (below) were then resolved against arXiv/Crossref before any informed the design.

## Step 3 — Research grounding

1. **LLMs struggle to self-correct without external feedback, and can degrade after self-correction.** Huang et al. 2023 (arXiv:2310.01798). Implication: the verifier cannot be the generator itself — an external check is required (answers Q1).
2. **Autoregressive LLMs cannot self-verify; pair the generator with an external model-based verifier.** Kambhampati et al. 2024 (arXiv:2402.01817). Implication: the architecture is generator + separate verifier, not self-critique (answers Q1).
3. **An LLM judge's self-recognition correlates *linearly* with its self-preference bias.** Panickssery, Bowman & Feng 2024 (arXiv:2404.13076). Implication: the verifier must be a *different model family*, since partial blinding of a same-family judge does not remove the bias (answers Q1).
4. **18–55% of LLM-generated citations are fabricated, and many real ones carry bibliographic errors.** Walters & Wilder 2023 (doi:10.1038/s41598-023-41032-5). Implication: existence must be established by *retrieval* (resolve the arXiv/DOI), never by the model's recall (answers Q2).
5. **Cited links resolve >94% of the time, yet only 39–77% of the content actually supports the claim.** Onweller et al. 2026 (arXiv:2605.06635). Implication: groundedness is a distinct axis from existence — "the link resolves" is not "the paper says this" (answers Q2).
6. **Decorrelated verifiers (pairwise ρ ∈ [0.05, 0.25]) beat any single one via submodular coverage.** Rajan 2025 (arXiv:2511.16708). Implication: spend the budget on *lens diversity* (a retrieval oracle + ≥2 different families), not on more copies of one judge (answers Q3).

## Step 4 — External verification

<!-- This dispatch's own citations were gated this way before Step 5 was written. -->

- [x] every citation resolved by retrieval (arXiv/DOI), not model memory — arXiv API + OpenAlex + Crossref
- [x] every finding matches what its source actually claims (groundedness) — checked against each abstract
- [x] >= 3 decorrelated lenses (retrieval oracle + >= 2 different model families) — oracle + Mistral + IBM Granite, reasoning-stripped

Result: all six citations VERIFIED (existence + attribution + groundedness). Two blind traps seeded into a sibling set — a misattribution and a fabricated paper — were caught by the *union* of the two families, not either alone.

## Step 5 — Architecture

- The verifier is a **different model family** from the synthesizer, run reasoning-stripped. (findings 1, 2, 3)
- Verification is **two-stage per citation**: a retrieval oracle confirms existence, then a groundedness lens confirms the source supports the claim. (findings 4, 5)
- The verifier is an **ensemble of decorrelated lenses** (retrieval oracle + ≥2 different families), because diversity — not count — drives coverage. (finding 6)
- On a non-clean verdict the finding **halts** (fabricated → dropped; misattributed → corrected once; unavailable → escalate), never silently proceeds. (findings 1, 4)
