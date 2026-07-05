# Security Policy

`study-swarm` is the study-swarm methodology (Markdown) plus a **thin, zero-dependency command-line tool**, published as the npm package `@dogfood-lab/study-swarm`. The CLI ships in the package (`bin/study-swarm.mjs`), so installing it exposes a `study-swarm` executable. It has **no runtime dependencies** and makes **no network or model calls** — the model-based verification the methodology describes (Step 4) is run by separate tools, not by this package.

## Threat model

- **What it runs:** a small Node CLI (Node >= 18). `protocol`, `version`, and `help` only print text. `lint <path…>` **reads** the files (or stdin) you name. `new <slug>` **writes** exactly one file — `<slug>.dispatch.md` — in the current working directory, and refuses to overwrite an existing file; the slug is sanitized to a single filename (path separators replaced with `-`, pure-dots slugs rejected), so `new` cannot write outside the current directory. `lock`, `withdraw`, and `requalify` **read** the dispatch / orchestration / sidecar files you name and **write** JSON artifacts at paths you supply: a `<dispatch>.lock.json` or `<dispatch>.withdrawn.json` co-located with the dispatch you point at, and (for `withdraw --receipt <path>`) a receipt at the exact path you give. Unlike `new`, these paths are taken as given — no traversal sanitization — because the commands operate on artifacts you name explicitly; they write where you point them (like `cp` or `tee`), never anywhere derived from untrusted input.
- **What it does NOT do:** no network access, no model calls, no telemetry, no use of credentials or environment beyond what Node needs to run, and no filesystem access beyond reading the inputs you name and writing the artifacts described above.
- **Secrets/credentials:** none in source or output.
- **Permissions required:** filesystem read for `lint`; one-file write (in the working directory) for `new`. Nothing else.

The methodology *describes* a workflow that uses web retrieval and model-based verification; those are performed by the sibling tools ([prism-verify](https://github.com/mcp-tool-shop-org/prism-verify), [role-os](https://github.com/mcp-tool-shop-org/role-os)), not by this package.

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |
| < 1.0   | —         |

## Reporting

Found an error in the methodology, a broken or misattributed citation, or a security concern in related tooling? Open an issue at <https://github.com/dogfood-lab/study-swarm/issues>, or email **64996768+mcp-tool-shop@users.noreply.github.com**. We aim to acknowledge within 7 days.
