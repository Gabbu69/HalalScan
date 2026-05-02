import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['tsx', 'test_ml.ts'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

process.exit(result.status ?? 1);
