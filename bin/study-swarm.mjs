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
  lock <dispatch> --from <orchestration.json>
                           Emit <dispatch>.lock.json — pin (per Step-2 agent) the resolved
                           model + SHA-256 of the byte-exact prompt + SHA-256 of the tool
                           schema, plus the verifier receipt, rolled into one lock_sha256.
  lock --verify <dispatch> [--from <orchestration.json>]
                           Re-derive the deterministic hashes and assert they match the lock;
                           drift exits 1 (gates CI). Without --from, checks lock self-integrity.
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

// --- lock core (dispatch.lock.json — the PIN_PER_STEP feature) ------------------
// Design + research grounding: examples/study-swarm-lock.dispatch.md (choices L1-L11).
// The CLI is a PURE FUNCTION of provided bytes: the orchestration harness emits the record
// (resolved models + byte-exact prompts + tool schemas + verifier receipt); the CLI only
// canonicalizes + hashes + validates it. No network, no model calls (L2).

const LOCK_SCHEMA = 'dispatch.lock/v1';

// Self-describing digest "sha256-<base64>" — the W3C Subresource Integrity form: algorithm-
// prefixed (so it's algorithm-agile) and used fail-closed on mismatch (L9; lock dispatch finding 38).
function sriBytes(buf) { return 'sha256-' + createHash('sha256').update(buf).digest('base64'); }
function sriString(str) { return sriBytes(Buffer.from(str, 'utf8')); }

// RFC 8785 (JCS) canonical JSON, for the structured JSON the CLI assembles ITSELF (the tool
// surface and the lock body): NFC-normalize strings, sort object keys by UTF-16 code unit (JS
// default string sort), no inter-token whitespace, ECMAScript-shortest numbers, UTF-8 (L4).
// The byte-exact PROMPT is deliberately NOT canonicalized — its raw bytes are what the model
// conditioned on, so they are hashed directly (L3; JWS/DSSE hash-known-bytes rule, findings 12/23).
function jcs(value) {
  const ser = (v) => {
    if (v === null) return 'null';
    const t = typeof v;
    if (t === 'boolean') return v ? 'true' : 'false';
    if (t === 'number') {
      if (!Number.isFinite(v)) throw new Error('JCS: non-finite number not allowed');
      return JSON.stringify(v); // ECMAScript Number->String shortest round-trip
    }
    if (t === 'string') return JSON.stringify(v.normalize('NFC'));
    if (Array.isArray(v)) return '[' + v.map(ser).join(',') + ']';
    if (t === 'object') {
      return '{' + Object.keys(v).sort()
        .map((k) => JSON.stringify(k.normalize('NFC')) + ':' + ser(v[k])).join(',') + '}';
    }
    throw new Error(`JCS: unsupported type ${t}`);
  };
  return ser(value);
}
function jcsDigest(value) { return sriBytes(Buffer.from(jcs(value), 'utf8')); }

// The lock sits beside its dispatch: <dir>/<stem>.lock.json (stem strips a trailing .dispatch.md).
function lockPathFor(dispatch) {
  const base = dispatch.split(/[\\/]/).pop().replace(/(\.dispatch)?\.md$/i, '');
  return join(dirname(dispatch), `${base}.lock.json`);
}

// Build the lock object from the dispatch bytes + the harness-emitted orchestration record.
function buildLockObject(dispatchPath, orchestration) {
  const dispatchBytes = readFileSync(dispatchPath);
  const protocolBytes = readFileSync(PROTOCOL_PATH);
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
      prompt_sha256: sriString(String(need('prompt'))),     // L3 — raw bytes, not canonicalized
      tool_schema_sha256: jcsDigest(need('tool_schema')),   // L5 — canonicalized tool surface
    };
    if (s.schema_dialect) rec.schema_dialect = String(s.schema_dialect); // L5 — dialect is contract
    if (s.params && typeof s.params === 'object') rec.params = s.params;
    // L7 — output hash for DRIFT DETECTION only (not determinism). The harness may ship the raw
    // output (the CLI hashes it) OR a pre-computed output_sha256 (large outputs needn't be shipped).
    if (typeof s.output_sha256 === 'string') rec.output_sha256 = s.output_sha256;
    else if (s.output !== undefined) rec.output_sha256 = typeof s.output === 'string' ? sriString(s.output) : jcsDigest(s.output);
    return rec;
  });
  const lock = {
    schema: LOCK_SCHEMA,
    study_swarm_version: VERSION,
    protocol_sha256: sriBytes(protocolBytes),  // pins the methodology version
    dispatch_sha256: sriBytes(dispatchBytes),  // pins the dispatch text
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

// Verify a lock: self-integrity always; source-drift too when an orchestration record is supplied.
// Strict-match, fail-closed (L8): returns a list of problems (empty = clean).
function verifyLockObject(dispatchPath, lockPath, orchestration) {
  let stored;
  try { stored = JSON.parse(readFileSync(lockPath, 'utf8')); }
  catch (err) { fail(2, `cannot read lock ${lockPath}: ${err && err.code ? err.code : err.message}`); }
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

function cmdLock(args) {
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

function main(argv) {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case 'protocol': return cmdProtocol();
    case 'new': return cmdNew(rest[0]);
    case 'lint': return cmdLint(rest);
    case 'lock': return cmdLock(rest);
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
