<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/dogfood-lab/study-swarm/main/assets/study-swarm.png" alt="study-swarm" width="360">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@dogfood-lab/study-swarm"><img src="https://img.shields.io/npm/v/@dogfood-lab/study-swarm" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License"></a>
  <a href="https://dogfood-lab.github.io/study-swarm/"><img src="https://img.shields.io/badge/handbook-live-purple" alt="Handbook"></a>
  <img src="https://img.shields.io/badge/cited%20research-verified-1f6feb" alt="Cited research, verified">
</p>

**Ground design decisions in cited research — then verify the citations with a *different* model family before any of it becomes canon.**

`study-swarm` is a protocol, not a tool. When you're making a substantial design decision with an LLM — a new product layer, an architecture choice, a "should we trust the model here" call — improvising from first principles ships designs that are stale, and citing papers from memory ships designs that rest on sources that don't exist or don't say what you think. study-swarm replaces both: dispatch parallel research agents, demand specific cited findings, and gate every citation through an **external verifier of a different model family** before it informs the design.

It applies its own medicine. The protocol prescribes verifier-protected envelopes for the systems it helps design — so it runs one on itself. **No model grades its own homework, including the one running the protocol.**

## The protocol in five steps

1. **Identify** 3–5 load-bearing design questions where empirical evidence would change the answer.
2. **Dispatch** one research agent per question, in parallel. Each must return paper titles + authors + years + URLs + a one-sentence finding — specificity over breadth ("6–8 well-sourced findings beat 20 vague gestures").
3. **Synthesize** the findings into a *Research grounding* section: `N. **<finding>.** <Authors> <year> (<arXiv/DOI>). <design implication>.`
4. **Verify externally** — a *different model family*, reasoning-stripped, checks every citation in two stages: a **retrieval oracle** confirms the paper exists (never the model's memory), then a **groundedness** lens confirms the finding matches the source. **Halt** on fabricated/misattributed; **halt-and-escalate** if the verifier or retrieval oracle is unavailable (never read absence as "citations fine").
5. **Connect** each architectural choice back to a finding by number. Citations without a design implication are noise.

The full executable detail — the halt table, the sourcing standard, the ensemble rule — is in **[PROTOCOL.md](PROTOCOL.md)**.

## Why a *different* family, reasoning-stripped?

Because the failure modes are documented, not hypothetical:

- **LLMs can't reliably verify their own output.** Huang et al. 2023 ([arXiv:2310.01798](https://arxiv.org/abs/2310.01798)); Kambhampati et al. 2024 ([arXiv:2402.01817](https://arxiv.org/abs/2402.01817), LLM-Modulo); Stechly et al. 2024 ([arXiv:2402.08115](https://arxiv.org/abs/2402.08115)) — the external verifier carries the gains; the self-critique content is inert.
- **Same-family judges self-prefer.** Panickssery, Bowman & Feng 2024 ([arXiv:2404.13076](https://arxiv.org/abs/2404.13076)) — self-recognition correlates *linearly* with self-preference, so partial blinding doesn't help. Verga et al. 2024 ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796), PoLL) — a panel across disjoint families is less biased at ~7× lower cost.
- **Citations are where LLMs lie.** Walters & Wilder 2023 ([doi:10.1038/s41598-023-41032-5](https://doi.org/10.1038/s41598-023-41032-5)) — 55% of GPT-3.5 / 18% of GPT-4 citations are fabricated. Onweller et al. 2026 ([arXiv:2605.06635](https://arxiv.org/abs/2605.06635)) — links resolve >94% of the time yet only 39–77% of cited content actually supports the claim. So existence must be checked by **retrieval, not recall**.
- **Hide the generator's reasoning.** Khalifa et al. 2026 ([arXiv:2601.14691](https://arxiv.org/abs/2601.14691), "Gaming the Judge") — manipulated chain-of-thought alone inflates a judge's false-positives by up to 90% with actions held fixed. Turpin et al. 2023 ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)) — CoT is post-hoc rationalization. The verifier sees the bare citation claim, never the "why I included this."
- **Diversity beats count.** Rajan 2025 ([arXiv:2511.16708](https://arxiv.org/abs/2511.16708)) — four verifiers at pairwise correlation ρ ∈ [0.05, 0.25] beat any single one via submodular coverage. Kim et al. 2025 ([arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) — LLM errors are *correlated*, so the load-bearing variable is lens diversity, not raw count.

## Does it actually work? (proof)

As a test, the protocol was run against its own citations. Two decorrelated non-Claude families — **Mistral** (`mistral-small:24b`) and **IBM Granite** (`granite4.1:30b`) — checked a citation set, reasoning-stripped, seeded with two blind traps:

| Planted trap | Mistral | IBM Granite | Ground truth |
|---|---|---|---|
| Chain-of-thought prompting attributed to "Nakamura & Olsen" | missed | **caught** (misattributed → really Wei et al. 2022) | misattributed |
| a fabricated "98% of errors removed, no oracle needed" paper | **caught** (fabricated) | **caught** (fabricated) | fabricated |

Neither family caught both traps alone — but their **union caught 2/2**. A single judge would have shipped the misattribution. Separately, the retrieval oracle caught two *real* misattributions in our own design docs (papers cited under the wrong first author) that no parametric LLM could have flagged — and it correctly confirmed genuine 2026 papers that both LLMs false-flagged as fabricated simply because the papers postdate their training. That last point is the whole reason Step 4's existence check **must** be a retrieval oracle, never an LLM.

That single run is the thesis in miniature: **decorrelated lenses + a retrieval oracle for existence beat any one smart judge.**

## How it's wired

You can run the protocol by hand — any different-family model plus resolving the arXiv/DOI yourself satisfies Step 4. Two sibling tools make it one command:

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** — the runtime verifier: family-different routing, reasoning-stripped, multi-lens adjudication, a deterministic retrieval existence floor (arXiv → Crossref), and signed receipts.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** — provides `roleos verify-citations <dispatch>`, the runner that extracts a dispatch's citations and gates them through prism.

## Why it works, in one breath

**Current** — the field moves fast; demanding specific studies-with-years keeps designs from shipping 18 months behind. **Functional** — evidence shows what *fails*, not just what works (explanations can increase over-reliance on *wrong* AI — Bansal et al. 2021). **Safe** — the verifier-protected envelope is the architecture the evidence supports, and the protocol enforces it on its own output. Sourcing isn't academic theater; it's the evidence trail.

## Security

`study-swarm` is a documentation repository — Markdown and a logo. It ships no executable code and installs nothing from this repo. It touches no data, requires no permissions, and collects no telemetry; there are no secrets or credentials in the source. The methodology *describes* a workflow that uses web retrieval and model-based verification, but this repo does not implement or run it. See [SECURITY.md](SECURITY.md).

## Status

A working protocol, externally verified by its own machinery — a different model family checks its citations (see the proof above). This repo is the public reference; [PROTOCOL.md](PROTOCOL.md) is the executable shape. Part of the [dogfood-lab](https://github.com/dogfood-lab) family — methods and showcases for building in the AI era.

MIT licensed.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
