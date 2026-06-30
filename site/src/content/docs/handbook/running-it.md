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
| `study-swarm lock <dispatch> --from <orchestration.json>` | Write `<dispatch>.lock.json` — pin (per Step-2 agent) the resolved model id + SHA-256 of the byte-exact prompt + SHA-256 of the tool schema, plus the Step-4 verifier receipt, in one `lock_sha256`. |
| `study-swarm lock --verify <dispatch> [--from …]` | Re-derive the hashes and assert they match the lock; drift exits `1`. Without `--from`, checks the lock's own integrity. |
| `study-swarm withdraw <id> --reason <reason> [--from <dir>] [--receipt <path>]` | Flag every dispatch citing `<id>` as `evidence-withdrawn` (a tombstone sidecar — flag, never delete) and emit a content-addressed withdrawal receipt. `--reason` ∈ `fabricated · misattributed · retracted · verifier-flipped · other`. |
| `study-swarm requalify --check <corpus-dir>` | Fail closed (exit `1`) for any unresolved `evidence-withdrawn` flag — the andon that halts a withdrawn finding's dependents. |
| `study-swarm requalify --resolve <dispatch> <id> --mode removed\|regrounded [--note …]` | Clear a flag once the finding is removed or re-grounded. Idempotent; appends to the sidecar's audit trail. |

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

## Pin a dispatch for replay

A grounded, verified dispatch is only auditable if you can say *what produced it*. `study-swarm lock` writes a companion `dispatch.lock.json` that content-addresses, per Step-2 research agent, the **resolved model id** (never a floating alias), the **SHA-256 of the byte-exact prompt**, and the **SHA-256 of the tool schema** the agent was given, plus the Step-4 **verifier receipt** — rolled into one `lock_sha256`. This is the PIN_PER_STEP reproducibility standard made executable.

```bash
study-swarm lock my-decision.dispatch.md --from my-decision.orchestration.json   # writes my-decision.lock.json
study-swarm lock --verify my-decision.dispatch.md --from my-decision.orchestration.json   # exit 1 on drift
```

The **harness emits** the orchestration record (the resolved models, the byte-exact prompts, the tool schemas, the verifier receipt); the CLI stays zero-dependency and network-free, only canonicalizing (RFC 8785 JCS, NFC-normalized, no BOM — so the same dispatch hashes identically on Windows, macOS, and Linux), hashing (SHA-256, self-describing `sha256-…` digests), and validating. `lock --verify` re-derives every hash and **fails closed** on a changed prompt, a swapped model, a shifted tool surface, edited dispatch text, or a tampered lock — so it gates CI exactly like a package lockfile.

**It pins inputs, not outputs.** Pinning model + prompt + temperature does not make an LLM's output bit-identical — batch-invariance, floating-point non-associativity, mixture-of-experts routing, and silent provider drift are all outside an offline tool's control. So the lock gives you **replayable inputs and drift-detectable outputs**, never "deterministic replay." The full design, grounded citation by citation and gated through the verifier, is the worked dispatch [`examples/study-swarm-lock.dispatch.md`](https://github.com/dogfood-lab/study-swarm/blob/main/examples/study-swarm-lock.dispatch.md) — the first dispatch to ship its own lock.

## Roll back a withdrawn finding

A verified finding becomes **canon** — it informs a downstream decision. So what happens when it is later **withdrawn**: a citation turns out fabricated or misattributed on a re-run, a cited paper is **retracted** upstream, or the gate flips it? A `git revert` of the dispatch commit is not enough, because the finding already propagated into the dependent design — "a compensator undoes from a semantic point of view; it does not restore the prior state" (Garcia-Molina & Salem 1987, the saga heritage). The **canon-rollback compensator** makes the cleanup executable as three deterministic, network-free verbs:

```bash
study-swarm withdraw arXiv:2402.15089 --reason misattributed --from dispatches/ --receipt rollback.json
#   → flags every dispatch citing it `evidence-withdrawn` (a co-located tombstone sidecar
#     <slug>.withdrawn.json — flag, never delete) and writes a content-addressed receipt.
study-swarm requalify --check dispatches/          # exit 1 while any flag is unresolved — the andon HALT
study-swarm requalify --resolve d.dispatch.md arXiv:2402.15089 --mode removed
#   or, if the finding was re-verified in place:  --mode regrounded --note "<sibling-runner attestation>"
```

The design rests on how adjacent fields actually solved this. **Flag, never delete** is the universal pattern for a thing with dependents — an X.509 CRL retains the revoked serial with a reason code (RFC 5280), `cargo yank` "does not delete any data," npm recommends `deprecate` over `unpublish`, PyPI keeps yanked files (PEP 592), Cassandra writes a tombstone, and COPE/Crossref retain the retracted record. **Fail-closed, not a soft alert**, because notifying citing authors provably did *not* reduce continued citation of retracted work (the RetractoBot RCT, DeVito et al. 2024) and unexplained drops drive over-reliance (Bansal et al. 2021) — so `requalify --check` refuses to treat a missing re-verification as "fine" (the Must-Staple rule, RFC 7633). The **reason is a closed machine-readable enum**, never free text (OpenVEX / CSAF / CycloneDX), and the receipt and tombstone are **content-addressed and append-only** (TUF, Sigstore Rekor, RFC 6962, Git objects). The withdrawal is surfaced **contrastively**, never silently (Buçinca et al. 2024).

**Honest ceiling:** the CLI flags, gates, and receipts deterministically; the actual **re-verification** of a re-grounded finding is the sibling runner's job (`roleos verify-citations` → prism) — `--mode regrounded` records that it happened, it does not perform it. The tombstone is the *evidence* layer; `lock --verify` is untouched by a withdraw. The full design, grounded citation by citation and gated through the verifier, is the worked dispatch [`examples/study-swarm-canon-rollback.dispatch.md`](https://github.com/dogfood-lab/study-swarm/blob/main/examples/study-swarm-canon-rollback.dispatch.md) — the first dispatch to be withdrawn-then-requalified.
