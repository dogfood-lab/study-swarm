---
title: study-swarm
description: Ground design decisions in cited research, then verify the citations with a different model family before they become canon.
sidebar:
  order: 0
---

**study-swarm is a protocol, not a tool.** When you make a substantial design decision with an LLM — a new product layer, an architecture choice, a "should we trust the model here" call — improvising from first principles ships designs that are stale, and citing papers from memory ships designs that rest on sources that don't exist or don't say what you think.

study-swarm replaces both with a disciplined loop: dispatch parallel research agents, demand specific cited findings, and gate every citation through an **external verifier of a different model family** before it informs the design.

It applies its own medicine. The protocol prescribes verifier-protected envelopes for the systems it helps design — so it runs one on itself. No model grades its own homework, including the one running the protocol.

## The protocol in five steps

1. **Identify** 3–5 load-bearing questions where empirical evidence would change the answer.
2. **Dispatch** one research agent per question, in parallel — cited findings only.
3. **Synthesize** the findings into a *Research grounding* section.
4. **Verify externally** — a different model family, reasoning-stripped, checks every citation.
5. **Connect** each architectural choice back to a finding by number.

## Where to go next

- **[The five steps](./the-protocol/)** — the locked execution shape, in detail.
- **[The verification gate](./verification-gate/)** — Step 4: the two-stage check, the halt table, and why a *different* family.
- **[Research grounding](./research-grounding/)** — the evidence behind the design, and the proof it works.
- **[Running it](./running-it/)** — by hand, or with `roleos verify-citations`.

## When to reach for it

Fire study-swarm when **any** of these hold:

- a decision introduces a **new product layer** (not a fix or operational tuning);
- the decision is **qualitative** — "trust the model here?", "explain or just do?", "cap options?", "retry or fall back?";
- you're about to recommend a **single-axis** answer (deterministic-only / LLM-only) where the real answer is multi-axis;
- an **adjacent domain** (compilers, SRE, databases, mixed-initiative HCI) has likely already solved it.

Skip it for pure fixes, scope extensions of already-grounded work, and operational tuning ("what number," not "what shape").
