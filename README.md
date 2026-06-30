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
| Chain-of-thought prompting attributed to "Nakamura & Olsen" | missed | **caught** (misattributed → really Wei et al. 2022, arXiv:2201.11903) | misattributed |
| a fabricated "98% of errors removed, no oracle needed" paper | **caught** (fabricated) | **caught** (fabricated) | fabricated |

Neither family caught both traps alone — but their **union caught 2/2**. A single judge would have shipped the misattribution. Separately, the retrieval oracle caught two *real* misattributions in our own design docs (papers cited under the wrong first author) that no parametric LLM could have flagged — and it correctly confirmed genuine 2026 papers that both LLMs false-flagged as fabricated simply because the papers postdate their training. That last point is the whole reason Step 4's existence check **must** be a retrieval oracle, never an LLM.

That single run is the thesis in miniature: **decorrelated lenses + a retrieval oracle for existence beat any one smart judge.**

### …and again, to design v1.1

The v1.1 refinements were chosen the same way — by running study-swarm **on study-swarm**. Four questions the first release left to "I think" (how to *mechanize* the groundedness check, whether to ground at generation time, how to *combine* the lenses, whether to abstain on calibrated uncertainty) went to parallel research agents, and all **27 resulting citations** were gated through Step 4 before any informed the design. The retrieval oracle confirmed **27/27 exist** — including six 2025–2026 papers a parametric model would have false-flagged as fabricated — and corrected five attributions a model could not, among them a real first-author misattribution the research agent flagged on itself. Run reasoning-stripped, the groundedness lenses even reproduced their own documented failure modes on our dispatch: one confidently mislabelled a real paper, and their *disagreement* triggered escalation — exactly as the cascade prescribes. The worked dispatch ships as [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md); the refinements it grounded — decomposed/ternary groundedness, generation-time grounding, the oracle-gated cascade, and calibrated abstention — are in [PROTOCOL.md](PROTOCOL.md).

## How it's wired

You can run the protocol by hand — any different-family model plus resolving the arXiv/DOI yourself satisfies Step 4. Two sibling tools make it one command:

- **[prism-verify](https://github.com/mcp-tool-shop-org/prism-verify)** — the runtime verifier: family-different routing, reasoning-stripped, multi-lens adjudication, a deterministic retrieval existence floor (arXiv → Crossref), and signed receipts.
- **[role-os](https://github.com/mcp-tool-shop-org/role-os)** — provides `roleos verify-citations <dispatch>`, the runner that extracts a dispatch's citations and gates them through prism.

The handoff is the dispatch format itself: a finding written as `N. **finding.** Authors year (arXiv|DOI). implication.` — with **one resolvable identifier per finding** — is exactly what `roleos verify-citations` lifts and gates. A `lint`-clean dispatch hands off cleanly; a malformed citation is what the runner flags as unparsed. That contract is what `study-swarm lint` checks locally, so Step 3 and Step 4 agree on what a citation is.

## CLI

```bash
npm i -g @dogfood-lab/study-swarm     # or run ad-hoc: npx @dogfood-lab/study-swarm <command>
```

| Command | What it does |
|---|---|
| `study-swarm protocol` | Print the full protocol — the five steps, the halt table, the sourcing standard. |
| `study-swarm new <slug>` | Scaffold a `<slug>.dispatch.md` with the five-step skeleton to fill in. |
| `study-swarm lint [--json] <path…>` | Check a dispatch's *Research grounding* against the sourcing standard — every finding needs an author, a year, and a resolvable identifier (arXiv / DOI / URL); "studies show…" hand-waving is rejected. Exit `1` on violations, so it gates CI. A `<path>` may be a file, a directory (linted recursively for `*.dispatch.md`), or `-` for stdin; `--json` emits a machine-readable report. |
| `study-swarm lock <dispatch> --from <orchestration.json>` | Pin a dispatch for replay — write `<dispatch>.lock.json` content-addressing, per Step-2 agent, the **resolved model id** + the **SHA-256 of the byte-exact prompt** + the **SHA-256 of the tool schema**, plus the Step-4 **verifier receipt**, rolled into one `lock_sha256`. |
| `study-swarm lock --verify <dispatch> [--from …]` | Re-derive those hashes and assert they match the lock; any drift exits `1`, so it gates CI like a package lockfile. Without `--from`, checks the lock's own integrity. |

`lint` is deterministic — zero model calls — so it's safe in CI. It enforces **Step 3's sourcing standard** locally; the model-based **Step 4** verification still defers to [`roleos verify-citations`](https://github.com/mcp-tool-shop-org/role-os) → prism.

A typical loop:

```bash
study-swarm new my-decision                      # creates my-decision.dispatch.md
# …fill in the questions, run the research dispatch, write the findings…
study-swarm lint my-decision.dispatch.md         # enforce the sourcing standard (Step 3)
roleos verify-citations my-decision.dispatch.md  # model-based Step 4 (different family, via prism)
```

Three complete, lint-clean worked dispatches ship as references: [`examples/study-swarm-self.dispatch.md`](examples/study-swarm-self.dispatch.md) (the protocol's central decision, compact), [`examples/study-swarm-v1_1.dispatch.md`](examples/study-swarm-v1_1.dispatch.md) (the full v1.1 design pass — 27 citations, every one externally verified), and [`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md) (the v1.2 lock design — 39 citations, gated through the runner, and the first dispatch to ship its own lock).

### Gate it in CI

`lint` takes a file, a directory (linted recursively for `*.dispatch.md`), or `-` for stdin, and `--json` emits a machine-readable report. Drop this into your repo to gate every dispatch's sourcing on each PR (a copy-paste sample also lives in [`examples/study-swarm-ci.yml`](examples/study-swarm-ci.yml)):

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

### Pin a dispatch for replay (`dispatch.lock.json`)

A grounded, verified dispatch is only auditable if you can say *what produced it*. `study-swarm lock` writes a companion lockfile that content-addresses, per research agent, the **resolved model id** (never a floating alias), the **SHA-256 of the byte-exact prompt**, and the **SHA-256 of the tool schema** it was given, plus the external **verifier receipt** — rolled into one `lock_sha256`. `study-swarm lock --verify` re-derives those hashes and fails closed on any drift, so a changed prompt, a swapped model, or a shifted tool surface is caught — the [PIN_PER_STEP](https://github.com/dogfood-lab/study-swarm) reproducibility standard, made executable. The harness emits the record; the CLI stays zero-dependency and network-free, only canonicalizing (RFC 8785), hashing, and validating it.

**It pins inputs, not outputs.** Pinning model + prompt + temperature does *not* make an LLM's output bit-identical — batch-invariance, floating-point non-associativity, mixture-of-experts routing, and silent provider drift are all outside an offline tool's control. So the lock gives you **replayable inputs and drift-detectable outputs**, never "deterministic replay." The design is grounded, citation by citation, in [`examples/study-swarm-lock.dispatch.md`](examples/study-swarm-lock.dispatch.md) — the first dispatch to ship its own lock ([`examples/study-swarm-lock.lock.json`](examples/study-swarm-lock.lock.json)).

## Why it works, in one breath

**Current** — the field moves fast; demanding specific studies-with-years keeps designs from shipping 18 months behind. **Functional** — evidence shows what *fails*, not just what works (explanations can increase over-reliance on *wrong* AI — Bansal et al. 2021, [arXiv:2006.14779](https://arxiv.org/abs/2006.14779)). **Safe** — the verifier-protected envelope is the architecture the evidence supports, and the protocol enforces it on its own output. Sourcing isn't academic theater; it's the evidence trail.

## Security

`study-swarm` ships a **thin, zero-dependency CLI** (`study-swarm`) alongside the methodology. It makes **no network or model calls** and collects **no telemetry**; there are no secrets or credentials in the source. At runtime it only reads the file you pass to `lint` and writes a single `<slug>.dispatch.md` in the current directory for `new` (refusing to overwrite, and never outside the working directory). The model-based verification the methodology describes (Step 4) is run by the sibling tools, not by this package. See [SECURITY.md](SECURITY.md).

## Status

A working protocol, externally verified by its own machinery — a different model family checks its citations (see the proof above). **v1.1** sharpens the verifier where the first release was silent: decomposed/ternary groundedness, generation-time grounding, an oracle-gated cascade for combining lenses, and calibrated abstention — each grounded in the verified v1.1 dispatch. **v1.2** makes a dispatch byte-replayable: `study-swarm lock` pins the resolved model, prompt, and tool schema per step plus the verifier receipt, and `lock --verify` fails closed on drift. This repo is the public reference; [PROTOCOL.md](PROTOCOL.md) is the executable shape. Part of the [dogfood-lab](https://github.com/dogfood-lab) family — methods and showcases for building in the AI era.

MIT licensed.

---

<p align="center"><sub>Part of the <a href="https://github.com/dogfood-lab">dogfood-lab</a> family — methods &amp; showcases for building in the AI era. Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.</sub></p>
