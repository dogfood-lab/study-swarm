# Ship Gate

> No repo is "done" until every applicable line is checked.
> Copy this into your repo root. Check items off per-release.

**Tags:** `[all]` every repo · `[npm]` `[pypi]` `[vsix]` `[desktop]` `[container]` published artifacts · `[mcp]` MCP servers · `[cli]` CLI tools

> **Repo type:** documentation / methodology repository. No executable code, no CLI/MCP/desktop artifact, no package published *from this repo* (the npm name is a separately-reserved placeholder). Code-surface items are marked `SKIP` with reasons below.

---

## A. Security Baseline

- [x] `[all]` SECURITY.md exists (2026-06-02)
- [x] `[all]` README includes threat model paragraph (2026-06-02 — "## Security" section: docs only, touches nothing, no permissions)
- [x] `[all]` No secrets, tokens, or credentials in source or diagnostics output (2026-06-02 — Markdown + image only)
- [x] `[all]` No telemetry by default — stated explicitly (2026-06-02 — README + SECURITY.md)

### Default safety posture

- [ ] `[cli|mcp|desktop]` SKIP: not a CLI/MCP/desktop tool — docs repo, no executable actions
- [ ] `[cli|mcp|desktop]` SKIP: no file operations — docs repo
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server

## B. Error Handling

- [ ] `[all]` SKIP: no executable code — no error surface to shape
- [ ] `[cli]` SKIP: not a CLI
- [ ] `[cli]` SKIP: not a CLI
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[desktop]` SKIP: not a desktop app
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it is, how to run the protocol, supported surface (2026-06-02)
- [x] `[all]` CHANGELOG.md (Keep a Changelog format) (2026-06-02)
- [x] `[all]` LICENSE file present and repo states support status (2026-06-02 — MIT; support status in SECURITY.md)
- [ ] `[cli]` SKIP: not a CLI
- [ ] `[cli|mcp|desktop]` SKIP: no executable — no logging surface
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[complex]` SKIP: not a complex ops tool — the Starlight handbook ships the operator docs

## D. Shipping Hygiene

- [ ] `[all]` SKIP: no test/build/smoke surface — the landing-page site build (Pages CI) is the de-facto docs verification
- [ ] `[all]` SKIP: no package manifest in this repo — the GitHub release tag (v1.0.0) is the version of record; npm name is a separate placeholder
- [ ] `[all]` SKIP: no runtime dependencies — `site/` build deps are dev-only static generation
- [ ] `[all]` SKIP: no runtime dependencies to update (per org GitHub Actions policy, dependabot is opt-in only)
- [ ] `[npm]` SKIP: this repo is the methodology source, not the npm package — name reserved via a separate v0.0.0 placeholder
- [ ] `[npm]` SKIP: see above
- [ ] `[npm]` SKIP: see above
- [ ] `[vsix]` SKIP: not a VS Code extension
- [ ] `[desktop]` SKIP: not a desktop app

## E. Identity (soft gate — does not block ship)

- [x] `[all]` Logo in README header (2026-06-02)
- [ ] `[all]` Translations (polyglot-mcp, 7 languages) — in progress this treatment
- [ ] `[org]` Landing page (@mcptoolshop/site-theme) — in progress this treatment
- [ ] `[all]` GitHub repo metadata: description, homepage, topics — in progress this treatment

---

## Gate Rules

**Hard gate (A–D):** Must pass before any version is tagged or published.
If a section doesn't apply, mark `SKIP:` with justification — don't leave it unchecked.

**Soft gate (E):** Should be done. Product ships without it, but isn't "whole."
