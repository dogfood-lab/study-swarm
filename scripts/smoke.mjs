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
} finally {
  rmSync(work, { recursive: true, force: true });
}

process.exit(ok ? 0 : 1);
