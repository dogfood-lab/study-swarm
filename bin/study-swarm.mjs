#!/usr/bin/env node
// study-swarm — thin CLI for the research-grounded design protocol.
// Zero runtime dependencies. Commands: protocol | new | lint | help | version.
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));
const VERSION = PKG.version;
const PROTOCOL_PATH = resolve(__dirname, '../PROTOCOL.md');

const HELP = `study-swarm v${VERSION} — ground design decisions in cited research, then verify.

USAGE
  study-swarm <command> [args]

COMMANDS
  protocol                 Print the locked protocol (the five steps + halt rules).
  new <slug>               Scaffold a dispatch file <slug>.dispatch.md to fill in.
  lint [--json] <path...>  Check dispatches' citations against the sourcing standard.
                           A <path> may be a file, a directory (linted recursively for
                           *.dispatch.md), or "-" to read one dispatch from stdin.
  help                     Show this help.
  version                  Print the version.

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

// Short hash of the vendored PROTOCOL.md, so a scaffolded dispatch records the exact
// methodology version it was authored against (the package vendors PROTOCOL.md for this).
function protocolHash() {
  try { return createHash('sha256').update(readFileSync(PROTOCOL_PATH)).digest('hex').slice(0, 16); }
  catch { return 'unknown'; }
}

function cmdProtocol() {
  if (!existsSync(PROTOCOL_PATH)) fail(2, 'PROTOCOL.md not found in package');
  try { process.stdout.write(readFileSync(PROTOCOL_PATH, 'utf8')); }
  catch (err) { fail(2, `cannot read PROTOCOL.md in package: ${err && err.code ? err.code : err.message}`); }
}

const template = (slug, stamp) => `<!-- ${stamp} -->
# Study-swarm dispatch: ${slug}

> Fill in each section. Verify citations (Step 4) BEFORE connecting findings to the design (Step 5).
> Lint the sourcing with:  study-swarm lint ${slug}.dispatch.md

## Step 1 — Load-bearing questions
<!-- 3-5 questions where empirical evidence would change the answer. Fewer is fine if the decision is substantial.
     A question is load-bearing if you can picture two designs hinging on the answer and the honest current
     answer is "I think…", not "evidence says…". Don't manufacture questions to hit a count. -->
1.
2.
3.

## Step 2 — Research dispatch
<!-- One research agent per question, in parallel. Each returns: title, authors, year, URL, one-sentence finding. -->

## Step 3 — Research grounding
<!-- One entry per finding (this is what 'lint' checks):
     N. **<finding>.** <Authors> <year> (<arXiv:NNNN.NNNNN | DOI>). <design implication>.
     e.g.: 1. **Contrastive explanations with a predicted human foil improve independent decisions.** Buçinca et al. 2024 (arXiv:2410.04253). Implication: every recommendation carries a "you might think X; I chose Y because…" frame. -->
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
  // Provenance stamp: pins the methodology version a dispatch was authored against.
  const stamp = `study-swarm v${VERSION} · protocol-sha256:${protocolHash()} · created:${new Date().toISOString().slice(0, 10)}`;
  writeFileSync(out, template(safe, stamp), 'utf8');
  const note = safe === stem ? '' : ` (slug sanitized to "${safe}")`;
  process.stdout.write(`Created ${out}${note}\nFill it in, then:  study-swarm lint ${out}\n`);
}

// --- lint core ------------------------------------------------------------

const YEAR = /\b(19|20)\d{2}\b/;
const ID = /(arxiv:\s*\d{4}\.\d{4,5}|10\.\d{4,9}\/\S+|https?:\/\/\S+)/i;
const PLACEHOLDER = /arXiv:_{2,}|<finding>|<authors>|<year>|<implication>/i;
const BANNED = /\b(studies show|research suggests|it'?s well[- ]established|well[- ]established that)\b/i;
// An author cite: a capitalized name (Unicode-aware, so "Buçinca" counts), optionally
// followed by "et al.", "&", "and", or further surnames, immediately before the year.
// Accepts "Huang et al. 2023", "Walters & Wilder 2023", "Panickssery, Bowman & Feng 2024";
// flags an author-less finding like "**Foo.** 2024 (arXiv:…)".
const AUTHOR = /\p{Lu}[\p{L}.'’-]+(?:\s*,?\s*(?:&|and|et al\.?|\p{Lu}[\p{L}.'’-]+))*\s+\(?(?:19|20)\d{2}/u;

// Check one dispatch's text. Returns a structured result; never exits.
function lintText(label, raw) {
  const lines = raw.split(/\r?\n/);
  const problems = []; // { finding, line, rule, message }
  const add = (rule, message, line = null, finding = null) => problems.push({ finding, line, rule, message });

  // Find the "Research grounding" heading whose TEXT ends with that phrase (last wins), so a
  // title that merely mentions "research grounding" above the real section can't shadow it.
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^#{1,6}\s+(.*?)\s*$/);
    if (h && /research grounding$/i.test(h[1])) start = i;
  }
  if (start === -1) {
    add('no-section', 'no "Research grounding" section found — every dispatch needs one (Step 3).');
    return { file: label, ok: false, findingCount: 0, problems, findings: [] };
  }
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i])) { end = i; break; }
  }
  const section = lines.slice(start + 1, end);

  // Split into findings (numbered items + continuation lines), ignoring fenced code blocks
  // so a "1." inside a ``` example isn't mistaken for a finding. Track each finding's line.
  const findings = []; // { text, line }
  let cur = null;
  let inFence = false;
  section.forEach((l, idx) => {
    if (/^\s*(```|~~~)/.test(l)) { inFence = !inFence; return; }
    if (inFence) return;
    if (/^\s*\d+\.\s/.test(l)) { if (cur) findings.push(cur); cur = { text: l, line: start + 2 + idx }; }
    else if (cur && l.trim()) cur.text += ' ' + l.trim();
  });
  if (cur) findings.push(cur);

  if (findings.length === 0) add('no-findings', 'Research grounding has no numbered findings.');

  const parsed = [];
  findings.forEach((f, i) => {
    const n = i + 1;
    if (PLACEHOLDER.test(f.text)) add('placeholder', `finding ${n}: still has template placeholders — fill it in.`, f.line, n);
    // Strip identifiers before the year check so an arXiv id's YYMM prefix
    // (e.g. 2402 in arXiv:2402.01817) can't masquerade as a publication year.
    const fNoIds = f.text.replace(/arxiv:\s*\d{4}\.\d{4,5}/gi, '').replace(/10\.\d{4,9}\/\S+/g, '');
    if (!YEAR.test(fNoIds)) add('missing-year', `finding ${n}: missing a year (spell it out, e.g. "2024" — an arXiv id alone is not a year).`, f.line, n);
    if (!AUTHOR.test(f.text)) add('missing-author', `finding ${n}: missing an author before the year (e.g. "Huang et al. 2023").`, f.line, n);
    const idm = f.text.match(ID);
    if (!idm) add('missing-id', `finding ${n}: missing an identifier (arXiv:NNNN.NNNNN, DOI, or URL).`, f.line, n);
    const ym = fNoIds.match(YEAR);
    const ident = idm ? idm[0].replace(/\s+/g, '').replace(/[).,;]+$/, '') : null;
    parsed.push({ finding: n, year: ym ? ym[0] : null, identifier: ident });
  });

  // Banned gesture anywhere in the section (outside fences): a finding STATES its result,
  // it never "studies show…" — a co-located citation doesn't redeem it.
  let fence = false;
  section.forEach((l, idx) => {
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; return; }
    if (!fence && BANNED.test(l)) {
      add('banned-gesture', `line ${start + 2 + idx}: name the study (author + year + identifier), don't gesture: "${l.trim().slice(0, 56)}"`, start + 2 + idx);
    }
  });

  return { file: label, ok: problems.length === 0, findingCount: findings.length, problems, findings: parsed };
}

// Recursively collect *.dispatch.md files under a directory (skips node_modules/.git).
function walkDispatches(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkDispatches(full));
    else if (/\.dispatch\.md$/i.test(entry.name)) out.push(full);
  }
  return out.sort();
}

function readTarget(p) {
  try { return { label: p, raw: readFileSync(p, 'utf8') }; }
  catch (err) { fail(2, `cannot read ${p}: ${err && err.code ? err.code : err.message}`); }
}

function cmdLint(args) {
  const json = args.includes('--json');
  const paths = args.filter((a) => a !== '--json');
  if (paths.length === 0) fail(2, 'usage: study-swarm lint [--json] <file|dir|-> [more...]');

  const targets = [];
  for (const p of paths) {
    if (p === '-') {
      let raw;
      try { raw = readFileSync(0, 'utf8'); }
      catch (err) { fail(2, `cannot read stdin: ${err && err.code ? err.code : err.message}`); }
      targets.push({ label: '<stdin>', raw });
      continue;
    }
    if (!existsSync(p)) fail(2, `path not found: ${p}`);
    if (statSync(p).isDirectory()) {
      const files = walkDispatches(p);
      if (files.length === 0) fail(2, `no .dispatch.md files found under ${p}`);
      for (const f of files) targets.push(readTarget(f));
    } else {
      targets.push(readTarget(p));
    }
  }

  const results = targets.map((t) => lintText(t.label, t.raw));
  const anyFail = results.some((r) => !r.ok);

  if (json) {
    const payload = results.length === 1 ? results[0] : { ok: !anyFail, files: results };
    process.stdout.write(JSON.stringify(payload) + '\n');
    process.exit(anyFail ? 1 : 0);
  }

  for (const r of results) {
    if (r.ok) {
      process.stdout.write(`ok ${r.file}: ${r.findingCount} finding(s), all sourced.\n`);
    } else {
      process.stderr.write(`x ${r.file}: ${r.problems.length} sourcing issue(s)\n`);
      for (const pr of r.problems) process.stderr.write(`  - ${pr.message}\n`);
    }
  }
  if (!anyFail) {
    process.stdout.write(
      `\nStep 3 (sourcing FORM) is satisfied — this does NOT confirm the citations exist or support the claim.\n` +
      `Run Step 4 (existence + groundedness, a different model family):  roleos verify-citations <file>\n`,
    );
  }
  process.exit(anyFail ? 1 : 0);
}

function main(argv) {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'protocol': return cmdProtocol();
    case 'new': return cmdNew(rest[0]);
    case 'lint': return cmdLint(rest);
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
