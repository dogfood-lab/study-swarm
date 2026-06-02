# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

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
