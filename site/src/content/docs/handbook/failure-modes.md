---
title: Common failure modes
description: The specific failures study-swarm exists to catch — symptom, the step that catches it, and the corrective action.
sidebar:
  order: 5
---

study-swarm is defined as much by what it *prevents* as by what it prescribes. These are the recurring failures a substantial design decision falls into, the symptom that gives each one away, and the step that catches it. Use it as a self-check while a dispatch is in flight.

| Failure mode | Symptom | Caught by | Corrective action |
|---|---|---|---|
| **Fabricated citation** | the arXiv id / DOI resolves to nothing | Step 4, retrieval oracle | drop it — there is no real source to correct |
| **Misattribution** | a real paper, but the wrong author or year | Step 4, retrieval oracle | correct the attribution and re-verify **once**; a second non-clean verdict drops it |
| **Groundedness gap** | the link resolves, but the source never makes the claim | Step 4, groundedness lens | rewrite the finding to what the source *actually* says, or drop it |
| **Self-grading** | the model that synthesized the design also "verifies" it | Step 4, different-family rule | a verifier of a **different model family**, reasoning-stripped — never the generator |
| **Postdated-paper false-flag** | an LLM declares a real 2026 paper "fabricated" because it postdates training | the retrieval-oracle requirement | check existence by **retrieval, not recall** — an LLM cannot know a paper it never saw |
| **Question padding** | five "load-bearing" questions, but only two would change a design | Step 1 | run 1–2 agents on the questions that matter; don't manufacture questions to hit a count |
| **Orphan citation** | a finding in the grounding section that no Step-5 choice references | Step 5 | connect it to a decision, or cut it — citations without a connection are noise |
| **"Studies show…"** | a confident claim with no source named | the sourcing standard / `study-swarm lint` | name the study: author + year + a resolvable arXiv/DOI/URL |
| **Verifier unavailable, read as "fine"** | the oracle or different-family model is unreachable, so the citation is kept anyway | Step 4 halt table | **halt and escalate** — an unreachable verifier is a *closed* gate, never an open one |

The throughline: **an unverified citation never reaches the design.** Every row above is a way that rule gets quietly broken, and the step that stops it. When in doubt, the protocol's bias is to drop or escalate, never to proceed on hope.
