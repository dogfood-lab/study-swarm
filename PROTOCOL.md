# The study-swarm protocol — locked execution shape

This is the executable reference. The narrative, the proof, and the research grounding are in [README.md](README.md).

> **The one-line guard:** no finding reaches Step 5 unverified. If you cannot verify — verifier down, no different family reachable, retrieval oracle unreachable — you HALT and escalate; you do not proceed. The protocol never lets a model grade its own homework, including the one running it.

## When to invoke

Fire when ANY hold:

- A decision introduces a **new product layer** (not a fix, scope extension, or operational tuning).
- The decision is **qualitative** — "should we trust the model here," "explain or just do," "cap options," "retry or fall back."
- You're about to recommend a **single-axis** answer (deterministic-only / LLM-only) where the real answer is multi-axis (deterministic floor + LLM ceiling + verifier).
- An **adjacent domain** (compilers, SRE, databases, mixed-initiative HCI) has likely solved this.

Does NOT fire for: pure fixes; scope extensions of already-grounded work; operational tuning ("what number," not "what shape").

The cost of running it is one parallel dispatch and a few minutes of synthesis. The cost of skipping it is the failure this protocol exists to prevent: shrinking a design to a simpler shape out of an unexamined fear of AI advice, defending choices with "studies show…" and no studies named, and resting architecture on citations that don't exist.

## Step 1 — Identify load-bearing design decisions

List the specific questions where empirical evidence would change the answer. Aim for 3–5. **Fewer is fine** when the decision is genuinely substantial — run with 1–2 agents; the decision-to-investigate governs invocation, the number of evidence-changing questions governs breadth. Do not manufacture questions to hit a count, and do not abort for being under three. More than ~6 → split into multiple passes.

## Step 2 — Dispatch parallel research agents

One agent per question, dispatched **in parallel** (a single batch). Each agent's prompt MUST include:

- the context — what's being built, why this question matters;
- the question shape, scoped to **evidence**, not opinion;
- a demand for SPECIFIC findings: paper titles, authors, years, URLs, a one-sentence key finding per source;
- a word cap (typically 500–600);
- "prefer specificity over breadth — 6–8 well-sourced findings beat 20 vague gestures";
- a note to use web search / fetch.

Typical agent count: 3–5.

> Step 4 makes retrieval a **hard** requirement: a paper an agent "remembers" but cannot retrieve does not enter the dispatch. Existence is established by resolving the identifier, not by recall.

## Step 3 — Synthesize into a "Research grounding" section

A dedicated section near the top of the design doc, before the architectural decisions. Each finding follows one template:

```
N. **<one-sentence finding>.** <Authors> <year> (<paper title or arXiv:NNNN.NNNNN>). <Implication for the system being designed>.
```

Example:

> 1. **Contrastive explanations with a predicted human foil improve independent decision-making.** Buçinca et al. 2024 (arXiv:2410.04253) — N=628 between-subjects. Implication: every recommendation carries a "you might think X; I'm recommending Y because…" frame.

The format does three things at once: states the finding, cites the source so it can be verified, and names the design implication so the link evidence→choice is visible.

## Step 4 — External verification gate (family-different, reasoning-stripped)

Before any finding informs the design (Step 5), a verifier of a **different model family** from the synthesizing model, with the synthesizer's reasoning hidden, checks every citation. The Step 2 research agents are *inputs* — they produce citations; they are **not** verifiers of the synthesis. A separate family must check, or it's a model grading its own homework — the exact failure the protocol prescribes verifiers to prevent.

**Non-circular by construction:** the verifier adjudicates via a deterministic retrieval oracle (existence) plus a different-family lens (groundedness). It does not re-run this protocol and does not rely on anyone's recall.

### Two-stage check, per citation

1. **Existence / attribution — a retrieval oracle, not a parametric LLM.** Resolve the arXiv ID / DOI / URL and confirm the paper exists with the stated title, authors, and year. This stage **must retrieve** (fetch the source / arXiv / Crossref), never model memory — fabrication and misattribution rates are high enough (Walters & Wilder 2023) and 2025–2026 papers postdate model training, so a parametric check will false-flag real work as fabricated (Onweller et al. 2026). If retrieval is unavailable, apply the halt-and-escalate rule below.
2. **Groundedness — finding matches source.** Confirm the one-sentence finding describes what the source actually claims (an NLI-style support check). Even strong models fail to fully support their own citations roughly half the time, so this is a distinct, necessary axis — not implied by existence.

### Running it

The reference implementation is **`roleos verify-citations <dispatch>`** ([role-os](https://github.com/mcp-tool-shop-org/role-os)), which shells **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** (`prism verify --type citations`): family-different routing by construction, reasoning-stripped, a deterministic retrieval existence floor, a groundedness lens, and a signed receipt. By hand, the fallback is any non-same-family model run reasoning-stripped against the bare citation claims, plus resolving each identifier yourself.

**Ensemble — ≥ 3 decorrelated lenses,** counting the **retrieval oracle as one mechanism-diverse lens**: retrieval oracle + ≥ 2 different-family LLM lenses. Diversity of lenses, not raw count, is the load-bearing variable (Rajan 2025; Kim et al. 2025).

### Halt conditions (scope is per-finding — other verified findings proceed)

| Verdict / condition | Action |
|---|---|
| **FABRICATED** | The finding is **dropped** — there is no real source to correct, so re-verification is not attempted. |
| **MISATTRIBUTED** | Correct the attribution and re-verify **once**; a second non-clean verdict drops the finding. |
| **CANNOT_CONFIRM** | The finding is **removed from the design connection AND surfaced to a human with a contrastive frame** — "you probably expected finding N citable; I left it out because the oracle couldn't confirm it — override with X." Never silently kept; reinstated only if a human confirms the source. |
| **Verifier or oracle UNAVAILABLE** | The dispatch **HALTS and escalates to a human.** Unavailability is NEVER read as "citations are fine" and NEVER read as fabrication. Proceeding without a completed verification is forbidden. |
| **No different family reachable** | The retrieval oracle (Stage 1) still runs — it is mechanism-diverse and needs no different family — and gates existence. The groundedness LLM lens (Stage 2) **halts-and-escalates** rather than running same-family. A same-family LLM is never substituted for the different-family check. |

## Step 5 — Connect findings to architecture, not just cite them

The design's decision section references findings by number where they justify a choice; each load-bearing choice traces to ≥ 1 finding. Citations without connection are noise.

Example: *"Retry uses a fresh prompt without the previous output. (sycophancy mitigation, Kim 2025.)"* — the choice is annotated with the source and the reason, so a reader knows why the rule exists, not just that it does.

## Sourcing standard

**A citation includes ALL of:** (1) author(s) — first author + "et al." inline is fine; (2) year; (3) paper title OR canonical identifier (arXiv:NNNN.NNNNN, DOI, RFC); (4) a direct URL to the source (not a summary or a social-media thread); (5) a one-sentence key finding in your own words.

**Not allowed:** "studies show…" / "research suggests…" / "it's well-established…" without naming the source; titles without authors or years; citations the research step did not actually surface.

## The architecture this protocol enables

Across the designs it has grounded, the same shape recurs:

```
System decides structure deterministically
  ↓
Model writes within that structure
  ↓
Verifier admits before output
```

- **Deterministic floor** — the system makes the law-defining call; the model never does.
- **Model in the prose / prioritization role** — AI adds judgment, contextual explanation, and prioritization where it adds value.
- **Verifier as admission gate** — the verifier checks the output against the structure before admitting it; retries use a fresh context to avoid sycophancy drift.

Designs that touch model-facing behavior default to this shape unless evidence justifies a different one.
