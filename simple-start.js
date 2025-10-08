#!/usr/bin/env node

/**
 * Ultra-simple diagnostic startup file for cPanel debugging
 * Use this as startup file to identify issues
 */

console.log('=== ALMARI2 DIAGNOSTIC START ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Current directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV || 'undefined');
console.log('Port:', process.env.PORT || 'undefined');

// Check if basic files exist
const fs = require('fs');
const path = require('path');

console.log('\n=== FILE SYSTEM CHECK ===');
const checkFiles = ['.next', 'package.json', 'server.js', 'node_modules'];
checkFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
});

// Check if we can load Next.js
console.log('\n=== DEPENDENCY CHECK ===');
try {
  const next = require('next');
  console.log('Next.js: LOADED');
} catch (err) {
  console.log('Next.js: FAILED -', err.message);
}

try {
  const react = require('react');
  console.log('React: LOADED');
} catch (err) {
  console.log('React: FAILED -', err.message);
}

// Try to create a simple HTTP server
console.log('\n=== SERVER TEST ===');
try {
  const http = require('http');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Almari2 Diagnostic Server - Basic HTTP Working!\n');
  });
  
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Basic HTTP server listening on port ${port}`);
    console.log(`Visit your domain to see this diagnostic message`);
    console.log('\n=== DIAGNOSTIC COMPLETE ===');
  });
  
  server.on('error', (err) => {
    console.error('Server error:', err);
  });
  
} catch (err) {
  console.error('Failed to create basic HTTP server:', err);
}

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');  
  process.exit(0);
});