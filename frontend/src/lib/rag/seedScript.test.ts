import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SEED = path.resolve(__dirname, '../../../../db/seed.sh');
const hasSh = spawnSync('sh', ['-c', 'echo ok']).status === 0;

// Git-Bash style path so `sh` on Windows can read it; a no-op on Linux/macOS.
const toSh = (p: string) => p.split(path.sep).join('/').replace(/^([A-Za-z]):/, (_m, d: string) => `/${d.toLowerCase()}`);

function run(fakeCypherShell: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seedtest-'));
  fs.writeFileSync(path.join(dir, 'cypher-shell'), fakeCypherShell, { mode: 0o755 });
  return spawnSync('sh', [toSh(SEED)], {
    env: { ...process.env, PATH: `${toSh(dir)}:${process.env.PATH}`, NEO4J_USER: 'u', NEO4J_PASSWORD: 'p' },
    encoding: 'utf8',
  });
}

describe.skipIf(!hasSh)('db/seed.sh', () => {
  it('fails (non-zero) when cypher-shell cannot connect, instead of reporting "skipped"', () => {
    const r = run('#!/bin/sh\necho "Connection refused" >&2\nexit 1\n');
    expect(r.status).not.toBe(0);
    expect(r.stdout).not.toContain('Seed skipped');
  });

  it('skips when loan types already exist', () => {
    const r = run('#!/bin/sh\necho "count(l)"\necho 9\n');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('Seed skipped: 9');
  });
});
