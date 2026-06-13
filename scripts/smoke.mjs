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
} finally {
  rmSync(work, { recursive: true, force: true });
}

process.exit(ok ? 0 : 1);
