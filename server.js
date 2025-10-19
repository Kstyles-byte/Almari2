#!/usr/bin/env node

// Next.js production server for cPanel/Passenger (no child processes)
const next = require('next');
const express = require('express');
const path = require('path');
const fs = require('fs');

process.chdir(__dirname);

// Lightweight log to file to aid debugging under Passenger
const logDir = path.join(__dirname, 'logs');
try { fs.mkdirSync(logDir, { recursive: true }); } catch {}
const serverLog = path.join(logDir, 'server.log');
const combinedLog = path.join(logDir, 'combined.log');
const logStream = fs.createWriteStream(serverLog, { flags: 'a' });
const combinedStream = fs.createWriteStream(combinedLog, { flags: 'a' });
// Mirror stdout/stderr into combined.log
const origStdoutWrite = process.stdout.write.bind(process.stdout);
const origStderrWrite = process.stderr.write.bind(process.stderr);
process.stdout.write = (chunk, encoding, cb) => {
  try { combinedStream.write(chunk); } catch {}
  return origStdoutWrite(chunk, encoding, cb);
};
process.stderr.write = (chunk, encoding, cb) => {
  try { combinedStream.write(chunk); } catch {}
  return origStderrWrite(chunk, encoding, cb);
};
function log(...args) {
  const line = `[${new Date().toISOString()}] ` + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + '\n';
  try { logStream.write(line); } catch {}
  console.log(...args);
}
function logErr(err) {
  const msg = err && err.stack ? err.stack : String(err);
  try { logStream.write(`[${new Date().toISOString()}] ERROR ${msg}\n`); } catch {}
  console.error(err);
}
process.on('uncaughtException', logErr);
process.on('unhandledRejection', logErr);

const dev = false; // Always production here
const dir = __dirname;
const app = next({ dev, dir });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app
  .prepare()
  .then(() => {
    const server = express();

    // Optional health check
    server.get('/health', (_req, res) => res.status(200).json({ ok: true }));

    // Simple request logging
    server.use((req, _res, nextFn) => { log(`${req.method} ${req.url}`); nextFn(); });

    // Let Next handle everything else
    server.all('*', (req, res) => {
      try { return handle(req, res); } catch (err) { logErr(err); res.status(500).end('Internal error'); }
    });

    server.listen(port, host, () => {
      log(`Next.js listening on http://${host}:${port} (dir=${dir})`);
    });

    // Export for Passenger
    module.exports = server;
  })
  .catch((err) => {
    logErr('Failed to start Next.js server:');
    logErr(err);
    process.exit(1);
  });
