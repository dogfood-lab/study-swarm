# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Security

- `new` now rejects path separators and pure-dots slugs, so it can only write `<slug>.dispatch.md` in the current working directory (a slug like `../../x` previously wrote outside it).
- Pinned the GitHub Pages workflow's actions to commit SHAs, matching the release workflow.

### Fixed

- `lint`: an arXiv id's `YYMM` prefix is no longer mistaken for a publication year, so a finding with no spelled-out year is correctly flagged.
- `lint`: the "studies show…" gesture check is now scoped to the *Research grounding* section and fires even when a citation sits on the same line.

### Changed

- `SECURITY.md` and the README Security section now describe the real shipped artifact — a thin, zero-dependency CLI — replacing stale "documentation repository / reserved placeholder / no executable code" language, and the Supported-versions table now lists the version line that actually ships.

### Docs

- Added arXiv identifiers to the Bansal 2021 and Wei 2022 citations so they meet the project's own sourcing standard.

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

[0.6.0]: https://github.com/dogfood-lab/study-swarm/releases/tag/v0.6.0
[0.5.0]: https://github.com/dogfood-lab/study-swarm/releases/tag/v0.5.0
