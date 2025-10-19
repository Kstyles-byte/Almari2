#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Ensure we are in the app directory
process.chdir(__dirname);

// Determine port/host (cPanel/Passenger will proxy to this)
const port = process.env.PORT || '3000';
const host = process.env.HOST || '0.0.0.0';

console.log('=================================================');
console.log('Starting Next.js via npm start');
console.log(`CWD: ${__dirname}`);
console.log(`PORT: ${port}`);
console.log(`HOST: ${host}`);
console.log('=================================================');

// Use npm.cmd on Windows when running locally
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const child = spawn(npmCmd, ['start', '--', '-p', port, '-H', host], {
  cwd: __dirname,
  env: { ...process.env, PORT: port, HOST: host },
  stdio: 'inherit'
});

child.on('exit', (code, signal) => {
  console.log(`npm start exited with code ${code}${signal ? `, signal ${signal}` : ''}`);
  process.exit(code ?? 0);
});

process.on('SIGTERM', () => child.kill('SIGTERM'));
process.on('SIGINT', () => child.kill('SIGINT'));
