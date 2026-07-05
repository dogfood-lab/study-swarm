#!/usr/bin/env node
// study-swarm — thin CLI for the research-grounded design protocol.
// Zero runtime dependencies. Commands: protocol | new | lint | help | version.
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, realpathSync } from 'node:fs';
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
  lint [--json] [--strict] <path...>
                           Check dispatches' citations against the sourcing standard.
                           A <path> may be a file, a directory (linted recursively for
                           *.dispatch.md), or "-" to read one dispatch from stdin.
                           --strict also flags orphan citations (a finding no Step-5 choice
                           references by number or author — "citations without a connection
                           are noise"); opt-in, so the default CI gate is unchanged.
  lock --init <dispatch>   Scaffold <dispatch>.orchestration.json — a fill-in-the-blanks
                           harness record to feed to "lock <dispatch> --from".
  lock <dispatch> --from <orchestration.json>
                           Emit <dispatch>.lock.json — pin (per Step-2 agent) the resolved
                           model + SHA-256 of the byte-exact prompt + SHA-256 of the tool
                           schema, plus the verifier receipt, rolled into one lock_sha256.
  lock --verify <dispatch> [--from <orchestration.json>]
                           Re-derive the deterministic hashes and assert they match the lock;
                           drift exits 1 (gates CI). Without --from, checks lock self-integrity.
  withdraw <identifier> --reason <reason> [--detail <text>] [--from <dir>] [--receipt <path>]
                           Canon-rollback compensator. Flag every dispatch in the corpus whose
                           Research grounding cites <identifier> as "evidence-withdrawn" (a
                           tombstone sidecar <slug>.withdrawn.json — flag, never delete), and emit
                           a content-addressed withdrawal receipt. --reason is one of:
                           fabricated | misattributed | retracted | verifier-flipped | other.
  requalify --check <corpus-dir>
                           Fail closed (exit 1) for any dispatch carrying an unresolved
                           evidence-withdrawn flag — the andon that HALTS a withdrawn finding's
                           dependents until it is removed or re-grounded. Gates CI.
  requalify --status <corpus-dir> [--json]
                           Read-only evidence-health VIEW of a corpus: withdrawn vs resolved
                           counts, a breakdown by reason and resolution mode, per-dispatch
                           lines. Informational (exit 0), unlike the --check gate.
  requalify --resolve <dispatch> <identifier> --mode removed|regrounded [--note <text>]
                           Clear a flag once the finding is removed (the citation is gone) or
                           re-grounded (re-verified clean by the sibling runner; --note records
                           the attestation). Idempotent; appends to the sidecar's audit trail.
  help                     Show this help.
  version                  Print the version.

EXIT CODES
  0  ok / lint clean / verify clean
  1  a gate failed: a lint sourcing violation, lock --verify drift, or an
     unresolved evidence-withdrawn flag (requalify --check)
  2  usage or runtime error

NOTE
  lint checks citation FORM (Step 3: author + year + a resolvable arXiv/DOI/URL/RFC,
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
  try { return createHash('sha256').update(normText(readFileSync(PROTOCOL_PATH, 'utf8'))).digest('hex').slice(0, 16); }
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
// A resolvable identifier: an arXiv id, a DOI, a direct URL, or a bare RFC number
// (RFC parity keeps `lint` in step with the sourcing standard and with normIdent, which
// already treats `RFC NNNN` as first-class in withdraw/requalify).
const ID = /(arxiv:\s*\d{4}\.\d{4,5}|10\.\d{4,9}\/\S+|https?:\/\/\S+|\brfc[\s/-]?\d{3,5}\b)/i;
const PLACEHOLDER = /arXiv:_{2,}|<finding>|<authors>|<year>|<implication>/i;
const BANNED = /\b(studies show|research suggests|it'?s well[- ]established|well[- ]established that)\b/i;
// An author cite: a capitalized name (Unicode-aware, so "Buçinca" counts), optionally
// followed by "et al.", "&", "and", or further surnames, immediately before the year.
// Accepts "Huang et al. 2023", "Walters & Wilder 2023", "Panickssery, Bowman & Feng 2024",
// and space-separated org authors ("OASIS CSAF Technical Committee 2022");
// flags an author-less finding like "**Foo.** 2024 (arXiv:…)".
// The inner group requires a non-empty separator per iteration (`,?\s+`, never the old
// empty-matchable `\s*,?\s*`) and is bounded ({0,24}), so it is linear-time — the previous
// form had catastrophic backtracking (ReDoS) on a long capitalized/`and`-joined run with no
// trailing year, hanging the CI-gating `lint` command.
const AUTHOR = /\p{Lu}[\p{L}.'’-]+(?:,?\s+(?:&|and|et al\.?|\p{Lu}[\p{L}.'’-]+)){0,24}\s+\(?(?:19|20)\d{2}/u;

// --- strict mode: Step-5 connection / orphan-citation check (opt-in --strict) --------------
// Step 5 requires each finding to inform a design choice — "citations without a connection are
// noise" (PROTOCOL.md). This makes the protocol's one otherwise-unexecutable failure mode ("orphan
// citation") deterministic: a Step-3 finding whose number OR first-author token is never referenced
// in the "Step 5 / Architecture" section is flagged. Deliberately LIBERAL about what counts as a
// reference — a missed orphan is safer than a false orphan — so it never fails a dispatch that
// connected a finding in any reasonable numeric ("(findings 1, 3)") or prose ("Kim 2025") form.
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// The first-author surname token of a finding: the first Capitalized word after the bold **title**.
function authorTokenOf(findingText) {
  const afterBold = String(findingText).replace(/^\s*\d+\.\s*/, '').replace(/^\s*\*\*[^*]*\*\*/, '');
  const m = afterBold.match(/\p{Lu}[\p{L}.'’-]+/u);
  return m ? m[0] : null;
}
// Finding numbers referenced in a Step-5 body: any "#N", plus every integer following the word
// "finding"/"findings" (covers "(findings 1, 3 and 5)"). Liberal.
function referencedNumbers(body) {
  const nums = new Set();
  for (const m of body.matchAll(/#\s*(\d+)/g)) nums.add(Number(m[1]));
  for (const m of body.matchAll(/\bfindings?\b[\s:#-]*((?:\d+[\s,#&-]*(?:and\s+)?)+)/gi)) {
    for (const d of m[1].match(/\d+/g) || []) nums.add(Number(d));
  }
  return nums;
}
// The Step-5 / Architecture section body (last matching heading → next heading/EOF), or null.
function step5Body(lines) {
  let s = -1;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^#{1,6}\s+(.*?)\s*$/);
    if (h && /(step\s*5|architecture)/i.test(h[1])) s = i;
  }
  if (s === -1) return null;
  let e = lines.length;
  for (let i = s + 1; i < lines.length; i++) { if (/^#{1,6}\s/.test(lines[i])) { e = i; break; } }
  return lines.slice(s + 1, e).join('\n');
}

// Check one dispatch's text. Returns a structured result; never exits. `strict` adds the Step-5
// orphan-citation check (opt-in, so the default CI gate stays stable).
function lintText(label, raw, strict) {
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
    // Strip identifiers before the year check so digits inside a citation can't masquerade
    // as a publication year: an arXiv id's YYMM prefix (e.g. 2402 in arXiv:2402.01817), a DOI,
    // or a year-like URL path segment (e.g. /2024/ in https://host/2024/paper). URLs are
    // stripped first so a DOI-bearing URL is removed whole.
    const fNoIds = f.text.replace(/https?:\/\/\S+/gi, '').replace(/arxiv:\s*\d{4}\.\d{4,5}/gi, '').replace(/10\.\d{4,9}\/\S+/g, '');
    if (!YEAR.test(fNoIds)) add('missing-year', `finding ${n}: missing a year (spell it out, e.g. "2024" — an arXiv id alone is not a year).`, f.line, n);
    if (!AUTHOR.test(f.text)) add('missing-author', `finding ${n}: missing an author before the year (e.g. "Huang et al. 2023").`, f.line, n);
    const idm = f.text.match(ID);
    if (!idm) add('missing-id', `finding ${n}: missing an identifier (arXiv:NNNN.NNNNN, DOI, URL, or RFC number).`, f.line, n);
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

  // --strict: flag orphan citations — a finding no Step-5 choice connects to (Step 5 / orphan-citation).
  if (strict) {
    const body = step5Body(lines);
    if (body === null) {
      add('no-step5', 'strict: no "Step 5" / "Architecture" section found to check finding connections against.');
    } else {
      const refs = referencedNumbers(body);
      findings.forEach((f, i) => {
        const n = i + 1;
        const tok = authorTokenOf(f.text);
        // Match the author token OR (for a hyphenated surname like "Garcia-Molina") its first
        // component, so a Step-5 reference to just "Garcia" still connects — the liberal direction.
        const alts = tok ? [...new Set([tok, tok.split('-')[0]])].filter((t) => t.length >= 2) : [];
        const tokHit = alts.some((t) => new RegExp('(?<![\\p{L}])' + escRe(t) + '(?![\\p{L}])', 'iu').test(body));
        if (!refs.has(n) && !tokHit) {
          add('orphan-citation', `finding ${n}: no Step-5 choice references it (by number or author) — a citation without a connection is noise (Step 5).`, f.line, n);
        }
      });
    }
  }

  return { file: label, ok: problems.length === 0, findingCount: findings.length, problems, findings: parsed };
}

// Recursively collect files whose name matches `re` under `dir`, sorted for determinism.
// Resilient by design:
//  - an unreadable directory (EACCES/EPERM/ENOTDIR) is SKIPPED with a stderr note, never fatal, so a
//    single bad node does not abort a whole-corpus lint / withdraw / requalify (PH-02);
//  - symlinked entries are not followed, and a realpath `seen` set breaks directory-junction cycles
//    (common on Windows) that would otherwise recurse until stack / path-length exhaustion (PH-03).
// Skips node_modules/.git.
function walkFiles(dir, re, seen) {
  seen = seen || new Set();
  let real; try { real = realpathSync(dir); } catch { real = dir; }
  if (seen.has(real)) return []; // already visited via another path — junction/symlink cycle guard
  seen.add(real);
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch (err) { process.stderr.write(`study-swarm: skipping ${dir}: ${err && err.code ? err.code : err.message}\n`); return []; }
  const out = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    if (entry.isSymbolicLink()) continue; // don't follow symlinks (cycle + directory-escape safety)
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, re, seen));
    else if (re.test(entry.name)) out.push(full);
  }
  return out.sort();
}
function walkDispatches(dir) { return walkFiles(dir, /\.dispatch\.md$/i); }

function readTarget(p) {
  try { return { label: p, raw: readFileSync(p, 'utf8') }; }
  catch (err) { fail(2, `cannot read ${p}: ${err && err.code ? err.code : err.message}`); }
}

const LINT_SCHEMA = 'study-swarm.lint/v1'; // versioned handle for --json consumers (FG-03)

function cmdLint(args) {
  const json = args.includes('--json');
  const strict = args.includes('--strict'); // opt-in: also flag Step-5 orphan citations (FG-01)
  const paths = args.filter((a) => a !== '--json' && a !== '--strict');
  if (paths.length === 0) fail(2, 'usage: study-swarm lint [--json] [--strict] <file|dir|-> [more...]');

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

  const results = targets.map((t) => lintText(t.label, t.raw, strict));
  const anyFail = results.some((r) => !r.ok);

  if (json) {
    // A versioned envelope so a CI/roleos consumer can detect a shape change (FG-03), matching the
    // schema/version pattern the lock, sidecar, and receipt objects already carry.
    const meta = { schema: LINT_SCHEMA, study_swarm_version: VERSION };
    const payload = results.length === 1 ? { ...meta, ...results[0] } : { ...meta, ok: !anyFail, files: results };
    process.stdout.write(JSON.stringify(payload) + '\n');
    process.exit(anyFail ? 1 : 0);
  }

  for (const r of results) {
    if (r.ok) {
      process.stdout.write(`ok ${r.file}: ${r.findingCount} finding(s), all sourced${strict ? ' and connected' : ''}.\n`);
    } else {
      process.stderr.write(`x ${r.file}: ${r.problems.length} ${strict ? 'issue(s)' : 'sourcing issue(s)'}\n`);
      for (const pr of r.problems) process.stderr.write(`  - ${pr.message}\n`);
    }
  }
  if (!anyFail) {
    process.stdout.write(
      `\nStep 3 (sourcing FORM) is satisfied — this does NOT confirm the citations exist or support the claim.\n` +
      `Run Step 4 (existence + groundedness, a different model family):  roleos verify-citations <file>\n`,
    );
  } else {
    // Symmetry with the clean-path nudge: tell the user what to do next (H1).
    process.stderr.write(`\nFix the issue(s) above, then re-run study-swarm lint. (This checks Step 3 sourcing FORM${strict ? ' + Step 5 connections' : ''} only.)\n`);
  }
  process.exit(anyFail ? 1 : 0);
}

// --- lock core (dispatch.lock.json — the PIN_PER_STEP feature) ------------------
// Design + research grounding: examples/study-swarm-lock.dispatch.md (choices L1-L11).
// The CLI is a PURE FUNCTION of provided bytes: the orchestration harness emits the record
// (resolved models + byte-exact prompts + tool schemas + verifier receipt); the CLI only
// canonicalizes + hashes + validates it. No network, no model calls (L2).

const LOCK_SCHEMA = 'dispatch.lock/v2';

// Self-describing digest "sha256-<base64>" — the W3C Subresource Integrity form: algorithm-
// prefixed (so it's algorithm-agile) and used fail-closed on mismatch (L9; lock dispatch finding 38).
function sriBytes(buf) { return 'sha256-' + createHash('sha256').update(buf).digest('base64'); }
// Domain-separation tags (v2): a TEXT preimage and a structured-JSON (JCS) preimage are hashed in
// DISJOINT spaces, so a prompt whose literal text happens to equal some tool schema's canonical JSON
// can never produce the same digest as that schema (the tagged-hash / DSSE "hash known bytes with a
// context" rule the lock dispatch cites — TUF/Rekor/CT). Without a tag, jcsDigest({}) === sriText('{}').
// The tag carries the schema major, so bumping it is itself a lock-format change — hence the v1 -> v2
// bump on LOCK_SCHEMA / WITHDRAWN_SCHEMA / RECEIPT_SCHEMA, and the schema gate on read that turns a
// stale-format lock into a clear "regenerate" message instead of a confusing hash mismatch.
const DOMAIN_TEXT = 'study-swarm/v2/text\n';
const DOMAIN_JCS = 'study-swarm/v2/jcs\n';
// Normalize TEXT before hashing so the same content hashes identically across platforms — strip a
// BOM, fold CRLF/CR -> LF, NFC-normalize. Without this, a CRLF working tree (Windows) and an LF
// checkout (git/CI) produce different hashes — the exact cross-platform drift our Q2 findings warn
// about (RFC 8259 BOM, UAX #15 NFC, and CRLF/LF). Applied to every text input that gets hashed.
function normText(s) { s = String(s); if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1); return s.replace(/\r\n?/g, '\n').normalize('NFC'); }
function sriText(str) { return sriBytes(Buffer.from(DOMAIN_TEXT + normText(str), 'utf8')); }

// RFC 8785 (JCS) canonical JSON, for the structured JSON the CLI assembles ITSELF (the tool
// surface and the lock body): NFC-normalize strings, sort object keys by UTF-16 code unit (JS
// default string sort), no inter-token whitespace, ECMAScript-shortest numbers, UTF-8 (L4).
// The PROMPT is NOT JCS-restructured — it is the literal string the model conditioned on, so it is
// hashed as text (L3; JWS/DSSE hash-known-bytes rule, findings 12/23) under the SAME newline/BOM/NFC
// normalization (normText) so the same prompt hashes identically across platforms (findings 10/11).
function jcs(value) {
  const ser = (v) => {
    if (v === null) return 'null';
    const t = typeof v;
    if (t === 'boolean') return v ? 'true' : 'false';
    if (t === 'number') {
      if (!Number.isFinite(v)) throw new Error('JCS: non-finite number not allowed');
      return JSON.stringify(v); // ECMAScript Number->String shortest round-trip
    }
    if (t === 'string') return JSON.stringify(normText(v));
    if (Array.isArray(v)) return '[' + v.map(ser).join(',') + ']';
    if (t === 'object') {
      return '{' + Object.keys(v).sort()
        .map((k) => JSON.stringify(normText(k)) + ':' + ser(v[k])).join(',') + '}';
    }
    throw new Error(`JCS: unsupported type ${t}`);
  };
  return ser(value);
}
function jcsDigest(value) { return sriBytes(Buffer.from(DOMAIN_JCS + jcs(value), 'utf8')); }

// The lock sits beside its dispatch: <dir>/<stem>.lock.json (stem strips a trailing .dispatch.md).
function lockPathFor(dispatch) {
  const base = dispatch.split(/[\\/]/).pop().replace(/(\.dispatch)?\.md$/i, '');
  return join(dirname(dispatch), `${base}.lock.json`);
}

// Build the lock object from the dispatch bytes + the harness-emitted orchestration record.
function buildLockObject(dispatchPath, orchestration) {
  const dispatchText = readFileSync(dispatchPath, 'utf8');
  const protocolText = readFileSync(PROTOCOL_PATH, 'utf8');
  if (!orchestration || !Array.isArray(orchestration.steps) || orchestration.steps.length === 0) {
    fail(2, 'orchestration record has no non-empty "steps" array');
  }
  const steps = orchestration.steps.map((s, i) => {
    const need = (k) => {
      if (s == null || s[k] === undefined || s[k] === null) fail(2, `orchestration step ${i + 1} is missing "${k}"`);
      return s[k];
    };
    const rec = {
      question_id: String(need('question_id')),
      resolved_model: String(need('resolved_model')),       // L6 — the resolved id, never an alias
      prompt_sha256: sriText(String(need('prompt'))),       // L3 — text-normalized (LF/NFC/BOM), not JCS-restructured
      tool_schema_sha256: jcsDigest(need('tool_schema')),   // L5 — canonicalized tool surface
    };
    if (s.schema_dialect) rec.schema_dialect = String(s.schema_dialect); // L5 — dialect is contract
    if (s.params && typeof s.params === 'object') rec.params = s.params;
    // L7 — output hash for DRIFT DETECTION only (not determinism). The harness may ship the raw
    // output (the CLI hashes it) OR a pre-computed output_sha256 (large outputs needn't be shipped).
    // A caller-supplied digest is validated to the SRI sha256- shape here, so a malformed hash is
    // rejected where it enters rather than mis-surfacing as "drift" on a later verify (PH-05).
    if (typeof s.output_sha256 === 'string') {
      if (!/^sha256-[A-Za-z0-9+/]+=*$/.test(s.output_sha256)) {
        fail(2, `orchestration step ${i + 1} output_sha256 is not an "sha256-<base64>" digest: "${s.output_sha256}"`);
      }
      rec.output_sha256 = s.output_sha256;
    } else if (s.output !== undefined) rec.output_sha256 = typeof s.output === 'string' ? sriText(s.output) : jcsDigest(s.output);
    return rec;
  });
  const lock = {
    schema: LOCK_SCHEMA,
    study_swarm_version: VERSION,
    protocol_sha256: sriText(protocolText),  // pins the methodology version (text-normalized)
    dispatch_sha256: sriText(dispatchText),  // pins the dispatch text (text-normalized)
    steps,
  };
  if (orchestration.verification && typeof orchestration.verification === 'object') {
    lock.verification = orchestration.verification; // L10 — the external-verifier receipt
  }
  // L1/L9 — rollup over the whole body (this object, before lock_sha256 is added) as ONE flat
  // canonical object: distinct keys give domain separation, the steps array's explicit length
  // commits to exactly N steps (no odd-leaf duplication).
  lock.lock_sha256 = jcsDigest(lock);
  return lock;
}

// A forward-compat guard (PH-04): an artifact whose `schema` string names a version this CLI does
// not write is reported as "regenerate", not as a confusing hash/integrity mismatch — because the
// hash preimage (the domain tag) changes with the schema major, a v1 artifact read by a v2 CLI would
// otherwise fail self-integrity with a misleading "the body was edited" accusation. Absent schema =
// no gate (the self-integrity check still applies). Returns a message string, or null when in-version.
function staleSchema(stored, expected, kind, path) {
  if (stored && typeof stored === 'object' && typeof stored.schema === 'string' && stored.schema !== expected) {
    return `${path}: ${kind} is schema "${stored.schema}"; this study-swarm v${VERSION} understands "${expected}" — regenerate it (the hash format changed between schema versions).`;
  }
  return null;
}

// Verify a lock: self-integrity always; source-drift too when an orchestration record is supplied.
// Strict-match, fail-closed (L8): returns a list of problems (empty = clean).
function verifyLockObject(dispatchPath, lockPath, orchestration) {
  let stored;
  try { stored = JSON.parse(readFileSync(lockPath, 'utf8')); }
  catch (err) { fail(2, `cannot read lock ${lockPath}: ${err && err.code ? err.code : err.message}`); }
  // 0) Stale-format gate — a wrong-schema lock is "regenerate", not a hash mismatch (PH-04).
  const stale = staleSchema(stored, LOCK_SCHEMA, 'lock', lockPath);
  if (stale) return [stale];
  const problems = [];
  // 1) Self-integrity — recompute lock_sha256 over the stored body (detects a hand-edited lock).
  if (!stored || typeof stored !== 'object' || typeof stored.lock_sha256 !== 'string') {
    problems.push('lock has no lock_sha256 string');
  } else {
    const { lock_sha256, ...body } = stored;
    const recomputed = jcsDigest(body);
    if (lock_sha256 !== recomputed) {
      problems.push(`lock_sha256 mismatch (the lock body was edited): stored ${lock_sha256} != recomputed ${recomputed}`);
    }
  }
  // 2) Source drift — re-derive the deterministic hashes from the live inputs and strict-compare.
  if (orchestration) {
    const fresh = buildLockObject(dispatchPath, orchestration);
    const cmp = (label, a, b) => { if (a !== b) problems.push(`${label} drift: lock ${b} != re-derived ${a}`); };
    cmp('lock_sha256', fresh.lock_sha256, stored.lock_sha256); // the authoritative rollup guard
    cmp('protocol_sha256', fresh.protocol_sha256, stored.protocol_sha256);
    cmp('dispatch_sha256', fresh.dispatch_sha256, stored.dispatch_sha256);
    const a = fresh.steps || [], b = Array.isArray(stored.steps) ? stored.steps : [];
    if (a.length !== b.length) problems.push(`step count drift: re-derived ${a.length} != lock ${b.length}`);
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      for (const k of ['question_id', 'resolved_model', 'prompt_sha256', 'tool_schema_sha256']) {
        cmp(`steps[${i}].${k}`, a[i][k], b[i][k]);
      }
      if (a[i].output_sha256 || b[i].output_sha256) cmp(`steps[${i}].output_sha256`, a[i].output_sha256, b[i].output_sha256);
    }
  }
  return problems;
}

// FG-05 — scaffold the orchestration.json the harness must supply, mirroring what `new` does for a
// dispatch. A deterministic Write of a template (no network, no models); refuses to overwrite. The
// orchestration record is the harder artifact to hand-author, and its shape was documented only in
// the large worked examples — this gives a fill-in-the-blanks starting point.
const orchTemplate = () => JSON.stringify({
  _note: 'study-swarm orchestration record — the harness-emitted input to `study-swarm lock <dispatch> --from <this file>`. One steps[] entry per Step-2 research agent; replace every <...> placeholder. A full worked record: examples/study-swarm-lock.orchestration.json. Optional per step: params, schema_dialect, output_sha256 (an "sha256-<base64>" digest for drift detection).',
  steps: [
    {
      question_id: '<Q1-short-slug>',
      resolved_model: '<resolved model id, e.g. claude-opus-4-8 — never a floating alias>',
      prompt: '<the byte-exact prompt string this research agent was given>',
      tool_schema: { type: 'object', properties: {} },
      schema_dialect: 'https://json-schema.org/draft/2020-12/schema',
    },
  ],
  verification: {
    runner: 'roleos verify-citations',
    tool: 'prism verify --type citations',
    verifier_family: '<a DIFFERENT model family than the synthesizer>',
    receipt_id: '<prism-receipt-id>',
    receipt_chain_sha256: '<the verifier receipt chain hash>',
  },
}, null, 2) + '\n';

function orchPathFor(dispatch) {
  const base = dispatch.split(/[\\/]/).pop().replace(/(\.dispatch)?\.md$/i, '');
  return join(dirname(dispatch), `${base}.orchestration.json`);
}

function cmdLock(args) {
  if (args.includes('--init')) { // FG-05 — scaffold the orchestration record for a dispatch
    const dispatch = args.filter((a) => a !== '--init')[0];
    if (!dispatch) fail(2, 'usage: study-swarm lock --init <dispatch>');
    if (!existsSync(dispatch)) fail(2, `dispatch not found: ${dispatch}`);
    const out = orchPathFor(dispatch);
    if (existsSync(out)) fail(2, `refusing to overwrite existing ${out}`);
    writeFileSync(out, orchTemplate(), 'utf8');
    process.stdout.write(`Created ${out}\nFill in each step (one per Step-2 research agent), then:  study-swarm lock ${dispatch} --from ${out}\n`);
    return;
  }
  const verify = args.includes('--verify');
  const rest = args.filter((a) => a !== '--verify');
  let orchPath = null;
  const fromIdx = rest.indexOf('--from');
  if (fromIdx !== -1) {
    orchPath = rest[fromIdx + 1];
    if (!orchPath) fail(2, 'usage: --from <orchestration.json>');
    rest.splice(fromIdx, 2);
  }
  const dispatch = rest[0];
  if (!dispatch) {
    fail(2, 'usage: study-swarm lock <dispatch> --from <orchestration.json>  |  study-swarm lock --verify <dispatch> [--from <orchestration.json>]');
  }
  if (!existsSync(dispatch)) fail(2, `dispatch not found: ${dispatch}`);
  let orchestration = null;
  if (orchPath) {
    if (!existsSync(orchPath)) fail(2, `orchestration record not found: ${orchPath}`);
    try { orchestration = JSON.parse(readFileSync(orchPath, 'utf8')); }
    catch (err) { fail(2, `orchestration record is not valid JSON: ${err.message}`); }
  }
  const lockPath = lockPathFor(dispatch);

  if (verify) {
    if (!existsSync(lockPath)) fail(2, `no lock at ${lockPath} — create it with:  study-swarm lock ${dispatch} --from <orchestration.json>`);
    const problems = verifyLockObject(dispatch, lockPath, orchestration);
    if (problems.length === 0) {
      const scope = orchestration ? 'lock integrity verified + no source drift' : 'lock self-integrity verified (pass --from to also check source drift)';
      process.stdout.write(`ok ${lockPath}: ${scope}.\n`);
      process.exit(0);
    }
    process.stderr.write(`x ${lockPath}: ${problems.length} drift/integrity issue(s)\n`);
    for (const p of problems) process.stderr.write(`  - ${p}\n`);
    process.exit(1);
  }

  if (!orchestration) {
    fail(2, 'study-swarm lock <dispatch> requires --from <orchestration.json> — the harness-emitted record of resolved models + byte-exact prompts + tool schemas + the verifier receipt');
  }
  const lock = buildLockObject(dispatch, orchestration);
  writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n', 'utf8');
  process.stdout.write(`Created ${lockPath}\nlock_sha256: ${lock.lock_sha256}\nVerify with:  study-swarm lock --verify ${dispatch} --from ${orchPath}\n`);
}

// --- canon-rollback core (the requalify_dependent_slices compensator) -----------
// Design + research grounding: examples/study-swarm-canon-rollback.dispatch.md (choices C1-C12).
// The compensator operates on the VOLATILE evidence layer (a per-dispatch tombstone sidecar),
// never the STABLE protocol/lock shape — `lock --verify` is unaffected by withdraw/resolve (C11,
// the Parnas boundary). Like `lock`, the CLI is a PURE FUNCTION of bytes: it flags, gates, and
// receipts deterministically (file reads, JSON I/O, SHA-256); the actual re-verification of a
// re-grounded finding defers to the sibling runner (C12, honest ceiling). No network, no models.

const WITHDRAWN_SCHEMA = 'dispatch.withdrawn/v2';
const RECEIPT_SCHEMA = 'withdrawal-receipt/v2';
// A CLOSED, machine-readable reason enum — never free text (C3; OpenVEX/CSAF/CycloneDX: a status
// must carry a structured justification, a bare flag is non-conformant).
const WITHDRAW_REASONS = ['fabricated', 'misattributed', 'retracted', 'verifier-flipped', 'other'];

// Normalize a citation identifier to ONE canonical key so the SAME source matches across the forms
// a finding might cite it in: arXiv (bare / arxiv.org URL / version suffix), DOI (bare / doi.org
// URL), RFC (RFC NNNN / rfc-editor / datatracker), else a trimmed lowercased URL. Used on BOTH the
// dispatch's extracted identifier and the user's <identifier> argument so `withdraw arXiv:2402.15089`
// flags a finding citing `https://arxiv.org/abs/2402.15089v2` (C2).
function normIdent(raw) {
  let s = String(raw || '').trim().toLowerCase().replace(/[).,;]+$/, '');
  let m = s.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/) || s.match(/arxiv:\s*(\d{4}\.\d{4,5})/);
  if (m) return 'arxiv:' + m[1];
  m = s.match(/(?:doi\.org\/|dx\.doi\.org\/|doi:\s*)?(10\.\d{4,9}\/\S+)/);
  if (m) return 'doi:' + m[1].replace(/[).,;]+$/, '');
  m = s.match(/rfc[\s/-]?(\d{3,5})/);
  if (m) return 'rfc:' + m[1];
  return s.replace(/\/+$/, '');
}

// The tombstone sits beside its dispatch: <dir>/<stem>.withdrawn.json (C4 — status travels WITH
// the artifact, the OCSP-stapling property; stem strips a trailing .dispatch.md).
function withdrawnPathFor(dispatch) {
  const base = dispatch.split(/[\\/]/).pop().replace(/(\.dispatch)?\.md$/i, '');
  return join(dirname(dispatch), `${base}.withdrawn.json`);
}

// Recursively collect files matching a regex (delegates to the resilient shared walker).
function walkByExt(dir, re) { return walkFiles(dir, re); }

// The finding numbers in one dispatch whose citation normalizes to `want` (reuses the lint parser,
// so Step 3 and the compensator agree on what a citation is).
function findingsCiting(dispatchPath, want) {
  const res = lintText(dispatchPath, readFileSync(dispatchPath, 'utf8'));
  return (res.findings || []).filter((f) => f.identifier && normIdent(f.identifier) === want).map((f) => f.finding);
}

// Every dispatch in the corpus citing `target`, with the finding numbers + a content hash each.
function findDependents(corpus, target) {
  const want = normIdent(target);
  const files = statSync(corpus).isDirectory() ? walkDispatches(corpus) : [corpus];
  const deps = [];
  for (const f of files) {
    const hits = findingsCiting(f, want);
    if (hits.length) deps.push({ path: f, dispatch_sha256: sriText(readFileSync(f, 'utf8')), findings: hits });
  }
  return deps;
}

// Content-address the sidecar/receipt exactly like the lock: jcsDigest over the body with the hash
// field omitted (C8/C9 — TUF/Rekor/CT/Git content-addressing; self-integrity catches a hand-edit).
function withSha(body, key) {
  const { [key]: _omit, ...rest } = body;
  return { ...rest, [key]: jcsDigest(rest) };
}

// Load an existing tombstone sidecar, or seed a fresh one for `dispatch`.
function loadSidecar(dispatchPath) {
  const p = withdrawnPathFor(dispatchPath);
  if (existsSync(p)) {
    try { return JSON.parse(readFileSync(p, 'utf8')); }
    catch (err) { fail(2, `cannot read sidecar ${p}: ${err && err.code ? err.code : err.message}`); }
  }
  return {
    schema: WITHDRAWN_SCHEMA,
    study_swarm_version: VERSION,
    dispatch: dispatchPath.split(/[\\/]/).pop(),
    dispatch_sha256: sriText(readFileSync(dispatchPath, 'utf8')),
    version: 0,
    withdrawals: [],
    audit_trail: [],
  };
}

// Recompute the rolled-up hash and write the sidecar; returns the finalized object.
function writeSidecar(dispatchPath, body) {
  body.dispatch_sha256 = sriText(readFileSync(dispatchPath, 'utf8')); // reconcile to current content
  const finalized = withSha(body, 'withdrawn_sha256');
  writeFileSync(withdrawnPathFor(dispatchPath), JSON.stringify(finalized, null, 2) + '\n', 'utf8');
  return finalized;
}

function parseFlags(args, withValue) {
  const out = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (withValue.has(k)) { out[k] = args[++i]; }
      else out[k] = true;
    } else out._.push(a);
  }
  return out;
}

function cmdWithdraw(args) {
  const f = parseFlags(args, new Set(['reason', 'detail', 'from', 'receipt']));
  const identifier = f._[0];
  if (!identifier) fail(2, 'usage: study-swarm withdraw <identifier> --reason <reason> [--detail <text>] [--from <corpus-dir>] [--receipt <path>] [--json]');
  if (!f.reason) fail(2, `withdraw requires --reason <${WITHDRAW_REASONS.join('|')}> — a withdrawal with no machine-readable cause is not allowed`);
  if (!WITHDRAW_REASONS.includes(String(f.reason))) fail(2, `invalid --reason "${f.reason}" — use one of: ${WITHDRAW_REASONS.join(', ')}`);
  const corpus = f.from || '.';
  if (!existsSync(corpus)) fail(2, `corpus not found: ${corpus}`);
  const want = normIdent(identifier);
  const detail = f.detail ? String(f.detail) : '';

  const deps = findDependents(corpus, identifier);
  if (deps.length === 0) fail(2, `no dispatch in ${corpus} cites ${identifier} (normalized: ${want}) — nothing to withdraw. Check the identifier spelling and the --from directory; "study-swarm lint ${corpus}" lists the citations the tool can see.`);

  const dependents = [];
  for (const d of deps) {
    const body = loadSidecar(d.path);
    const existing = body.withdrawals.find((w) => w.identifier === want);
    // Idempotent: an identical withdrawal (same id + reason + detail + finding numbers, still
    // withdrawn) is a no-op. The findings array is part of the identity so that re-withdrawing
    // after the dispatch was edited (a citation moved to a different finding #) refreshes the
    // stale numbers instead of being skipped as "identical".
    const sameFindings = existing && Array.isArray(existing.findings) &&
      existing.findings.length === d.findings.length && existing.findings.every((v, i) => v === d.findings[i]);
    const identical = existing && existing.status === 'withdrawn' && existing.reason === String(f.reason) && (existing.detail || '') === detail && sameFindings;
    if (!identical) {
      if (existing) {
        existing.reason = String(f.reason); existing.detail = detail; existing.status = 'withdrawn'; existing.resolution = null; existing.findings = d.findings;
      } else {
        body.withdrawals.push({ identifier: want, reason: String(f.reason), detail, findings: d.findings, status: 'withdrawn', resolution: null });
      }
      body.version += 1;
      body.audit_trail.push({ seq: body.audit_trail.length + 1, event: 'withdraw', identifier: want, reason: String(f.reason), findings: d.findings });
    }
    const finalized = writeSidecar(d.path, body);
    dependents.push({ dispatch: finalized.dispatch, dispatch_sha256: finalized.dispatch_sha256, findings: d.findings, sidecar: withdrawnPathFor(d.path).split(/[\\/]/).pop() });
  }

  const receipt = withSha({
    schema: RECEIPT_SCHEMA,
    study_swarm_version: VERSION,
    identifier: want,
    reason: String(f.reason),
    detail,
    corpus: corpus.split(/[\\/]/).pop() || corpus,
    dependents,
    post_rollback_state: `${dependents.length} dependent(s) flagged evidence-withdrawn; "study-swarm requalify --check" fails closed until each is removed or re-grounded.`,
  }, 'receipt_sha256');

  if (f.receipt) writeFileSync(String(f.receipt), JSON.stringify(receipt, null, 2) + '\n', 'utf8');

  if (f.json) {
    process.stdout.write(JSON.stringify(receipt) + '\n');
    process.exit(0);
  }
  // Contrastive surfacing — never a silent drop (C10; Buçinca 2024, Bansal 2021).
  process.stdout.write(`Withdrew ${want} (reason: ${f.reason}). ${dependents.length} dependent(s) flagged evidence-withdrawn:\n`);
  for (const d of dependents) process.stdout.write(`  - ${d.dispatch} (findings ${d.findings.map((n) => '#' + n).join(', ')})\n`);
  process.stdout.write(
    `\nYou may have relied on this finding. Each flagged dispatch now HALTS "study-swarm requalify --check"\n` +
    `until the finding is removed or re-grounded — re-ground or override.\n` +
    `${f.receipt ? `Receipt written to ${String(f.receipt)}` : 'No receipt file written — re-run with --receipt <path> or --json to capture it'} — receipt_sha256 ${receipt.receipt_sha256}\n`);
  process.exit(0);
}

function cmdRequalify(args) {
  if (args.includes('--check')) return requalifyCheck(args.filter((a) => a !== '--check'));
  if (args.includes('--resolve')) return requalifyResolve(args.filter((a) => a !== '--resolve'));
  if (args.includes('--status')) return requalifyStatus(args.filter((a) => a !== '--status'));
  fail(2, 'usage: study-swarm requalify --check <corpus-dir>  |  study-swarm requalify --status <corpus-dir> [--json]  |  study-swarm requalify --resolve <dispatch> <identifier> --mode removed|regrounded [--note <text>]');
}

const STATUS_SCHEMA = 'study-swarm.status/v1';

// FG-04 — the read-only evidence-health VIEW of a corpus (distinct from --check, the CI gate). Walks
// the .withdrawn.json sidecars and aggregates: withdrawn vs resolved counts, a breakdown by reason
// and by resolution mode, and a per-dispatch line. Informational — it never fails closed (exit 0),
// so it composes in a report without gating a build the way --check does.
function requalifyStatus(args) {
  const f = parseFlags(args, new Set());
  const corpus = f._[0];
  if (!corpus) fail(2, 'usage: study-swarm requalify --status <corpus-dir> [--json]');
  if (!existsSync(corpus)) fail(2, `corpus not found: ${corpus}`);
  const sidecars = statSync(corpus).isDirectory() ? walkByExt(corpus, /\.withdrawn\.json$/i) : [corpus];
  const totals = { withdrawn: 0, resolved: 0 };
  const by_reason = {};
  const by_mode = {};
  const dispatches = [];
  const problems = [];
  for (const sc of sidecars) {
    let stored;
    try { stored = JSON.parse(readFileSync(sc, 'utf8')); }
    catch (err) { problems.push(`${sc}: not valid JSON (${err.message})`); continue; }
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) { problems.push(`${sc}: sidecar is not a JSON object`); continue; }
    const entries = [];
    for (const w of stored.withdrawals || []) {
      const status = w.status === 'resolved' ? 'resolved' : 'withdrawn';
      totals[status] += 1;
      if (w.reason) by_reason[w.reason] = (by_reason[w.reason] || 0) + 1;
      const mode = status === 'resolved' && w.resolution ? w.resolution.mode : null;
      if (mode) by_mode[mode] = (by_mode[mode] || 0) + 1;
      entries.push({ identifier: w.identifier, reason: w.reason, status, mode, findings: w.findings || [] });
    }
    dispatches.push({ dispatch: stored.dispatch, sidecar: sc.split(/[\\/]/).pop(), withdrawals: entries });
  }
  const kv = (o) => Object.keys(o).sort().map((k) => `${k}=${o[k]}`).join(', ') || '(none)';
  if (f.json) {
    process.stdout.write(JSON.stringify({ schema: STATUS_SCHEMA, study_swarm_version: VERSION, corpus, totals, by_reason, by_mode, dispatches, problems }) + '\n');
    process.exit(0);
  }
  process.stdout.write(`study-swarm requalify --status ${corpus}: ${dispatches.length} sidecar(s), ${totals.withdrawn + totals.resolved} withdrawal(s)\n`);
  process.stdout.write(`  ${totals.withdrawn} unresolved (evidence-withdrawn), ${totals.resolved} resolved\n`);
  process.stdout.write(`  by reason: ${kv(by_reason)}\n`);
  process.stdout.write(`  by resolution mode: ${kv(by_mode)}\n`);
  for (const d of dispatches) {
    for (const w of d.withdrawals) {
      const tag = w.status === 'resolved' ? `resolved: ${w.mode}` : 'withdrawn';
      process.stdout.write(`  - ${d.dispatch}: ${w.identifier} (${w.reason}) [${tag}] findings ${(w.findings || []).map((n) => '#' + n).join(', ')}\n`);
    }
  }
  for (const p of problems) process.stderr.write(`  ! ${p}\n`);
  process.exit(0);
}

function requalifyCheck(args) {
  const f = parseFlags(args, new Set());
  const corpus = f._[0];
  if (!corpus) fail(2, 'usage: study-swarm requalify --check <corpus-dir> [--json]');
  if (!existsSync(corpus)) fail(2, `corpus not found: ${corpus}`);
  const sidecars = statSync(corpus).isDirectory() ? walkByExt(corpus, /\.withdrawn\.json$/i) : [corpus];
  const halts = []; // { sidecar, dispatch, identifier, reason, findings }
  const problems = [];
  let resolvedCount = 0;
  for (const sc of sidecars) {
    let stored;
    try { stored = JSON.parse(readFileSync(sc, 'utf8')); }
    catch (err) { problems.push(`${sc}: not valid JSON (${err.message})`); continue; }
    // A non-object sidecar (null / array / scalar) is a reportable problem, not a crash — the per-file
    // loop keeps checking the rest of the corpus and the offending file is named (PH-01).
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
      problems.push(`${sc}: sidecar is not a JSON object`); continue;
    }
    // Stale-format gate — a wrong-schema sidecar is "regenerate", not a self-integrity failure (PH-04).
    const stale = staleSchema(stored, WITHDRAWN_SCHEMA, 'sidecar', sc);
    if (stale) { problems.push(stale); continue; }
    // Self-integrity: a hand-edited sidecar (e.g. a status forged to "resolved") fails closed.
    if (typeof stored.withdrawn_sha256 !== 'string' || stored.withdrawn_sha256 !== withSha(stored, 'withdrawn_sha256').withdrawn_sha256) {
      problems.push(`${sc}: withdrawn_sha256 self-integrity mismatch (the sidecar was hand-edited)`);
    }
    for (const w of stored.withdrawals || []) {
      if (w.status === 'withdrawn') halts.push({ sidecar: sc.split(/[\\/]/).pop(), dispatch: stored.dispatch, identifier: w.identifier, reason: w.reason, findings: w.findings });
      else if (w.status === 'resolved') resolvedCount += 1;
    }
  }
  const red = halts.length > 0 || problems.length > 0;
  if (f.json) {
    process.stdout.write(JSON.stringify({ ok: !red, halts, resolved: resolvedCount, problems }) + '\n');
    process.exit(red ? 1 : 0);
  }
  if (!red) {
    process.stdout.write(`ok ${corpus}: no unresolved evidence-withdrawn flags (${resolvedCount} resolved).\n`);
    process.exit(0);
  }
  process.stderr.write(`x requalify --check ${corpus}: ${halts.length} unresolved evidence-withdrawn flag(s) — HALT\n`);
  for (const h of halts) process.stderr.write(`  - ${h.dispatch}: ${h.identifier} withdrawn (reason: ${h.reason}) — findings ${(h.findings || []).map((n) => '#' + n).join(', ')}. You may have relied on it; re-ground or override.\n`);
  for (const p of problems) process.stderr.write(`  - ${p}\n`);
  process.exit(1);
}

function requalifyResolve(args) {
  const f = parseFlags(args, new Set(['mode', 'note']));
  const dispatch = f._[0];
  const identifier = f._[1];
  if (!dispatch || !identifier) fail(2, 'usage: study-swarm requalify --resolve <dispatch> <identifier> --mode removed|regrounded [--note <text>]');
  if (!existsSync(dispatch)) fail(2, `dispatch not found: ${dispatch}`);
  const scPath = withdrawnPathFor(dispatch);
  if (!existsSync(scPath)) fail(2, `no tombstone sidecar at ${scPath} — nothing to resolve`);
  const mode = f.mode ? String(f.mode) : null;
  if (mode !== 'removed' && mode !== 'regrounded') fail(2, 'requalify --resolve requires --mode removed|regrounded');
  const want = normIdent(identifier);
  let body;
  try { body = JSON.parse(readFileSync(scPath, 'utf8')); }
  catch (err) { fail(2, `cannot read sidecar ${scPath}: ${err && err.code ? err.code : err.message}`); }
  const entry = (body.withdrawals || []).find((w) => w.identifier === want);
  if (!entry) fail(2, `no evidence-withdrawn flag for ${identifier} (normalized: ${want}) on ${dispatch}`);

  if (entry.status === 'resolved') { // Idempotent: re-resolving is a no-op, no new audit entry (C7).
    process.stdout.write(`ok ${scPath}: ${want} already resolved (mode: ${entry.resolution && entry.resolution.mode}) — no-op.\n`);
    process.exit(0);
  }
  if (mode === 'removed') {
    const still = findingsCiting(dispatch, want);
    if (still.length) fail(1, `${dispatch} still cites ${want} (findings ${still.map((n) => '#' + n).join(', ')}) — cannot resolve --mode removed while the citation is present.\n  Two ways forward:\n    • remove the citation from the dispatch, then re-run --mode removed; or\n    • if it was re-verified in place, use --mode regrounded --note "<attestation>".`);
  } else if (mode === 'regrounded' && !f.note) {
    fail(2, '--mode regrounded requires --note <attestation> — the CLI records that the sibling runner re-verified the finding, it does not itself re-verify');
  }
  entry.status = 'resolved';
  entry.resolution = { mode, note: f.note ? String(f.note) : '' };
  body.version += 1;
  body.audit_trail.push({ seq: (body.audit_trail || []).length + 1, event: 'resolve', identifier: want, mode, note: f.note ? String(f.note) : '' });
  const finalized = writeSidecar(dispatch, body);
  process.stdout.write(`Resolved ${want} on ${finalized.dispatch} (mode: ${mode}). Sidecar version ${finalized.version}; withdrawn_sha256 ${finalized.withdrawn_sha256}\n`);
  process.exit(0);
}

function main(argv) {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'protocol': return cmdProtocol();
    case 'new': return cmdNew(rest[0]);
    case 'lint': return cmdLint(rest);
    case 'lock': return cmdLock(rest);
    case 'withdraw': return cmdWithdraw(rest);
    case 'requalify': return cmdRequalify(rest);
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
