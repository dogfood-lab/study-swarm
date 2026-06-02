# Ship Gate

> No repo is "done" until every applicable line is checked.
> Copy this into your repo root. Check items off per-release.

**Tags:** `[all]` every repo · `[npm]` `[pypi]` `[vsix]` `[desktop]` `[container]` published artifacts · `[mcp]` MCP servers · `[cli]` CLI tools

> **Repo type:** a research-grounded methodology + a **thin, zero-dependency CLI**, published as the npm package `@dogfood-lab/study-swarm`. `[cli]` and `[npm]` items apply; `[mcp]`/`[desktop]`/`[vsix]`/`[pypi]`/`[container]` are `SKIP`.

---

## A. Security Baseline

- [x] `[all]` SECURITY.md exists (2026-06-02)
- [x] `[all]` README includes threat model paragraph (2026-06-02 — "## Security": docs + a read-mostly CLI, no network, no secrets)
- [x] `[all]` No secrets, tokens, or credentials in source or diagnostics output (2026-06-02)
- [x] `[all]` No telemetry by default — stated explicitly (2026-06-02 — README + SECURITY.md)

### Default safety posture

- [x] `[cli]` No dangerous actions — CLI has no kill/delete/restart; `new` writes one file and refuses to overwrite (2026-06-02)
- [x] `[cli]` File operations constrained — `lint` reads only; `new` writes `<slug>.dispatch.md` in cwd, never overwrites (2026-06-02)
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server

## B. Error Handling

- [x] `[all]` Errors are structured (CLI form): prefixed `study-swarm: <message>` on stderr + exit codes; no raw stack traces (2026-06-02)
- [x] `[cli]` Exit codes: 0 ok/clean · 1 lint violations · 2 usage/runtime error — documented in `--help` (2026-06-02)
- [x] `[cli]` No raw stack traces without `--debug` (2026-06-02 — top-level try/catch)
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[desktop]` SKIP: not a desktop app
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it is, install, CLI usage, supported runtime (Node >=18) (2026-06-02)
- [x] `[all]` CHANGELOG.md (Keep a Changelog format) (2026-06-02)
- [x] `[all]` LICENSE file present and repo states support status (2026-06-02 — MIT; support status in SECURITY.md)
- [x] `[cli]` `--help` output accurate for all commands and flags (2026-06-02)
- [x] `[cli]` Logging: normal stdout + `--debug`; no secrets handled at any level (2026-06-02)
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[complex]` SKIP: not a complex ops tool — the Starlight handbook ships the operator docs

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists — `npm run verify` runs the CLI smoke test (2026-06-02; CI runs it before publish)
- [x] `[all]` Version in manifest matches git tag — `release.yml` verifies `package.json` version == tag, fails closed (2026-06-02)
- [ ] `[all]` SKIP: dependency scanning — zero runtime dependencies (`site/` build deps are dev-only static generation)
- [ ] `[all]` SKIP: automated dependency updates — zero runtime dependencies (dependabot is opt-in per org policy)
- [x] `[npm]` `npm pack --dry-run` includes `bin/`, README + 7 translations, PROTOCOL, SECURITY, LICENSE, CHANGELOG (2026-06-02 — verified; no `dist/` — pure ESM, no build)
- [x] `[npm]` `engines.node` set (`>=18`) (2026-06-02)
- [ ] `[npm]` SKIP: lockfile — zero dependencies, no `package-lock.json` needed
- [ ] `[vsix]` SKIP: not a VS Code extension
- [ ] `[desktop]` SKIP: not a desktop app

## E. Identity (soft gate — does not block ship)

- [x] `[all]` Logo in README header (2026-06-02)
- [x] `[all]` Translations (polyglot-mcp, 7 languages) (2026-06-02 — ja/zh/es/fr/hi/it/pt-BR)
- [x] `[org]` Landing page + Starlight handbook (2026-06-02 — https://dogfood-lab.github.io/study-swarm/)
- [x] `[all]` GitHub repo metadata: description, homepage, topics (2026-06-02 — 8 topics)

---

## Gate Rules

**Hard gate (A–D):** Must pass before any version is tagged or published.
If a section doesn't apply, mark `SKIP:` with justification — don't leave it unchecked.

**Soft gate (E):** Should be done. Product ships without it, but isn't "whole."
