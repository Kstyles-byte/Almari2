#!/usr/bin/env node

// Simple Next.js starter for cPanel - just runs 'next start'
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    }
  }
}

// Change to app directory
const appDir = path.resolve(__dirname);
process.chdir(appDir);

// Load environment variables
const envPath = path.join(appDir, '.env');
loadEnvFile(envPath);

// Set defaults
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=512';
process.env.NEXT_TELEMETRY_DISABLED = process.env.NEXT_TELEMETRY_DISABLED || '1';

console.log('Starting Next.js via next start...');
console.log(`Node version: ${process.version}`);
console.log(`Working directory: ${appDir}`);
console.log(`Environment: ${process.env.NODE_ENV}`);

// Find the next binary
const nextBin = path.join(appDir, 'node_modules', '.bin', 'next');

// Start Next.js using spawn
const child = spawn(nextBin, ['start'], {
  cwd: appDir,
  env: process.env,
  stdio: 'inherit' // Pass through stdout/stderr
});

child.on('error', (error) => {
  console.error('Failed to start Next.js:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`Next.js exited with code ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  child.kill('SIGINT');
});
