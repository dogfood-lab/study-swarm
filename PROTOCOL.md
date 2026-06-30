# The study-swarm protocol — locked execution shape

This is the executable reference. The narrative, the proof, and the research grounding are in [README.md](README.md). The **v1.1** refinements — decomposed groundedness, the oracle-gated cascade, generation-time grounding, and calibrated abstention — are grounded in [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md), the protocol run on itself with every citation verified by a different model family.

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

**A question is load-bearing if:**

- you can picture **two different designs** that hinge on the answer;
- the honest current answer is *"I think…"*, not *"evidence says…"*;
- an **adjacent field** (HCI, SRE, compilers, databases) has probably already measured it;
- getting it wrong ships a **known-broken default** (e.g. "explanations always help" — they can increase over-reliance on *wrong* AI).

Worked decomposition: *"Should a retry reuse the previous output?"* splits into *"does context carryover cause sycophancy drift?"* and *"do explanations increase over-reliance on wrong answers?"* — two evidence-changing questions, not one opinion.

## Step 2 — Dispatch parallel research agents

One agent per question, dispatched **in parallel** (a single batch). Each agent's prompt MUST include:

- the context — what's being built, why this question matters;
- the question shape, scoped to **evidence**, not opinion;
- a demand for SPECIFIC findings: paper titles, authors, years, URLs, a one-sentence key finding per source;
- a word cap (typically 500–600);
- "prefer specificity over breadth — 6–8 well-sourced findings beat 20 vague gestures";
- a note to use web search / fetch.

Typical agent count: 3–5.

**Ground at generation time, not only at the gate.** An agent operates in a retrieve-then-cite loop — search, fetch, and cite **only sources it actually pulled this session**; a claim it cannot ground in a fetched source is **dropped, not invented**. Forcing retrieval *during* generation cuts off-source fabrication at the source instead of leaving all of it to be caught (and *dropped*) downstream — an inline retrieve-and-critique loop reduces ungrounded output by roughly an order of magnitude (Asai et al. 2023, arXiv:2310.11511; the browse-then-cite contract that made WebGPT answers checkable, Nakano et al. 2021, arXiv:2112.09332). This buys precision at the cost of coverage (Saxena et al. 2025, arXiv:2509.21557), so pair it with a **coverage-recovery pass** — a second sweep for true-but-hard-to-retrieve findings — and never drop the deterministic existence oracle, since citation-heavy agents can still emit plausible non-existent identifiers (Rao et al. 2026, arXiv:2604.03173).

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
2. **Groundedness — finding matches source (decomposed, ternary).** Confirm the one-sentence finding describes what the source actually claims. Do **not** judge the sentence whole — a real paper with a resolvable link can still be *overstated* by a finding, and a whole-sentence check cannot localize that (Min et al. 2023, arXiv:2305.14251). Decompose the finding into **molecular claims** — decontextualized + minimal, just enough context to disambiguate, no more (Gunjal & Durrett 2024, arXiv:2406.20079) — **filter to the load-bearing, non-trivial claim** so padding earns no credit (Jiang et al. 2024, arXiv:2407.03572), check each against the source, and return a **ternary** verdict: fully / partially / not supported (Gao et al. 2023, arXiv:2305.14627). A **partially-supported** finding (the link resolves, the paper is real, the sentence overstates it) is treated like a misattribution — corrected once or escalated — never auto-passed. Pin the decomposer per run, because the verdict is sensitive to the decomposition method (Wanner et al. 2024, arXiv:2403.11903). Even strong models fully support their own citations only ~half the time, so this axis is distinct from existence and necessary.

### Running it

The reference implementation is **`roleos verify-citations <dispatch>`** ([role-os](https://github.com/mcp-tool-shop-org/role-os)), which shells **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** (`prism verify --type citations`): family-different routing by construction, reasoning-stripped, a deterministic retrieval existence floor, a groundedness lens, and a signed receipt. By hand, the fallback is any non-same-family model run reasoning-stripped against the bare citation claims, plus resolving each identifier yourself.

**Ensemble — ≥ 3 decorrelated lenses,** counting the **retrieval oracle as one mechanism-diverse lens**: retrieval oracle + ≥ 2 different-family LLM lenses. Diversity of lenses, not raw count, is the load-bearing variable (Rajan 2025; Kim et al. 2025).

**Aggregate as a cascade, not a flat vote.** Adding LLM lenses cannot rescue a correlated blind spot — a 9-judge panel across 7 families is worth only ~2 independent votes, because the models miss the same items (Kohli 2026, arXiv:2605.29800), and recent papers that postdate training are exactly such a shared blind spot. So **existence is gated by the deterministic oracle alone** — the one genuinely decorrelated lens — and the LLM lenses vote **only on groundedness**. For that vote, use a **tuned minority-veto** (an invalid verdict needs more than one corroborating flag): it beats both raw disjunction (which over-rejects genuine work) and majority (which misses a single-lens catch) while bounding over-rejection, and a small labeled calibration set beats adding lenses (Jain et al. 2025, arXiv:2510.11822). When the oracle confirms existence but the groundedness lenses **disagree** — especially on a post-cutoff paper — that disagreement is the signal to **escalate to a human, not auto-reject** (Kolawole et al. 2024, arXiv:2407.02348), and a confident "fabricated" flag from an LLM lens is down-weighted relative to the oracle (LLM judges are systematically overconfident — Tian et al. 2025, arXiv:2508.06225).

### Halt conditions (scope is per-finding — other verified findings proceed)

| Verdict / condition | Action |
|---|---|
| **FABRICATED** | The finding is **dropped** — there is no real source to correct, so re-verification is not attempted. |
| **MISATTRIBUTED** | Correct the attribution and re-verify **once**; a second non-clean verdict drops the finding. |
| **PARTIALLY_SUPPORTED** | A molecular claim is unsupported or overstated though the paper is real. Treated like a misattribution: correct the finding to what the source actually supports and re-verify **once**, or escalate — never auto-passed. |
| **CANNOT_CONFIRM** | The finding is **removed from the design connection AND surfaced to a human with a contrastive frame** — "you probably expected finding N citable; I left it out because the oracle couldn't confirm it — override with X." Never silently kept; reinstated only if a human confirms the source. |
| **Verifier or oracle UNAVAILABLE** | The dispatch **HALTS and escalates to a human.** Unavailability is NEVER read as "citations are fine" and NEVER read as fabrication. Proceeding without a completed verification is forbidden. |
| **No different family reachable** | The retrieval oracle (Stage 1) still runs — it is mechanism-diverse and needs no different family — and gates existence. The groundedness LLM lens (Stage 2) **halts-and-escalates** rather than running same-family. A same-family LLM is never substituted for the different-family check. |

**Abstention is calibrated and evidence-gated.** `CANNOT_CONFIRM` is a **first-class verdict the verifier is instructed to produce** — not a binary accept/reject collapsed under a confidence cut; a model trained or prompted to say "I don't know" is better calibrated than post-hoc thresholding (Zhang et al. 2023, arXiv:2311.09677). Trigger abstention on **external evidence absence** — the source wasn't fetched, or the retrieved text doesn't contain the claim — **never** on the verifier's own entropy or verbalized confidence, which can be confidently wrong (Phillips et al. 2026, arXiv:2603.21172). Where you tune a threshold, tune it with conformal calibration so the *accepted* set carries a provable error bound (Wang et al. 2024, arXiv:2407.00499). Surface a `CANNOT_CONFIRM` **contrastively and selectively** — "I expected to find X and didn't" — never as an always-on confidence bar, which measurably worsens over-reliance (Srinivasan & Thomason 2025, arXiv:2502.13321). Finally, **cap the abstain/escalation rate** against a labeled holdout and treat a spike as its own halt — over-refusal is itself a failure mode (Zhu et al. 2025, arXiv:2502.05911).

## Step 5 — Connect findings to architecture, not just cite them

The design's decision section references findings by number where they justify a choice; each load-bearing choice traces to ≥ 1 finding. Citations without connection are noise.

Example: *"Retry uses a fresh prompt without the previous output. (sycophancy mitigation, Kim 2025.)"* — the choice is annotated with the source and the reason, so a reader knows why the rule exists, not just that it does.

## Sourcing standard

**A citation includes ALL of:** (1) author(s) — first author + "et al." inline is fine; (2) year; (3) a **resolvable identifier or direct URL** — an arXiv id (arXiv:NNNN.NNNNN), a DOI, an RFC number, or a direct link to the source (not a summary or a social-media thread); a paper title is welcome but optional; (4) a one-sentence key finding in your own words.

> `study-swarm lint` enforces exactly this FORM locally — author + year + a resolvable arXiv/DOI/URL, and no "studies show…" gestures. arXiv ids and DOIs are preferred over a bare URL because Step 4's retrieval oracle resolves them deterministically.

**Not allowed:** "studies show…" / "research suggests…" / "it's well-established…" without naming the source; an identifier-less citation; citations the research step did not actually surface.

## Common failure modes

The patterns this protocol exists to catch — each with the step that catches it:

| Failure | Symptom | Caught by |
|---|---|---|
| **Fabricated citation** | the id resolves to nothing | Step 4 retrieval oracle → dropped |
| **Misattribution** | real paper, wrong author/year | Step 4 oracle → corrected once, else dropped |
| **Groundedness gap** | the link resolves but the source doesn't say it | Step 4 groundedness lens (distinct from existence) |
| **Self-grading** | the synthesizing model also "verifies" | Step 4 different-family rule |
| **Postdated-paper false-flag** | an LLM calls a real 2026 paper fabricated | why existence MUST be retrieval, not recall |
| **Question padding** | five thin questions, two actually evidence-changing | Step 1 ("don't manufacture to hit a count") |
| **Orphan citation** | a finding never referenced by a Step-5 choice | Step 5 (citations without a connection are noise) |
| **"Studies show…"** | a gesture with no source named | the sourcing standard / `lint` |

A fuller version with corrective actions is in the [handbook](https://dogfood-lab.github.io/study-swarm/handbook/failure-modes/).

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

## Replayability — pinning a dispatch (`dispatch.lock.json`)

A grounded, verified dispatch is only auditable if you can say *what produced it*. `study-swarm lock <dispatch> --from <orchestration.json>` writes a companion `dispatch.lock.json` that pins, per Step-2 research agent, the **resolved model id** (never an alias), the **SHA-256 of the byte-exact prompt**, and the **SHA-256 of the tool schema** the agent was given, plus the Step-4 **verifier receipt** — rolled into one `lock_sha256` content-address. `study-swarm lock --verify` re-derives those hashes and exits non-zero on any drift, so a changed prompt, model, or tool surface is caught — it gates CI exactly like a package lockfile. This is the PIN_PER_STEP standard made executable: the harness emits the record, and the CLI (zero-dependency, network-free) only canonicalizes, hashes, and validates it.

**Honest ceiling:** pinning model + prompt + temperature does **not** make an LLM's *output* bit-identical — batch-invariance, floating-point non-associativity, mixture-of-experts routing, and silent provider drift all sit outside any offline tool's control. So the lock pins **inputs byte-exact and records output hashes for drift detection** — *replayable inputs + drift-detectable outputs*, never "deterministic replay." The design and its evidence are the worked dispatch [`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md) — itself the first dispatch to ship its own lock.
