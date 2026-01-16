#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

const child = spawn('node', [nextBin, 'dev', '-p', '7847'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env
});

child.on('error', (err) => {
  console.error('Error al iniciar Next.js:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
