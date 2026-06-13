import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'study-swarm',
  description:
    'Ground design decisions in cited research — then verify every citation with a different model family, reasoning-stripped, before it becomes canon.',
  logoBadge: 'SS',
  brandName: 'study-swarm',
  repoUrl: 'https://github.com/dogfood-lab/study-swarm',
  npmUrl: 'https://www.npmjs.com/package/@dogfood-lab/study-swarm',
  footerText:
    'MIT Licensed — part of <a href="https://github.com/dogfood-lab" style="color:var(--color-muted);text-decoration:underline">dogfood-lab</a>, built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Cited research, verified',
    headline: 'study-swarm',
    headlineAccent: 'no model grades its own homework.',
    description:
      'A protocol for grounding substantial design decisions in cited research — then verifying every citation with a different model family, reasoning-stripped, before any of it informs the design.',
    primaryCta: { href: '#protocol', label: 'See the protocol' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Dispatch', code: 'one research agent per question — cited findings only' },
      { label: 'Verify', code: 'roleos verify-citations <dispatch>' },
      { label: 'Halt', code: 'fabricated → drop · verifier down → escalate' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'why',
      title: 'Why it works',
      subtitle: 'Documented failure modes, each closed by evidence — not intuition.',
      features: [
        {
          title: 'Family-different verification',
          desc: 'A different model family checks every citation, reasoning-stripped. Same-family judges self-prefer (Panickssery 2024); the external verifier carries the gains (Huang 2023, Kambhampati 2024).',
        },
        {
          title: 'Retrieval-oracle existence floor',
          desc: 'Existence is confirmed by resolving the arXiv/DOI — never model memory. 18–55% of LLM citations are fabricated (Walters & Wilder 2023); links resolve but the content often does not support the claim (Onweller 2026).',
        },
        {
          title: 'Halt, don’t hope',
          desc: 'Fabricated → dropped. Misattributed → corrected once. Verifier or oracle unavailable → halt and escalate. An unverified citation never reaches the design.',
        },
        {
          title: 'Diversity beats count',
          desc: '≥3 decorrelated lenses — a retrieval oracle plus ≥2 different families. LLM errors correlate, so lens diversity is the load-bearing variable (Rajan 2025, Kim 2025).',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'protocol',
      title: 'The protocol',
      cards: [
        {
          title: 'Five steps',
          code: '1. Identify 3–5 load-bearing questions\n2. Dispatch one research agent per question\n3. Synthesize into a "Research grounding" section\n4. Verify externally (different family, reasoning-stripped)\n5. Connect each choice back to a finding',
        },
        {
          title: 'Verify the citations',
          code: '# different family, reasoning-stripped,\n# retrieval-oracle existence floor\nroleos verify-citations <dispatch>\n#  → prism verify --type citations',
        },
      ],
    },
  ],
};
