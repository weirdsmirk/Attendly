/**
 * Cross-platform dependency audit.
 *
 * `npm audit` refuses to run while `npm_config_allow_scripts` is set by a
 * project/user .npmrc, so the variable is stripped from the child process
 * environment. Doing it in Node instead of `env -u …` keeps the script working
 * on Windows shells, where `env` does not exist.
 */
import { spawnSync } from 'node:child_process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const env = { ...process.env }
delete env.npm_config_allow_scripts

const result = spawnSync(npm, ['audit', '--omit=dev', '--ignore-scripts'], {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
