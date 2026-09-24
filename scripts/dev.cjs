/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require('node:child_process');
const args = ['next', 'dev', ...process.argv.slice(2)];
const child = spawn('npx', args, { stdio: ['inherit', 'pipe', 'pipe'] });
function filter(chunk, isStderr) {
  const text = chunk.toString();
  const lines = text.split('\n');
  const kept = lines.filter(l => !l.includes('- Network:')).join('\n');
  if (kept.trim() === '' && text.includes('- Network:')) return;
  (isStderr ? process.stderr : process.stdout).write(kept);
}
child.stdout.on('data', d => filter(d, false));
child.stderr.on('data', d => filter(d, true));
child.on('close', c => process.exit(c ?? 0));
