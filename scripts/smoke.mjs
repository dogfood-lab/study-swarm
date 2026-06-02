// Smoke test for the study-swarm CLI. Exits 0 on pass, 1 on fail.
// Dev-only — not shipped in the npm tarball (excluded by the package.json `files` allowlist).
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync, existsSync } from 'node:fs';

const BIN = 'bin/study-swarm.mjs';
const run = (args, opts = {}) =>
  execFileSync(process.execPath, [BIN, ...args], { encoding: 'utf8', ...opts });

let ok = true;
const check = (name, fn) => {
  try { fn(); console.log(`ok  ${name}`); }
  catch (e) { ok = false; console.error(`ERR ${name}: ${e.message}`); }
};

check('version prints semver', () => {
  const v = run(['version']).trim();
  if (!/^\d+\.\d+\.\d+/.test(v)) throw new Error(`got "${v}"`);
});
check('help prints usage', () => {
  if (!/USAGE/.test(run(['help']))) throw new Error('no USAGE block');
});
check('protocol prints the steps', () => {
  if (!/Step 1/.test(run(['protocol']))) throw new Error('no "Step 1" in output');
});
check('new scaffolds a dispatch', () => {
  rmSync('_smoke.dispatch.md', { force: true });
  run(['new', '_smoke']);
  if (!existsSync('_smoke.dispatch.md')) throw new Error('dispatch not created');
});
check('lint flags the unfilled template (exit 1)', () => {
  let code = 0;
  try { run(['lint', '_smoke.dispatch.md'], { stdio: 'pipe' }); }
  catch (e) { code = e.status; }
  if (code !== 1) throw new Error(`expected exit 1, got ${code}`);
});
check('lint passes a well-sourced dispatch (exit 0)', () => {
  writeFileSync(
    '_smoke_ok.dispatch.md',
    '# d\n\n## Research grounding\n1. **A real finding.** Huang et al. 2023 (arXiv:2310.01798). Implication for the design.\n'
  );
  run(['lint', '_smoke_ok.dispatch.md']); // throws if exit != 0
});

rmSync('_smoke.dispatch.md', { force: true });
rmSync('_smoke_ok.dispatch.md', { force: true });
process.exit(ok ? 0 : 1);
