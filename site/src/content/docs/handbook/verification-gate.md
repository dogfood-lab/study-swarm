---
title: The verification gate
description: Step 4 — the two-stage citation check, the halt table, the ensemble rule, and why a different model family.
sidebar:
  order: 2
---

Step 4 is the heart of study-swarm. Before any finding informs the design, a verifier of a **different model family** from the synthesizer — with the synthesizer's reasoning hidden — checks every citation. The Step 2 research agents are *inputs* (they produce citations); they are **not** verifiers of the synthesis. A separate family must check, or it's a model grading its own homework — the exact failure the protocol prescribes verifiers to prevent.

> **Non-circular by construction.** The verifier adjudicates via a deterministic retrieval oracle (existence) plus a different-family lens (groundedness). It does not re-run this protocol and does not rely on anyone's recall.

## The two-stage check, per citation

1. **Existence / attribution — a retrieval oracle, not a parametric LLM.** Resolve the arXiv ID / DOI / URL and confirm the paper exists with the stated title, authors, and year. This stage **must retrieve** (fetch the source / arXiv / Crossref), never model memory.
2. **Groundedness — finding matches source.** Confirm the one-sentence finding describes what the source actually claims. Existence is not enough: a real paper can still be cited for something it never said.

## Why a *different* family, reasoning-stripped

- **LLMs can't reliably self-verify** — the external verifier carries the gains; the self-critique content is largely inert (Huang 2023, Kambhampati 2024, Stechly 2024).
- **Same-family judges self-prefer** — self-recognition correlates linearly with self-preference, so partial blinding doesn't help (Panickssery 2024); a disjoint-family panel is less biased at lower cost (Verga 2024).
- **Hide the reasoning** — manipulated chain-of-thought alone can inflate a judge's false-positives dramatically (Khalifa 2026), and CoT is often post-hoc rationalization (Turpin 2023). The verifier sees the bare citation claim, never the "why."

See [Research grounding](../research-grounding/) for the full citations.

## Ensemble: ≥3 decorrelated lenses

Count the **retrieval oracle as one mechanism-diverse lens**, then add **≥2 different-family LLM lenses**. Diversity of lenses — not raw count — is the load-bearing variable, because LLM errors are correlated (Rajan 2025, Kim 2025).

## The halt table

Scope is **per-finding** — other verified findings proceed.

| Verdict / condition | Action |
|---|---|
| **Fabricated** | The finding is **dropped** — no real source to correct, so no re-verification. |
| **Misattributed** | Correct the attribution and re-verify **once**; a second non-clean verdict drops it. |
| **Cannot confirm** | **Removed from the design AND surfaced to a human** with a contrastive frame — *"you probably expected finding N citable; I left it out because the oracle couldn't confirm it — override with X."* Reinstated only if a human confirms the source. |
| **Verifier / oracle unavailable** | **Halt and escalate.** Unavailability is never read as "citations are fine," and never as fabrication. Proceeding without a completed verification is forbidden. |
| **No different family reachable** | The retrieval oracle still runs and gates existence; the groundedness LLM lens **halts and escalates** rather than running same-family. |
