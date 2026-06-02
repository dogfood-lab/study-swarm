# Security Policy

`study-swarm` is a **documentation repository** — it contains the study-swarm methodology (Markdown) and a logo asset. It ships no executable code, no compiled artifacts, and installs nothing from this repository. (The npm name `@dogfood-lab/study-swarm` is a reserved placeholder; this repo is the methodology source, not the package.)

## Threat model

- **What it touches:** nothing at runtime. There is no program to run; reading the docs executes no code.
- **What it does NOT touch:** your filesystem, network, credentials, or environment.
- **Telemetry:** none. **Secrets/credentials:** none in source.
- **Permissions required:** none.

The methodology *describes* a workflow that uses web retrieval and model-based verification, but this repository does not implement or execute that workflow.

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |
| < 1.0   | —         |

## Reporting

Found an error in the methodology, a broken or misattributed citation, or a security concern in related tooling? Open an issue at <https://github.com/dogfood-lab/study-swarm/issues>, or email **64996768+mcp-tool-shop@users.noreply.github.com**. We aim to acknowledge within 7 days.
