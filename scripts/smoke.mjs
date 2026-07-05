// Smoke test for the study-swarm CLI. Exits 0 on pass, 1 on fail.
// Dev-only — not shipped in the npm tarball (excluded by the package.json `files` allowlist).
// Temp files are created under a throwaway os.tmpdir() directory and removed in `finally`,
// so a failed/interrupted run never leaks scratch files into the working tree.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN = resolve(__dirname, '../bin/study-swarm.mjs');

// Run the CLI. Returns { code, stdout, stderr }; never throws on non-zero exit.
const run = (args, opts = {}) => {
  try {
    const stdout = execFileSync(process.execPath, [BIN, ...args], { encoding: 'utf8', stdio: 'pipe', ...opts });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return { code: e.status ?? 1, stdout: e.stdout?.toString() ?? '', stderr: e.stderr?.toString() ?? '' };
  }
};

let ok = true;
const check = (name, fn) => {
  try { fn(); console.log(`ok  ${name}`); }
  catch (e) { ok = false; console.error(`ERR ${name}: ${e.message}`); }
};
const eq = (got, want, label) => { if (got !== want) throw new Error(`${label}: expected ${want}, got ${got}`); };

const work = mkdtempSync(join(tmpdir(), 'study-swarm-smoke-'));

try {
  // --- basic commands ---
  check('version prints semver', () => {
    const v = run(['version']).stdout.trim();
    if (!/^\d+\.\d+\.\d+/.test(v)) throw new Error(`got "${v}"`);
  });
  check('help prints usage', () => {
    if (!/USAGE/.test(run(['help']).stdout)) throw new Error('no USAGE block');
  });
  check('protocol prints the steps', () => {
    if (!/Step 1/.test(run(['protocol']).stdout)) throw new Error('no "Step 1" in output');
  });

  // --- exit-code 2 contract (usage / runtime errors) ---
  check('unknown command exits 2', () => eq(run(['bogus']).code, 2, 'exit'));
  check('new with no slug exits 2', () => eq(run(['new']).code, 2, 'exit'));
  check('lint with no file exits 2', () => eq(run(['lint']).code, 2, 'exit'));
  check('lint on a missing file exits 2', () => eq(run(['lint', join(work, 'nope.md')]).code, 2, 'exit'));

  // --- `new` scaffolding + safety ---
  check('new scaffolds a dispatch', () => {
    const r = run(['new', 'demo'], { cwd: work });
    eq(r.code, 0, 'exit');
    if (!existsSync(join(work, 'demo.dispatch.md'))) throw new Error('dispatch not created');
  });
  check('new refuses to overwrite (exit 2)', () => {
    const r = run(['new', 'demo'], { cwd: work }); // demo.dispatch.md already exists from prior check
    eq(r.code, 2, 'exit');
    if (!/refusing to overwrite/.test(r.stderr)) throw new Error('wrong message');
  });
  check('new never escapes the working directory (path traversal)', () => {
    const sub = join(work, 'sub');
    mkdirSync(sub, { recursive: true });
    const r = run(['new', '../escape'], { cwd: sub });
    // Either it rejects, or it confines the file to cwd — but it must NOT create ../escape.dispatch.md.
    if (existsSync(join(work, 'escape.dispatch.md'))) throw new Error('escaped to parent directory!');
  });
  check('new rejects a pure-dots slug (exit 2)', () => eq(run(['new', '..'], { cwd: work }).code, 2, 'exit'));
  check('new sanitizes a path-separator slug to a hyphen and confines the file to cwd', () => {
    const d = join(work, 'sanitize'); mkdirSync(d, { recursive: true });
    const r = run(['new', 'a/b'], { cwd: d });
    eq(r.code, 0, 'exit');
    if (!existsSync(join(d, 'a-b.dispatch.md'))) throw new Error('expected a-b.dispatch.md in cwd');
    if (existsSync(join(d, 'a', 'b.dispatch.md'))) throw new Error('created a nested path instead of confining to cwd');
    if (!/slug sanitized to "a-b"/.test(r.stdout)) throw new Error('missing the "slug sanitized to" note');
  });

  // --- lint: the sourcing gate ---
  const lintFile = (name, body) => { const p = join(work, name); writeFileSync(p, body); return p; };

  check('lint flags the unfilled template (exit 1)', () => {
    run(['new', 'tmpl'], { cwd: work });
    eq(run(['lint', join(work, 'tmpl.dispatch.md')]).code, 1, 'exit');
  });
  check('lint passes a well-sourced dispatch (exit 0)', () => {
    const p = lintFile('ok.dispatch.md', '# d\n\n## Research grounding\n1. **A real finding.** Huang et al. 2023 (arXiv:2310.01798). Implication for the design.\n');
    eq(run(['lint', p]).code, 0, 'exit');
  });
  check('lint rejects a "studies show" gesture (exit 1)', () => {
    const p = lintFile('gesture.dispatch.md', '# d\n\n## Research grounding\n1. **Studies show verifiers help.** Kambhampati 2024 (arXiv:2402.01817). Implication.\n');
    const r = run(['lint', p]);
    eq(r.code, 1, 'exit');
    if (!/don't gesture/.test(r.stderr)) throw new Error('banned-phrase message missing');
  });
  check('lint flags a missing "Research grounding" section (exit 1)', () => {
    const p = lintFile('nosection.dispatch.md', '# d\n\n## Some other heading\n1. **A finding.** Huang 2023 (arXiv:2310.01798).\n');
    const r = run(['lint', p]);
    eq(r.code, 1, 'exit');
    if (!/Research grounding/.test(r.stderr)) throw new Error('missing-section message missing');
  });
  check('lint does not accept an arXiv id YYMM prefix as a year (exit 1)', () => {
    // No spelled-out year; arXiv:2011.* must NOT satisfy the year requirement.
    const p = lintFile('noyear.dispatch.md', '# d\n\n## Research grounding\n1. **A finding.** Someone (arXiv:2011.01234). Implication.\n');
    const r = run(['lint', p]);
    eq(r.code, 1, 'exit');
    if (!/missing a year/.test(r.stderr)) throw new Error('expected "missing a year"');
  });
  check('lint is not shadowed by a title that mentions "research grounding" (exit 0)', () => {
    const p = lintFile('shadow.dispatch.md', '# Retry policy: a research grounding exercise\n\n## Research grounding\n1. **A real finding.** Huang et al. 2023 (arXiv:2310.01798). Implication.\n');
    eq(run(['lint', p]).code, 0, 'exit');
  });
  check('lint flags a finding with no author (exit 1)', () => {
    const p = lintFile('noauthor.dispatch.md', '# d\n\n## Research grounding\n1. **A real finding.** 2024 (arXiv:2310.01798). Implication.\n');
    const r = run(['lint', p]);
    eq(r.code, 1, 'exit');
    if (!/missing an author/.test(r.stderr)) throw new Error('expected "missing an author"');
  });
  check('lint accepts a non-ASCII author name (exit 0)', () => {
    const p = lintFile('unicode.dispatch.md', '# d\n\n## Research grounding\n1. **Contrastive explanations help.** Buçinca et al. 2024 (arXiv:2410.04253). Implication.\n');
    eq(run(['lint', p]).code, 0, 'exit');
  });
  check('lint ignores numbered lines inside a code fence (exit 0)', () => {
    const p = lintFile('fence.dispatch.md', '# d\n\n## Research grounding\n1. **A real finding.** Huang et al. 2023 (arXiv:2310.01798). Implication.\n\n```\n1. example output\n2. more output\n```\n');
    eq(run(['lint', p]).code, 0, 'exit');
  });
  // --- new lint capabilities: --json, directories, stdin, the shipped example ---
  check('lint --json on a clean file exits 0 and parses to ok:true', () => {
    const p = lintFile('jsonok.dispatch.md', '# d\n\n## Research grounding\n1. **A finding.** Huang et al. 2023 (arXiv:2310.01798). Implication.\n');
    const r = run(['lint', '--json', p]);
    eq(r.code, 0, 'exit');
    const obj = JSON.parse(r.stdout);
    if (obj.ok !== true || obj.findingCount !== 1) throw new Error('bad json payload');
  });
  check('lint --json on a dirty file exits 1 with stable rule ids', () => {
    const p = lintFile('jsonbad.dispatch.md', '# d\n\n## Research grounding\n1. **A finding.** 2024 (arXiv:2310.01798).\n');
    const r = run(['lint', '--json', p]);
    eq(r.code, 1, 'exit');
    const obj = JSON.parse(r.stdout);
    if (obj.ok !== false) throw new Error('expected ok:false');
    if (!obj.problems.some((x) => x.rule === 'missing-author')) throw new Error('expected a missing-author rule id');
  });
  check('lint a directory of clean dispatches exits 0', () => {
    const d = join(work, 'good-dir'); mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'a.dispatch.md'), '# a\n\n## Research grounding\n1. **F.** Huang et al. 2023 (arXiv:2310.01798). Impl.\n');
    writeFileSync(join(d, 'b.dispatch.md'), '# b\n\n## Research grounding\n1. **G.** Rajan 2025 (arXiv:2511.16708). Impl.\n');
    eq(run(['lint', d]).code, 0, 'exit');
  });
  check('lint a directory with one bad dispatch exits 1', () => {
    const d = join(work, 'mixed-dir'); mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'good.dispatch.md'), '# g\n\n## Research grounding\n1. **F.** Huang et al. 2023 (arXiv:2310.01798). Impl.\n');
    writeFileSync(join(d, 'bad.dispatch.md'), '# b\n\n## Research grounding\n1. **F.** 2024 (arXiv:2310.01798).\n');
    eq(run(['lint', d]).code, 1, 'exit');
  });
  check('lint an empty directory exits 2', () => {
    const d = join(work, 'empty-dir'); mkdirSync(d, { recursive: true });
    const r = run(['lint', d]);
    eq(r.code, 2, 'exit');
    if (!/no \.dispatch\.md/.test(r.stderr)) throw new Error('expected "no .dispatch.md"');
  });
  check('lint reads a clean dispatch from stdin (exit 0)', () => {
    const r = run(['lint', '-'], { input: '# d\n\n## Research grounding\n1. **F.** Huang et al. 2023 (arXiv:2310.01798). Impl.\n' });
    eq(r.code, 0, 'exit');
  });
  check('lint reads a dirty dispatch from stdin (exit 1)', () => {
    const r = run(['lint', '-'], { input: '# d\n\n## Research grounding\n1. **Studies show it.** Foo 2024 (arXiv:2310.01798).\n' });
    eq(r.code, 1, 'exit');
  });
  check('new stamps methodology provenance', () => {
    const r = run(['new', 'prov'], { cwd: work });
    eq(r.code, 0, 'exit');
    const body = readFileSync(join(work, 'prov.dispatch.md'), 'utf8');
    if (!/study-swarm v\d+\.\d+\.\d+ · protocol-sha256:[0-9a-f]{16}/.test(body)) throw new Error('no provenance stamp');
  });
  check('the shipped worked example lints clean (exit 0)', () => {
    const ex = resolve(__dirname, '../examples/study-swarm-self.dispatch.md');
    eq(run(['lint', ex]).code, 0, 'exit');
  });
  check('the worked example satisfies the roleos handoff contract (one id per finding)', () => {
    const ex = resolve(__dirname, '../examples/study-swarm-self.dispatch.md');
    const r = run(['lint', '--json', ex]);
    eq(r.code, 0, 'exit');
    const obj = JSON.parse(r.stdout);
    if (!obj.findings.length) throw new Error('no findings parsed');
    for (const f of obj.findings) if (!f.identifier) throw new Error(`finding ${f.finding} has no resolvable identifier`);
  });
  // ReDoS guard: the AUTHOR regex must be linear-time. A long capitalized/`and`-joined author
  // run with no trailing year is the catastrophic-backtracking input; it must lint (exit 1 for the
  // malformed finding) FAST, not hang the CI-gating command.
  check('lint does not catastrophically backtrack on a long author run (ReDoS guard, exit 1, fast)', () => {
    const many = Array.from({ length: 40 }, () => 'Word').join(' and ');
    const p = lintFile('redos.dispatch.md', `# d\n\n## Research grounding\n1. **A finding** ${many} with no year here.\n`);
    const t0 = Date.now();
    const r = run(['lint', p], { timeout: 8000 });
    const ms = Date.now() - t0;
    eq(r.code, 1, 'exit');
    if (ms > 4000) throw new Error(`lint took ${ms}ms on a long author run — possible catastrophic backtracking`);
  });
  check('lint flags a finding with an author + year but no identifier (missing-id, exit 1)', () => {
    const p = lintFile('noid.dispatch.md', '# d\n\n## Research grounding\n1. **A finding.** Huang et al. 2023. No identifier here.\n');
    const r = run(['lint', '--json', p]);
    eq(r.code, 1, 'exit');
    if (!JSON.parse(r.stdout).problems.some((x) => x.rule === 'missing-id')) throw new Error('expected a missing-id rule id');
  });
  check('lint flags a present-but-empty Research grounding section (no-findings, exit 1)', () => {
    const p = lintFile('emptysection.dispatch.md', '# d\n\n## Research grounding\n\n## Next section\ntext\n');
    const r = run(['lint', p]);
    eq(r.code, 1, 'exit');
    if (!/no numbered findings/.test(r.stderr)) throw new Error('expected "no numbered findings"');
  });
  check('lint accepts a bare RFC number as a resolvable identifier (exit 0)', () => {
    const p = lintFile('rfc.dispatch.md', '# d\n\n## Research grounding\n1. **A finding.** Cooper et al. 2008 (RFC 5280). Implication.\n');
    eq(run(['lint', p]).code, 0, 'exit');
  });
  check('lint does not accept a URL path segment as a year (missing-year, exit 1, year not leaked)', () => {
    const p = lintFile('urlyear.dispatch.md', '# d\n\n## Research grounding\n1. **A finding by Smith and colleagues.** (https://example.org/2019/paper). Implication.\n');
    const r = run(['lint', '--json', p]);
    eq(r.code, 1, 'exit');
    const obj = JSON.parse(r.stdout);
    if (!obj.problems.some((x) => x.rule === 'missing-year')) throw new Error('expected missing-year');
    if (obj.findings[0].year !== null) throw new Error(`URL digits leaked into parsed year: ${obj.findings[0].year}`);
  });
  check('lint --json on multiple files emits the {ok,files} wrapper (exit 1)', () => {
    const a = lintFile('mf-good.dispatch.md', '# a\n\n## Research grounding\n1. **F.** Huang et al. 2023 (arXiv:2310.01798). Impl.\n');
    const b = lintFile('mf-bad.dispatch.md', '# b\n\n## Research grounding\n1. **F.** 2024 (arXiv:2310.01798).\n');
    const r = run(['lint', '--json', a, b]);
    eq(r.code, 1, 'exit');
    const obj = JSON.parse(r.stdout);
    if (obj.ok !== false || !Array.isArray(obj.files) || obj.files.length !== 2) throw new Error('bad multi-file {ok,files} wrapper');
    if (typeof obj.files[0].ok !== 'boolean') throw new Error('per-file ok flag missing');
  });

  // --- lock: dispatch.lock.json (the PIN_PER_STEP feature) ---
  const lockDir = join(work, 'lockdir'); mkdirSync(lockDir, { recursive: true });
  const dPath = join(lockDir, 'demo.dispatch.md');
  const orchPath = join(lockDir, 'demo.orchestration.json');
  const lockJsonPath = join(lockDir, 'demo.lock.json');
  const DISPATCH_TEXT = '# demo dispatch\n\n## Research grounding\n1. **F.** Huang et al. 2023 (arXiv:2310.01798). Impl.\n';
  const baseOrch = () => ({
    steps: [
      { question_id: 'Q1', resolved_model: 'claude-opus-4-8', prompt: 'PROMPT ONE bytes', tool_schema: { type: 'object', properties: { a: { type: 'string' } } }, schema_dialect: 'https://json-schema.org/draft/2020-12/schema', output: 'OUTPUT ONE' },
      { question_id: 'Q2', resolved_model: 'claude-opus-4-8', prompt: 'PROMPT TWO bytes', tool_schema: { type: 'object' } },
    ],
    verification: { runner: 'roleos verify-citations', receipt_id: 'prism-test', receipt_chain_sha256: 'deadbeef' },
  });
  const writeFixtures = (orch) => { writeFileSync(dPath, DISPATCH_TEXT); writeFileSync(orchPath, JSON.stringify(orch)); };
  const buildClean = () => { writeFixtures(baseOrch()); return run(['lock', dPath, '--from', orchPath]); };

  check('lock requires --from to build (exit 2)', () => {
    writeFixtures(baseOrch());
    eq(run(['lock', dPath]).code, 2, 'exit');
  });
  check('lock --from a missing orchestration file exits 2', () => {
    writeFixtures(baseOrch());
    const r = run(['lock', dPath, '--from', join(lockDir, 'nope.json')]);
    eq(r.code, 2, 'exit');
    if (!/orchestration record not found/.test(r.stderr)) throw new Error('wrong message');
  });
  check('lock --from an invalid-JSON orchestration exits 2', () => {
    writeFixtures(baseOrch());
    const bad = join(lockDir, 'bad-orch.json'); writeFileSync(bad, 'not json{');
    const r = run(['lock', dPath, '--from', bad]);
    eq(r.code, 2, 'exit');
    if (!/not valid JSON/.test(r.stderr)) throw new Error('wrong message');
  });
  check('lock builds a lock.json (exit 0) pinning model + prompt + tool-schema + output hashes', () => {
    const r = run(['lock', dPath, '--from', orchPath]);
    eq(r.code, 0, 'exit');
    if (!existsSync(lockJsonPath)) throw new Error('lock.json not created');
    const lock = JSON.parse(readFileSync(lockJsonPath, 'utf8'));
    if (!/^sha256-/.test(lock.lock_sha256)) throw new Error('no lock_sha256');
    if (lock.steps.length !== 2) throw new Error('wrong step count');
    const s = lock.steps[0];
    for (const k of ['prompt_sha256', 'tool_schema_sha256', 'output_sha256']) {
      if (!/^sha256-/.test(s[k])) throw new Error(`step missing ${k}`);
    }
    if (s.resolved_model !== 'claude-opus-4-8') throw new Error('resolved_model not pinned');
  });
  check('lock build is deterministic (same inputs -> same lock_sha256)', () => {
    // Hermetic: build both locks inside this check so `first` never depends on state a prior
    // check happened to leave on disk (a reorder or an intervening fixture edit could stale it).
    buildClean();
    const first = JSON.parse(readFileSync(lockJsonPath, 'utf8')).lock_sha256;
    buildClean();
    const second = JSON.parse(readFileSync(lockJsonPath, 'utf8')).lock_sha256;
    if (first !== second) throw new Error(`nondeterministic: ${first} != ${second}`);
  });
  check('lock --verify passes a clean lock with --from (exit 0)', () => {
    buildClean();
    eq(run(['lock', '--verify', dPath, '--from', orchPath]).code, 0, 'exit');
  });
  check('lock --verify self-integrity passes without --from (exit 0)', () => {
    eq(run(['lock', '--verify', dPath]).code, 0, 'exit');
  });
  // THE drift meta-test — a lock that can't go RED is theater. Each class must fail closed.
  check('lock --verify goes RED when a pinned PROMPT drifts (exit 1)', () => {
    buildClean();
    const o = baseOrch(); o.steps[0].prompt = 'PROMPT ONE bytes!'; // one byte changed
    writeFileSync(orchPath, JSON.stringify(o));
    const r = run(['lock', '--verify', dPath, '--from', orchPath]);
    eq(r.code, 1, 'exit');
    if (!/drift/i.test(r.stderr)) throw new Error('no drift message');
    if (!/prompt_sha256/.test(r.stderr)) throw new Error('did not name prompt_sha256 drift');
  });
  check('lock --verify goes RED when the OUTPUT drifts (exit 1)', () => {
    buildClean();
    const o = baseOrch(); o.steps[0].output = 'OUTPUT ONE changed';
    writeFileSync(orchPath, JSON.stringify(o));
    const r = run(['lock', '--verify', dPath, '--from', orchPath]);
    eq(r.code, 1, 'exit');
    if (!/output_sha256/.test(r.stderr)) throw new Error('did not name output_sha256 drift');
  });
  check('lock --verify goes RED when the resolved MODEL drifts (alias swap, exit 1)', () => {
    buildClean();
    const o = baseOrch(); o.steps[0].resolved_model = 'opus'; // alias instead of resolved id
    writeFileSync(orchPath, JSON.stringify(o));
    eq(run(['lock', '--verify', dPath, '--from', orchPath]).code, 1, 'exit');
  });
  check('lock --verify goes RED when the DISPATCH text drifts (exit 1)', () => {
    buildClean();
    writeFileSync(dPath, DISPATCH_TEXT.replace('demo dispatch', 'demo dispatch EDITED'));
    const r = run(['lock', '--verify', dPath, '--from', orchPath]);
    eq(r.code, 1, 'exit');
    if (!/dispatch_sha256/.test(r.stderr)) throw new Error('did not name dispatch_sha256 drift');
  });
  check('lock --verify goes RED when the LOCK FILE is tampered (self-integrity, exit 1)', () => {
    buildClean();
    const lock = JSON.parse(readFileSync(lockJsonPath, 'utf8'));
    lock.steps[0].prompt_sha256 = 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='; // forge a hash, leave lock_sha256
    writeFileSync(lockJsonPath, JSON.stringify(lock, null, 2));
    const r = run(['lock', '--verify', dPath]); // no --from -> pure self-integrity
    eq(r.code, 1, 'exit');
    if (!/lock_sha256 mismatch/.test(r.stderr)) throw new Error('did not catch the lock-file tamper');
  });
  check('lock --verify with no lock present exits 2 (usage)', () => {
    const empty = join(work, 'nolockdir'); mkdirSync(empty, { recursive: true });
    const d2 = join(empty, 'x.dispatch.md'); writeFileSync(d2, DISPATCH_TEXT);
    eq(run(['lock', '--verify', d2]).code, 2, 'exit');
  });
  check('lock --verify is line-ending invariant (CRLF dispatch verifies an LF-built lock)', () => {
    buildClean();                                          // LF fixtures -> lock built from LF
    writeFileSync(dPath, readFileSync(dPath, 'utf8').replace(/\n/g, '\r\n')); // same content, CRLF
    eq(run(['lock', '--verify', dPath, '--from', orchPath]).code, 0, 'exit'); // must STILL pass
  });
  check('lock prompt hashing is newline-normalized (CRLF prompt hashes == LF prompt)', () => {
    writeFileSync(dPath, DISPATCH_TEXT);
    const lf = baseOrch(); lf.steps[0].prompt = 'line A\nline B';
    writeFileSync(orchPath, JSON.stringify(lf)); run(['lock', dPath, '--from', orchPath]);
    const lfHash = JSON.parse(readFileSync(lockJsonPath, 'utf8')).steps[0].prompt_sha256;
    const crlf = baseOrch(); crlf.steps[0].prompt = 'line A\r\nline B';
    writeFileSync(orchPath, JSON.stringify(crlf)); run(['lock', dPath, '--from', orchPath]);
    const crlfHash = JSON.parse(readFileSync(lockJsonPath, 'utf8')).steps[0].prompt_sha256;
    if (lfHash !== crlfHash) throw new Error(`prompt hash not newline-invariant: ${lfHash} != ${crlfHash}`);
  });
  check('the shipped example lock verifies clean against its orchestration (exit 0)', () => {
    const exD = resolve(__dirname, '../examples/study-swarm-lock.dispatch.md');
    const exO = resolve(__dirname, '../examples/study-swarm-lock.orchestration.json');
    eq(run(['lock', '--verify', exD, '--from', exO]).code, 0, 'exit');
  });

  // --- canon-rollback: the requalify_dependent_slices compensator ---
  // Helpers: a dispatch citing a given identifier, and JSON readers for the sidecar/receipt.
  const GROUND = (id) => `## Research grounding\n1. **A finding.** Zhu et al. 2024 (${id}). Implication.\n`;
  const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
  const FIND_ID = 'arXiv:2402.15089'; // a real id; matched case- and form-insensitively (normIdent)

  check('withdraw requires --reason (exit 2)', () => {
    const d = join(work, 'wd1'); mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'a.dispatch.md'), '# a\n\n' + GROUND(FIND_ID));
    eq(run(['withdraw', FIND_ID, '--from', d]).code, 2, 'exit');
  });
  check('withdraw rejects an off-enum --reason (exit 2)', () => {
    const d = join(work, 'wd2'); mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'a.dispatch.md'), '# a\n\n' + GROUND(FIND_ID));
    eq(run(['withdraw', FIND_ID, '--reason', 'bogus', '--from', d]).code, 2, 'exit');
  });
  check('withdraw on an id no dispatch cites (exit 2)', () => {
    const d = join(work, 'wd3'); mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'a.dispatch.md'), '# a\n\n' + GROUND('arXiv:2310.01798'));
    eq(run(['withdraw', FIND_ID, '--reason', 'retracted', '--from', d]).code, 2, 'exit');
  });

  // THE ROLLBACK META-TEST — a compensator that can't flag + gate is theater. Two dispatches cite
  // the SAME id (in DIFFERENT citation forms): withdraw flags BOTH and check goes RED; re-ground one
  // and it goes GREEN while the other stays RED. (testing-os "prove the gate goes red", for rollback.)
  check('ROLLBACK META-TEST: withdraw flags every dependent, check goes RED, re-ground one -> GREEN while the other stays RED', () => {
    const c = join(work, 'rollback'); mkdirSync(c, { recursive: true });
    // alpha cites the bare arXiv id; beta cites the arxiv.org URL form (+version) — normIdent unifies them.
    writeFileSync(join(c, 'alpha.dispatch.md'), '# alpha\n\n## Research grounding\n1. **A.** Huang et al. 2023 (arXiv:2310.01798). Impl.\n2. **Shared.** Zhu et al. 2024 (arXiv:2402.15089). Impl.\n');
    writeFileSync(join(c, 'beta.dispatch.md'), '# beta\n\n## Research grounding\n1. **Shared via URL form.** Zhu et al. 2024 (https://arxiv.org/abs/2402.15089v2). Impl.\n');
    // 1) withdraw flags BOTH (cross-form match) and emits a receipt naming both dependents.
    const rcp = join(c, 'receipt.json');
    const w = run(['withdraw', FIND_ID, '--reason', 'misattributed', '--detail', 'Fang -> Zhu', '--from', c, '--receipt', rcp]);
    eq(w.code, 0, 'withdraw exit');
    if (!/you may have relied/i.test(w.stdout) || !/re-ground or override/i.test(w.stdout)) throw new Error('withdraw output is not contrastive');
    if (!existsSync(join(c, 'alpha.withdrawn.json')) || !existsSync(join(c, 'beta.withdrawn.json'))) throw new Error('both sidecars not written');
    const receipt = readJson(rcp);
    if (receipt.dependents.length !== 2) throw new Error(`receipt should name 2 dependents, got ${receipt.dependents.length}`);
    if (!/^sha256-/.test(receipt.receipt_sha256)) throw new Error('receipt not content-addressed');
    // 2) the gate is RED for the whole corpus (2 unresolved).
    eq(run(['requalify', '--check', c]).code, 1, 'check RED with 2 unresolved');
    // 3) re-ground alpha by REMOVING the finding, then resolve --mode removed.
    writeFileSync(join(c, 'alpha.dispatch.md'), '# alpha\n\n## Research grounding\n1. **A.** Huang et al. 2023 (arXiv:2310.01798). Impl.\n');
    eq(run(['requalify', '--resolve', join(c, 'alpha.dispatch.md'), FIND_ID, '--mode', 'removed']).code, 0, 'resolve removed exit');
    // 4) alpha is now GREEN; the corpus is still RED because beta is unresolved.
    eq(run(['requalify', '--check', join(c, 'alpha.withdrawn.json')]).code, 0, 'alpha GREEN');
    const corpusCheck = run(['requalify', '--check', c]);
    eq(corpusCheck.code, 1, 'corpus still RED (beta unresolved)');
    if (!/beta\.dispatch\.md/.test(corpusCheck.stderr)) throw new Error('RED check should still name beta');
    if (/alpha\.dispatch\.md/.test(corpusCheck.stderr)) throw new Error('alpha should no longer be flagged');
    // post-state assertions on the sidecars themselves
    const a = readJson(join(c, 'alpha.withdrawn.json'));
    const b = readJson(join(c, 'beta.withdrawn.json'));
    if (a.withdrawals[0].status !== 'resolved' || a.withdrawals[0].resolution.mode !== 'removed') throw new Error('alpha not resolved/removed');
    if (b.withdrawals[0].status !== 'withdrawn') throw new Error('beta should still be withdrawn');
  });

  check('resolve --mode removed FAILS while the finding is still present (fail-closed, exit 1)', () => {
    const c = join(work, 'res-guard'); mkdirSync(c, { recursive: true });
    writeFileSync(join(c, 'a.dispatch.md'), '# a\n\n' + GROUND(FIND_ID));
    run(['withdraw', FIND_ID, '--reason', 'retracted', '--from', c]);
    eq(run(['requalify', '--resolve', join(c, 'a.dispatch.md'), FIND_ID, '--mode', 'removed']).code, 1, 'exit');
  });
  check('resolve --mode regrounded requires --note (exit 2), succeeds with one (exit 0)', () => {
    const c = join(work, 're-ground'); mkdirSync(c, { recursive: true });
    writeFileSync(join(c, 'a.dispatch.md'), '# a\n\n' + GROUND(FIND_ID));
    run(['withdraw', FIND_ID, '--reason', 'misattributed', '--from', c]);
    eq(run(['requalify', '--resolve', join(c, 'a.dispatch.md'), FIND_ID, '--mode', 'regrounded']).code, 2, 'no --note exit');
    eq(run(['requalify', '--resolve', join(c, 'a.dispatch.md'), FIND_ID, '--mode', 'regrounded', '--note', 'prism receipt X, re-verified clean']).code, 0, 'with --note exit');
  });
  check('resolve is idempotent (re-running is a no-op, version unchanged, exit 0)', () => {
    const c = join(work, 'idem'); mkdirSync(c, { recursive: true });
    writeFileSync(join(c, 'a.dispatch.md'), '# a\n\n' + GROUND('arXiv:2310.01798'));
    run(['withdraw', 'arXiv:2310.01798', '--reason', 'fabricated', '--from', c]);
    // remove and resolve
    writeFileSync(join(c, 'a.dispatch.md'), '# a\n\n## Research grounding\n1. **Other.** Rajan 2025 (arXiv:2511.16708). Impl.\n');
    eq(run(['requalify', '--resolve', join(c, 'a.dispatch.md'), 'arXiv:2310.01798', '--mode', 'removed']).code, 0, 'first resolve');
    const v1 = readJson(join(c, 'a.withdrawn.json')).version;
    eq(run(['requalify', '--resolve', join(c, 'a.dispatch.md'), 'arXiv:2310.01798', '--mode', 'removed']).code, 0, 'second resolve (no-op)');
    const v2 = readJson(join(c, 'a.withdrawn.json')).version;
    if (v1 !== v2) throw new Error(`idempotent resolve bumped version: ${v1} -> ${v2}`);
  });
  check('withdraw is deterministic + idempotent (same inputs -> same receipt_sha256)', () => {
    const c = join(work, 'det'); mkdirSync(c, { recursive: true });
    writeFileSync(join(c, 'a.dispatch.md'), '# a\n\n' + GROUND(FIND_ID));
    const h1 = JSON.parse(run(['withdraw', FIND_ID, '--reason', 'retracted', '--from', c, '--json']).stdout).receipt_sha256;
    const h2 = JSON.parse(run(['withdraw', FIND_ID, '--reason', 'retracted', '--from', c, '--json']).stdout).receipt_sha256;
    if (h1 !== h2) throw new Error(`nondeterministic receipt: ${h1} != ${h2}`);
  });
  check('requalify --check catches a hand-edited sidecar (self-integrity, RED)', () => {
    const c = join(work, 'tamper'); mkdirSync(c, { recursive: true });
    writeFileSync(join(c, 'a.dispatch.md'), '# a\n\n' + GROUND(FIND_ID));
    run(['withdraw', FIND_ID, '--reason', 'retracted', '--from', c]);
    const p = join(c, 'a.withdrawn.json');
    const o = readJson(p); o.withdrawals[0].status = 'resolved'; // forge a clear, leave the hash stale
    writeFileSync(p, JSON.stringify(o, null, 2));
    const r = run(['requalify', '--check', c]);
    eq(r.code, 1, 'exit');
    if (!/self-integrity/.test(r.stderr)) throw new Error('did not catch the sidecar tamper');
  });
  check('withdraw is line-ending invariant (CRLF dispatch -> same receipt_sha256 as LF)', () => {
    const body = '# a\n\n' + GROUND(FIND_ID);
    const lf = join(work, 'lf'); mkdirSync(join(lf, 'c'), { recursive: true });
    writeFileSync(join(lf, 'c', 'a.dispatch.md'), body);
    const hLf = JSON.parse(run(['withdraw', FIND_ID, '--reason', 'retracted', '--from', join(lf, 'c'), '--json']).stdout).receipt_sha256;
    const crlf = join(work, 'crlf'); mkdirSync(join(crlf, 'c'), { recursive: true });
    writeFileSync(join(crlf, 'c', 'a.dispatch.md'), body.replace(/\n/g, '\r\n')); // same content, CRLF
    const hCrlf = JSON.parse(run(['withdraw', FIND_ID, '--reason', 'retracted', '--from', join(crlf, 'c'), '--json']).stdout).receipt_sha256;
    if (hLf !== hCrlf) throw new Error(`receipt not line-ending invariant: ${hLf} != ${hCrlf}`);
  });
  // DECOMPOSE_BY_SECRETS boundary: the compensator works the VOLATILE evidence layer; the STABLE
  // lock is untouched. A withdraw + resolve must NOT disturb `lock --verify`.
  check('DECOMPOSE boundary: lock --verify is unaffected by withdraw + resolve', () => {
    const c = join(work, 'decomp'); mkdirSync(c, { recursive: true });
    const dp = join(c, 'a.dispatch.md');
    writeFileSync(dp, '# a\n\n' + GROUND(FIND_ID));
    const op = join(c, 'a.orchestration.json');
    writeFileSync(op, JSON.stringify({
      steps: [{ question_id: 'Q1', resolved_model: 'claude-opus-4-8', prompt: 'P', tool_schema: { type: 'object' } }],
    }));
    eq(run(['lock', dp, '--from', op]).code, 0, 'build lock');
    eq(run(['lock', '--verify', dp, '--from', op]).code, 0, 'lock verifies before withdraw');
    eq(run(['withdraw', FIND_ID, '--reason', 'misattributed', '--from', c]).code, 0, 'withdraw');
    eq(run(['lock', '--verify', dp, '--from', op]).code, 0, 'lock STILL verifies after withdraw (stable layer untouched)');
    eq(run(['requalify', '--resolve', dp, FIND_ID, '--mode', 'regrounded', '--note', 're-verified']).code, 0, 'resolve');
    eq(run(['lock', '--verify', dp, '--from', op]).code, 0, 'lock STILL verifies after resolve');
  });
  check('the shipped canon-rollback example lints clean (exit 0)', () => {
    eq(run(['lint', resolve(__dirname, '../examples/study-swarm-canon-rollback.dispatch.md')]).code, 0, 'exit');
  });
  check('the shipped canon-rollback example lock verifies clean (exit 0)', () => {
    const exD = resolve(__dirname, '../examples/study-swarm-canon-rollback.dispatch.md');
    const exO = resolve(__dirname, '../examples/study-swarm-canon-rollback.orchestration.json');
    eq(run(['lock', '--verify', exD, '--from', exO]).code, 0, 'exit');
  });
  check('requalify --resolve on an identifier with no flag exits 2', () => {
    const c = join(work, 'req-noflag'); mkdirSync(c, { recursive: true });
    writeFileSync(join(c, 'a.dispatch.md'), '# a\n\n' + GROUND(FIND_ID));
    run(['withdraw', FIND_ID, '--reason', 'retracted', '--from', c]);
    const r = run(['requalify', '--resolve', join(c, 'a.dispatch.md'), 'arXiv:1111.22222', '--mode', 'removed']);
    eq(r.code, 2, 'exit');
    if (!/no evidence-withdrawn flag/.test(r.stderr)) throw new Error('wrong message');
  });
  check('requalify --check on a single unresolved sidecar FILE exits 1 (single-file RED path)', () => {
    const c = join(work, 'req-single'); mkdirSync(c, { recursive: true });
    writeFileSync(join(c, 'a.dispatch.md'), '# a\n\n' + GROUND(FIND_ID));
    run(['withdraw', FIND_ID, '--reason', 'retracted', '--from', c]);
    eq(run(['requalify', '--check', join(c, 'a.withdrawn.json')]).code, 1, 'single-file RED');
  });
  check('requalify --check with no corpus arg exits 2', () => eq(run(['requalify', '--check']).code, 2, 'exit'));
  check('requalify --check on a nonexistent corpus exits 2', () => eq(run(['requalify', '--check', join(work, 'no-such-dir')]).code, 2, 'exit'));
  // Guards the idempotency fix: an identical re-withdraw after the citation MOVED to a different
  // finding number must refresh the stored numbers, not be skipped as a stale no-op.
  check('re-withdraw after a citation moved refreshes the finding numbers', () => {
    const c = join(work, 'moved'); mkdirSync(c, { recursive: true });
    const dp = join(c, 'a.dispatch.md');
    writeFileSync(dp, '# a\n\n## Research grounding\n1. **First.** Huang et al. 2023 (arXiv:2310.01798). Impl.\n2. **Shared.** Zhu et al. 2024 (' + FIND_ID + '). Impl.\n');
    run(['withdraw', FIND_ID, '--reason', 'retracted', '--from', c]);
    if (JSON.stringify(readJson(join(c, 'a.withdrawn.json')).withdrawals[0].findings) !== '[2]') throw new Error('expected finding #2 initially');
    writeFileSync(dp, '# a\n\n## Research grounding\n1. **Shared.** Zhu et al. 2024 (' + FIND_ID + '). Impl.\n'); // citation now #1
    run(['withdraw', FIND_ID, '--reason', 'retracted', '--from', c]); // same id+reason+detail, moved position
    const got = JSON.stringify(readJson(join(c, 'a.withdrawn.json')).withdrawals[0].findings);
    if (got !== '[1]') throw new Error(`stale finding numbers not refreshed: ${got}`);
  });
  check('withdraw --json emits the full receipt shape (schema, reason, dependents)', () => {
    const c = join(work, 'wd-shape'); mkdirSync(c, { recursive: true });
    writeFileSync(join(c, 'a.dispatch.md'), '# a\n\n' + GROUND(FIND_ID));
    const obj = JSON.parse(run(['withdraw', FIND_ID, '--reason', 'retracted', '--from', c, '--json']).stdout);
    if (obj.schema !== 'withdrawal-receipt/v1') throw new Error('bad schema');
    if (obj.reason !== 'retracted') throw new Error('reason field missing');
    if (!Array.isArray(obj.dependents) || obj.dependents.length !== 1) throw new Error('dependents wrong');
    if (!obj.dependents[0].dispatch || !Array.isArray(obj.dependents[0].findings)) throw new Error('dependent shape wrong');
  });
} finally {
  rmSync(work, { recursive: true, force: true });
}

process.exit(ok ? 0 : 1);
