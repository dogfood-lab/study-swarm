# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.0.0] — 2026-07-05

A full dogfood-swarm pass — health hardening, a feature pass making more of the protocol executable, and a security hardening of the lock's content-addressing. **The breaking change** (hence the major bump): the `dispatch.lock.json` / tombstone / receipt hash format is now domain-separated (artifact schema **v2**), so a lock written by an earlier version (≤ 1.3) no longer verifies until it is regenerated (`study-swarm lock <dispatch> --from <orchestration.json>`) — `lock --verify` now says exactly that, instead of reporting a confusing hash mismatch. The CLI's command surface is otherwise fully backward-compatible and additive.

### Added

- **`study-swarm lint --strict`** — makes the protocol's one otherwise-unexecutable failure mode deterministic: an **orphan citation** (a Step-3 finding no Step-5 choice references, by number or author) is flagged, because "citations without a connection are noise." Opt-in, so the default CI gate is unchanged. New `orphan-citation` / `no-step5` rule ids. (All four shipped example dispatches were made `--strict`-clean.)
- **`study-swarm lock --init <dispatch>`** — scaffolds a fill-in-the-blanks `<dispatch>.orchestration.json` (the harness record `lock … --from` consumes), mirroring what `new` does for a dispatch.
- **`study-swarm requalify --status <corpus-dir> [--json]`** — a read-only evidence-health view of a corpus: withdrawn vs resolved counts, a breakdown by reason and resolution mode, and per-dispatch lines. Informational (exit 0), distinct from the `--check` gate.
- `lint --json` now carries a versioned `schema` + `study_swarm_version` envelope, matching the lock/sidecar/receipt objects, so a CI/roleos consumer can detect a shape change.
- `lint` now accepts a bare **RFC number** (e.g. `RFC 5280`) as a resolvable identifier — the sourcing standard already blessed it and the canon-rollback normalizer already recognized it; the linter now agrees.

### Changed

- **Security — domain-separated content-addressing (lock schema v1 → v2).** Every digest now carries a domain tag, so a prompt whose literal text equals a tool schema's canonical JSON can no longer collide with that schema's hash. `lock`, the tombstone sidecar, and the withdrawal receipt bump to schema `v2`; a `v1` artifact read by this version is reported as **"regenerate"**, not a hash mismatch. A caller-supplied `output_sha256` is validated to the `sha256-<base64>` shape where it enters. The two shipped example locks are regenerated.
- **Robustness.** Fixed a **catastrophic-backtracking (ReDoS)** in the author-citation regex that could hang the CI-gating `lint` on a long author run with no trailing year; the rewrite is linear-time and semantically identical on real citations. Corpus walks (`lint`/`withdraw`/`requalify` over a directory) now skip an unreadable subdirectory with a warning instead of aborting the whole run, don't follow symlinks, and break directory-junction cycles. A non-object (`null`) sidecar is now a reported problem, not a crash. A URL path segment like `/2024/` no longer satisfies the year requirement.
- **Humanization.** A failed `lint` now prints a "fix and re-run" trailer; the `requalify --resolve --mode removed` block message presents its two recovery paths as a legible fork; `withdraw` on an uncited id points you at `lint` and `--from`; the withdrawal-receipt line reads plainly instead of `(stdout: pass --json)`.
- **Docs.** The README + handbook CI recipe now include the `requalify --check` andon step (it was documented in the example workflow only); the handbook halt table gains the `PARTIALLY_SUPPORTED` verdict; `SECURITY.md` + `SHIP_GATE.md` now enumerate the `lock`/`withdraw`/`requalify` write surface; the landing page now surfaces the CLI (it previously showed none of the six commands).

### Release CI

- The release workflow now verifies the **packed tarball** is runnable from its shipped files only — catching a `files`-allowlist regression a working-tree smoke test can't — and pins `npm@^11.5.1` for OIDC trusted publishing instead of floating `@latest`.

Smoke coverage: 57 → 92 checks.

## [1.3.0] — 2026-06-30

Makes the **canon-rollback** executable. A verified finding becomes canon — it informs a downstream design decision — so when it is later **withdrawn** (a citation turns out fabricated/misattributed on a re-run, a cited paper is retracted, or the gate flips it) a `git revert` is not enough: the finding already propagated. This release ships the protocol's named `requalify_dependent_slices` compensator as three deterministic, network-free verbs. The design was grounded by running study-swarm on this feature itself — five load-bearing questions (revocation propagation, machine-readable status states, scholarly retraction, sound compensators, build-system staleness/tombstones/contrastive surfacing) dispatched to parallel retrieval-grounded agents; all 27 findings were gated through Step 4 (`roleos verify-citations` → prism, a different model family, reasoning-stripped) with a public-key-verified Ed25519 receipt before any informed the design.

### Added

- **`study-swarm withdraw <identifier> --reason <reason> [--detail <text>] [--from <dir>] [--receipt <path>]`** — scans the corpus for every dispatch whose *Research grounding* cites `<identifier>` (identifier-normalized across arXiv / DOI / RFC / URL forms), flags each as `evidence-withdrawn` in a co-located tombstone sidecar `<slug>.withdrawn.json` (**flag, never delete**) with a closed machine-readable `--reason` (`fabricated` / `misattributed` / `retracted` / `verifier-flipped` / `other`), and emits a content-addressed withdrawal receipt (the withdrawn id + reason + every dependent flagged + a `receipt_sha256` + the post-rollback state).
- **`study-swarm requalify --check <corpus-dir>`** — fails closed (exit `1`) for any dispatch carrying an unresolved `evidence-withdrawn` flag — the andon that **halts** a withdrawn finding's dependents until it is removed or re-grounded. Also catches a hand-edited sidecar via self-integrity. Gates CI.
- **`study-swarm requalify --resolve <dispatch> <identifier> --mode removed|regrounded [--note <text>]`** — clears a flag once the finding is removed (deterministically checked) or re-grounded (`--note` records the sibling-runner re-verification attestation; the CLI does not itself re-verify). **Idempotent**, and **appends** to the sidecar's append-only audit trail rather than editing in place.
- A worked, runner-verified reference dispatch — `examples/study-swarm-canon-rollback.dispatch.md` (27 cited findings) — with its harness record (`examples/study-swarm-canon-rollback.orchestration.json`) and lock (`examples/study-swarm-canon-rollback.lock.json`); the first dispatch to ship a lock **and** be withdrawn-then-requalified.
- Smoke coverage proving the rollback round-trips: a meta-test seeds two dispatches citing one identifier, withdraws it (both go `evidence-withdrawn`, `requalify --check` goes **RED**), re-grounds one (it goes **GREEN** while the other stays **RED**), plus determinism, idempotency, self-integrity tamper, line-ending invariance, and a DECOMPOSE boundary test proving `lock --verify` is unaffected by a withdraw/resolve.

### Changed

- `PROTOCOL.md` adds a **"Compensating a withdrawn finding (canon-rollback)"** section — the executable shape of `requalify_dependent_slices` and its honest ceiling.

### Honest ceiling

The CLI **flags, gates, and receipts deterministically** (file reads, JSON I/O, SHA-256 — zero-dependency, network-free). The actual **re-verification** of a re-grounded finding is the sibling runner's job (`roleos verify-citations` → prism), not this package; `requalify --resolve --mode regrounded` records that it happened, it does not perform it. The tombstone is the volatile evidence layer and never touches the stable `PROTOCOL.md`/lock shape. Grounded in Garcia-Molina & Salem 1987 (Sagas, DOI:10.1145/38713.38742), RFC 5280 / RFC 6066 / RFC 7633, OpenVEX & CSAF 2.0 & CycloneDX 1.6, NISO CREC RP-45-2024, the RetractoBot RCT (DeVito et al. 2024), Mokhov, Mitchell & Peyton Jones 2018 (DOI:10.1145/3236774), Buçinca et al. 2024 (arXiv:2410.04253), and Bansal et al. 2021 (arXiv:2006.14779).

## [1.2.0] — 2026-06-30

Makes a study-swarm dispatch **byte-replayable**. The design was grounded by running study-swarm on this feature itself — five load-bearing questions (replay-manifest structure, cross-platform canonicalization, step-level provenance, LLM replay-determinism reality, tool-schema drift) dispatched to parallel retrieval-grounded agents; all 39 findings were gated through Step 4 (`roleos verify-citations` → prism, a different model family, reasoning-stripped) with a public-key-verified Ed25519 receipt before any informed the design.

### Added

- **`study-swarm lock <dispatch> --from <orchestration.json>`** — writes a companion `dispatch.lock.json` that content-addresses, per Step-2 research agent, the resolved model id, the SHA-256 of the byte-exact prompt, and the SHA-256 of the tool schema, plus the Step-4 verifier receipt, rolled into one `lock_sha256` (the PIN_PER_STEP standard). The harness emits the record; the CLI stays zero-dependency and network-free, only canonicalizing (RFC 8785 JCS + NFC normalization, no BOM), hashing (SHA-256, self-describing `sha256-…` digests), and validating.
- **`study-swarm lock --verify <dispatch> [--from …]`** — re-derives every deterministic hash and fails closed (exit `1`) on any drift: a changed prompt, a swapped or aliased model, a shifted tool surface, edited dispatch text, or a tampered lock file. Gates CI like a package lockfile. Without `--from`, it checks the lock's own integrity.
- A worked, runner-verified reference dispatch — `examples/study-swarm-lock.dispatch.md` (39 cited findings) — with its harness record (`examples/study-swarm-lock.orchestration.json`) and the first shipped lock (`examples/study-swarm-lock.lock.json`). All three ship in the npm tarball.
- Smoke coverage proving `lock --verify` goes **RED** on every drift class (prompt, output, model, dispatch text, lock-file tamper) and that `lock` builds deterministically — a lock that can't detect drift is theater.

### Changed

- `PROTOCOL.md` adds a short **Replayability** section stating the PIN_PER_STEP property and its honest ceiling.

### Honest ceiling

Pinning model + prompt + temperature does **not** make an LLM's *output* bit-identical (batch-invariance, floating-point non-associativity, mixture-of-experts routing, silent provider drift). The lock pins **inputs byte-exact and records output hashes for drift detection** — replayable inputs + drift-detectable outputs, never "deterministic replay." Grounded in He & Thinking Machines Lab 2025, Yuan et al. 2025 (arXiv:2506.09501), Atil et al. 2024 (arXiv:2408.04667), and Chen, Zaharia & Zou 2023 (arXiv:2307.09009).

## [1.1.0] — 2026-06-29

The protocol run on itself a second time — to design its own next version. Four load-bearing questions the first release left to "I think" were dispatched to parallel research agents; all 27 resulting citations were gated through Step 4 (retrieval oracle for existence + two different model families for groundedness, reasoning-stripped) before any informed the design. The oracle confirmed 27/27 exist — including six 2025–2026 papers a parametric model would have false-flagged — and corrected five attributions, among them a real first-author misattribution the research agent flagged on itself.

### Changed

- **PROTOCOL.md Step 4 (groundedness) is now decomposed and ternary.** The stage-2 check no longer judges a finding sentence whole — it decomposes the finding into *molecular* claims (decontextualized + minimal), filters to the load-bearing claim so padding earns no credit, checks each against the source, and returns *fully / partially / not supported*. A partially-supported finding (real paper, resolvable link, overstated sentence) is corrected-once or escalated, never auto-passed. Grounded in Min et al. 2023 (arXiv:2305.14251), Gao et al. 2023 (arXiv:2305.14627), Gunjal & Durrett 2024 (arXiv:2406.20079), Jiang et al. 2024 (arXiv:2407.03572), Wanner et al. 2024 (arXiv:2403.11903).
- **PROTOCOL.md Step 4 specifies an aggregation rule (the cascade).** Where v1.0.0 said only "≥3 decorrelated lenses, diversity > count," v1.1 says *how* to combine them: existence is gated by the deterministic oracle alone (the one genuinely decorrelated lens), the LLM lenses vote only on groundedness via a tuned minority-veto, and lens disagreement on a post-cutoff paper escalates rather than auto-rejects. Grounded in Kohli 2026 (arXiv:2605.29800), Jain et al. 2025 (arXiv:2510.11822), Kolawole et al. 2024 (arXiv:2407.02348), Tian et al. 2025 (arXiv:2508.06225).
- **PROTOCOL.md Step 2 mandates generation-time grounding** (browse-then-cite, cite only fetched sources, drop-don't-invent) paired with a coverage-recovery pass, since forcing retrieval buys precision at the cost of coverage. Grounded in Asai et al. 2023 (arXiv:2310.11511), Nakano et al. 2021 (arXiv:2112.09332), Saxena et al. 2025 (arXiv:2509.21557), Rao et al. 2026 (arXiv:2604.03173).
- **PROTOCOL.md halt table: abstention is now calibrated and evidence-gated.** `CANNOT_CONFIRM` stays a first-class verdict (not a binary collapsed under a confidence cut), triggers on external evidence absence rather than the verifier's own entropy, is surfaced contrastively, and the abstain rate is capped as its own halt. Grounded in Zhang et al. 2023 (arXiv:2311.09677), Phillips et al. 2026 (arXiv:2603.21172), Wang et al. 2024 (arXiv:2407.00499), Srinivasan & Thomason 2025 (arXiv:2502.13321), Zhu et al. 2025 (arXiv:2502.05911).

### Added

- Shipped a second worked, lint-clean reference dispatch — `examples/study-swarm-v1_1.dispatch.md` — the full v1.1 design pass with all 27 citations and the external-verification receipt. It is `study-swarm lint`-clean and in the npm tarball.

## [1.0.0] — 2026-06-13

First stable release. A dogfood-swarm health + feature pass hardened the CLI and verified the methodology against its own gate — all 16 cited papers checked by a retrieval oracle plus a different model family (0 fabricated, 0 misattributed).

### Security

- `new` now sanitizes the slug to a single filename — path separators are replaced with `-` and pure-dots slugs are rejected — so it can only ever write `<slug>.dispatch.md` in the current working directory (a slug like `../../x` previously wrote outside it).
- Pinned the GitHub Pages workflow's actions to commit SHAs, matching the release workflow.

### Added

- `lint` now also checks that each finding names an **author** before the year (Unicode-aware, so names like "Buçinca" count), completing the author + year + identifier sourcing standard the docs describe.
- `lint --json` emits a machine-readable report (stable `rule` ids + line numbers) for CI annotations and downstream tools.
- `lint` accepts **multiple paths, a directory** (linted recursively for `*.dispatch.md`), or **`-` for stdin** — so `study-swarm lint dispatches/` gates a whole corpus and a pre-commit hook can pipe a staged file.
- On a clean lint, the CLI now names the deferred Step-4 next step (`roleos verify-citations`), so a clean form-check isn't mistaken for verified.
- `new` stamps methodology provenance into each scaffolded dispatch (`study-swarm vX.Y.Z · protocol-sha256:… · created:…`), fulfilling the "pin the methodology version" promise.
- Shipped a worked, lint-clean reference dispatch (`examples/study-swarm-self.dispatch.md`) and a copy-paste CI sample (`examples/study-swarm-ci.yml`); both are in the npm tarball.

### Fixed

- `lint`: an arXiv id's `YYMM` prefix is no longer mistaken for a publication year, so a finding with no spelled-out year is correctly flagged.
- `lint`: the "studies show…" gesture check is now scoped to the *Research grounding* section and fires even when a citation sits on the same line.
- `lint`: the *Research grounding* section is found by a heading whose text *ends* with that phrase, so a document title that merely mentions "research grounding" no longer shadows the real section.
- `lint`: numbered lines inside fenced code blocks are no longer mistaken for findings.
- `lint` on a directory, and `protocol` when `PROTOCOL.md` is unreadable, now report an actionable message instead of a raw `EISDIR`.
- Light-mode handbook link colour darkened to meet WCAG AA contrast, and added a site favicon (previously a 404 on every page).

### Changed

- `SECURITY.md` and the README Security section now describe the real shipped artifact — a thin, zero-dependency CLI — replacing stale "documentation repository / reserved placeholder / no executable code" language, and the Supported-versions table now lists the version line that actually ships.
- `new` now notes when it had to sanitize a slug, so the created filename is never a silent surprise.

### Docs

- Added arXiv identifiers to the Bansal 2021 and Wei 2022 citations so they meet the project's own sourcing standard.
- README CLI section now shows the typical `new → lint → verify` loop, a "Gate it in CI" recipe, and the Step-3→Step-4 handoff contract.
- Corrected the PROTOCOL.md sourcing standard so it matches what `lint` enforces (a resolvable identifier **or** a direct URL, not "title AND a separate URL" — the repo's own examples cite a bare arXiv id).
- New handbook page **Common failure modes** (symptom → catching step → fix); Step-1 "is this question load-bearing?" heuristics in PROTOCOL.md and the handbook; the `new` template now embeds a worked example finding + selection hint.

## [0.6.0] — 2026-06-02

### Added

- **Thin CLI** (`study-swarm`) — zero runtime dependencies, ships in the package:
  - `study-swarm protocol` — print the locked protocol.
  - `study-swarm new <slug>` — scaffold a `<slug>.dispatch.md` to fill in.
  - `study-swarm lint <file>` — deterministically check a dispatch's *Research grounding* against the sourcing standard (every finding needs author + year + a resolvable arXiv/DOI/URL; vague "studies show…" claims are rejected). Exit `1` on violations, so it gates CI.
- `npm run verify` smoke test; CI smoke-tests the CLI before publishing.

## [0.5.0] — 2026-06-02

### Added

- Initial public release of the **study-swarm** methodology.
- `README.md` — the protocol in five steps, the family-different verification rationale (with citations), the proof (two decorrelated non-Claude families catching planted citation traps), and how it wires to prism-verify + role-os.
- `PROTOCOL.md` — the locked execution shape: the two-stage citation check, the halt table, the sourcing standard, and the architecture the protocol enables.
- `SECURITY.md`, MIT `LICENSE`, project logo.
- Landing page + Starlight handbook at <https://dogfood-lab.github.io/study-swarm/>.

[2.0.0]: https://github.com/dogfood-lab/study-swarm/releases/tag/v2.0.0
[1.3.0]: https://github.com/dogfood-lab/study-swarm/releases/tag/v1.3.0
[1.2.0]: https://github.com/dogfood-lab/study-swarm/releases/tag/v1.2.0
[1.1.0]: https://github.com/dogfood-lab/study-swarm/releases/tag/v1.1.0
[1.0.0]: https://github.com/dogfood-lab/study-swarm/releases/tag/v1.0.0
[0.6.0]: https://github.com/dogfood-lab/study-swarm/releases/tag/v0.6.0
[0.5.0]: https://github.com/dogfood-lab/study-swarm/releases/tag/v0.5.0
