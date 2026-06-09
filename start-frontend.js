const { spawn } = require('child_process');
const path = require('path');

const vite = spawn(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'dev'],
  {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true,
  }
);

vite.on('error', err => { console.error('Frontend error:', err); process.exit(1); });
vite.on('exit', code => process.exit(code ?? 0));
