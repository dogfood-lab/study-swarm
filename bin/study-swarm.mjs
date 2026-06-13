#!/usr/bin/env node
// study-swarm — thin CLI for the research-grounded design protocol.
// Zero runtime dependencies. Commands: protocol | new | lint | help | version.
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));
const VERSION = PKG.version;

const HELP = `study-swarm v${VERSION} — ground design decisions in cited research, then verify.

USAGE
  study-swarm <command> [args]

COMMANDS
  protocol            Print the locked protocol (the five steps + halt rules).
  new <slug>          Scaffold a dispatch file <slug>.dispatch.md to fill in.
  lint <file>         Check a dispatch's citations against the sourcing standard.
  help                Show this help.
  version             Print the version.

EXIT CODES
  0  ok / lint clean
  1  lint found sourcing violations
  2  usage or runtime error

NOTE
  lint checks citation FORM (Step 3: author + year + a resolvable arXiv/DOI/URL,
  no "studies show…" gestures) — it does not judge whether a source is legitimate
  or actually supports the claim. That is Step 4, below.

Run a dispatch's model-based verification with: roleos verify-citations <file>
Docs: https://dogfood-lab.github.io/study-swarm/
`;

function fail(code, msg) {
  process.stderr.write(`study-swarm: ${msg}\n`);
  process.exit(code);
}

function cmdProtocol() {
  const p = resolve(__dirname, '../PROTOCOL.md');
  if (!existsSync(p)) fail(2, 'PROTOCOL.md not found in package');
  try { process.stdout.write(readFileSync(p, 'utf8')); }
  catch (err) { fail(2, `cannot read PROTOCOL.md in package: ${err && err.code ? err.code : err.message}`); }
}

const template = (slug) => `# Study-swarm dispatch: ${slug}

> Fill in each section. Verify citations (Step 4) BEFORE connecting findings to the design (Step 5).
> Lint the sourcing with:  study-swarm lint ${slug}.dispatch.md

## Step 1 — Load-bearing questions
<!-- 3-5 questions where empirical evidence would change the answer. Fewer is fine if the decision is substantial. -->
1.
2.
3.

## Step 2 — Research dispatch
<!-- One research agent per question, in parallel. Each returns: title, authors, year, URL, one-sentence finding. -->

## Step 3 — Research grounding
<!-- One entry per finding (this is what 'lint' checks):
     N. **<finding>.** <Authors> <year> (<arXiv:NNNN.NNNNN | DOI>). <design implication>. -->
1. **<finding>.** <Authors> <year> (arXiv:____.____). <implication>.

## Step 4 — External verification
<!-- Different model family, reasoning-stripped. Run:  roleos verify-citations ${slug}.dispatch.md
     HALT on fabricated/misattributed; halt-and-escalate if the verifier or oracle is unavailable. -->
- [ ] every citation resolved by retrieval (arXiv/DOI), not model memory
- [ ] every finding matches what its source actually claims (groundedness)
- [ ] >= 3 decorrelated lenses (retrieval oracle + >= 2 different model families)

## Step 5 — Architecture
<!-- Each load-bearing choice references a finding by number. Citations without a connection are noise. -->
`;

function cmdNew(slug) {
  if (!slug) fail(2, 'usage: study-swarm new <slug>');
  // Reduce the slug to a single safe filename: strip any trailing .dispatch.md (even if
  // repeated), then collapse anything that isn't a word char, dot, or hyphen to '-'. Path
  // separators ('/' and '\') are NOT permitted — `new` writes ONE file in the current
  // directory and must never traverse out of it. A pure-dots slug ('.', '..') is rejected.
  const stem = String(slug).replace(/(\.dispatch\.md)+$/i, '');
  const safe = stem.replace(/[^\w.\-]/g, '-');
  if (!safe || /^\.+$/.test(safe)) {
    fail(2, `invalid slug "${slug}" — use letters, digits, '.', or '-' (the file stays in the current directory)`);
  }
  const out = `${safe}.dispatch.md`;
  if (existsSync(out)) fail(2, `refusing to overwrite existing ${out}`);
  writeFileSync(out, template(safe), 'utf8');
  const note = safe === stem ? '' : ` (slug sanitized to "${safe}")`;
  process.stdout.write(`Created ${out}${note}\nFill it in, then:  study-swarm lint ${out}\n`);
}

function cmdLint(file) {
  if (!file) fail(2, 'usage: study-swarm lint <file>');
  if (!existsSync(file)) fail(2, `file not found: ${file}`);
  if (statSync(file).isDirectory()) fail(2, `${file} is a directory — point lint at a .dispatch.md file.`);
  let raw;
  try { raw = readFileSync(file, 'utf8'); }
  catch (err) { fail(2, `cannot read ${file}: ${err && err.code ? err.code : err.message}`); }
  const lines = raw.split(/\r?\n/);

  // Find the "Research grounding" heading — the one whose heading TEXT ends with that phrase,
  // so a title like "...a research grounding exercise" above the real section can't shadow it.
  // If several match, take the last (the real Step-3 section is conventionally last).
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^#{1,6}\s+(.*?)\s*$/);
    if (h && /research grounding$/i.test(h[1])) start = i;
  }
  if (start === -1) fail(1, 'no "Research grounding" section found — every dispatch needs one (Step 3).');
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i])) { end = i; break; }
  }
  const section = lines.slice(start + 1, end);

  const YEAR = /\b(19|20)\d{2}\b/;
  const ID = /(arxiv:\s*\d{4}\.\d{4,5}|10\.\d{4,9}\/\S+|https?:\/\/\S+)/i;
  const PLACEHOLDER = /arXiv:_{2,}|<finding>|<authors>|<year>|<implication>/i;
  const BANNED = /\b(studies show|research suggests|it'?s well[- ]established|well[- ]established that)\b/i;
  // An author cite: a capitalized name (Unicode-aware, so "Buçinca" counts), optionally
  // followed by "et al.", "&", "and", or further surnames, immediately before the year.
  // Accepts "Huang et al. 2023", "Walters & Wilder 2023", "Panickssery, Bowman & Feng 2024";
  // flags an author-less finding like "**Foo.** 2024 (arXiv:…)".
  const AUTHOR = /\p{Lu}[\p{L}.'’-]+(?:\s*,?\s*(?:&|and|et al\.?|\p{Lu}[\p{L}.'’-]+))*\s+\(?(?:19|20)\d{2}/u;

  // Split the section into findings (numbered items + continuation lines), ignoring fenced
  // code blocks so a "1." inside a ``` example isn't mistaken for a finding.
  const findings = [];
  let cur = null;
  let inFence = false;
  for (const l of section) {
    if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^\s*\d+\.\s/.test(l)) { if (cur !== null) findings.push(cur); cur = l; }
    else if (cur !== null && l.trim()) cur += ' ' + l.trim();
  }
  if (cur !== null) findings.push(cur);

  const problems = [];
  if (findings.length === 0) problems.push('Research grounding has no numbered findings.');
  findings.forEach((f, i) => {
    const n = i + 1;
    if (PLACEHOLDER.test(f)) problems.push(`finding ${n}: still has template placeholders — fill it in.`);
    // Strip identifiers before the year check so an arXiv id's YYMM prefix
    // (e.g. 2402 in arXiv:2402.01817) can't masquerade as a publication year.
    const fNoIds = f.replace(/arxiv:\s*\d{4}\.\d{4,5}/gi, '').replace(/10\.\d{4,9}\/\S+/g, '');
    if (!YEAR.test(fNoIds)) problems.push(`finding ${n}: missing a year (spell it out, e.g. "2024" — an arXiv id alone is not a year).`);
    if (!AUTHOR.test(f)) problems.push(`finding ${n}: missing an author before the year (e.g. "Huang et al. 2023").`);
    if (!ID.test(f)) problems.push(`finding ${n}: missing an identifier (arXiv:NNNN.NNNNN, DOI, or URL).`);
  });
  // Flag the banned gesture itself anywhere in the grounding section (outside code fences):
  // a finding should STATE its result, never "studies show…" — a co-located citation doesn't redeem it.
  let fence = false;
  section.forEach((l, idx) => {
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; return; }
    if (!fence && BANNED.test(l)) {
      problems.push(`line ${start + 2 + idx}: name the study (author + year + identifier), don't gesture: "${l.trim().slice(0, 56)}"`);
    }
  });

  if (problems.length) {
    process.stderr.write(`x ${file}: ${problems.length} sourcing issue(s)\n`);
    for (const p of problems) process.stderr.write(`  - ${p}\n`);
    process.exit(1);
  }
  process.stdout.write(`ok ${file}: ${findings.length} finding(s), all sourced.\n`);
}

function main(argv) {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'protocol': return cmdProtocol();
    case 'new': return cmdNew(rest[0]);
    case 'lint': return cmdLint(rest[0]);
    case 'version': case '--version': case '-v':
      return void process.stdout.write(VERSION + '\n');
    case 'help': case '--help': case '-h': case undefined:
      return void process.stdout.write(HELP);
    default:
      fail(2, `unknown command "${cmd}". Run "study-swarm help".`);
  }
}

try {
  main(process.argv.slice(2).filter((a) => a !== '--debug'));
} catch (err) {
  if (process.argv.includes('--debug')) throw err;
  fail(2, err && err.message ? err.message : String(err));
}
