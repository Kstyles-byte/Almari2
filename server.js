// #!/usr/bin/env node

// // Standard Next.js + Express server for cPanel Passenger
// const next = require('next');
// const express = require('express');
// const path = require('path');
// const fs = require('fs');

// const dir = path.resolve(__dirname);

// // Load env from .env files (production shared hosting often doesn't expose them)
// function loadEnv(file) {
//   try {
//     const content = require('fs').readFileSync(file, 'utf8');
//     for (const line of content.split('\n')) {
//       const trimmed = line.trim();
//       if (!trimmed || trimmed.startsWith('#')) continue;
//       const idx = trimmed.indexOf('=');
//       if (idx === -1) continue;
//       const key = trimmed.slice(0, idx).trim();
//       const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
//       if (!process.env[key]) process.env[key] = val;
//     }
//   } catch {}
// }
// loadEnv(path.join(dir, '.env'));
// loadEnv(path.join(dir, '.env.production'));

// const dev = false;
// const app = next({ dir, dev });
// const handle = app.getRequestHandler();

// const PORT = parseInt(process.env.PORT || '3000', 10);
// const HOST = process.env.HOST || '0.0.0.0';

// // Simple file logging so we can see errors when cPanel swallows stdout
// const logDir = path.join(dir, 'logs');
// try { fs.mkdirSync(logDir, { recursive: true }); } catch {}
// const errorsLog = path.join(logDir, 'errors.log');
// const combinedLog = path.join(logDir, 'combined.log');
// function append(file, text) { try { fs.appendFileSync(file, text); } catch {} }
// // Mirror stdout/stderr so Next internal errors get captured
// const origStdout = process.stdout.write.bind(process.stdout);
// const origStderr = process.stderr.write.bind(process.stderr);
// process.stdout.write = (chunk, enc, cb) => { append(combinedLog, chunk instanceof Buffer ? chunk.toString('utf8') : String(chunk)); return origStdout(chunk, enc, cb); };
// process.stderr.write = (chunk, enc, cb) => { const s = chunk instanceof Buffer ? chunk.toString('utf8') : String(chunk); append(errorsLog, s); append(combinedLog, s); return origStderr(chunk, enc, cb); };
// function logError(e) {
//   const msg = e && e.stack ? e.stack : String(e);
//   append(errorsLog, `[${new Date().toISOString()}] ${msg}\n`);
//   console.error(e);
// }
// process.on('unhandledRejection', logError);
// process.on('uncaughtException', logError);

// app
//   .prepare()
//   .then(() => {
//     const server = express();

//     // Health check
//     server.get('/health', (_req, res) => res.status(200).json({ ok: true }));

// // Request log (very light)
//     server.use((req, _res, next) => { append(path.join(logDir,'server.log'), `${new Date().toISOString()} ${req.method} ${req.url}\n`); next(); });

//     // Hand over to Next with error capture
//     server.all('*', (req, res) => {
//       try {
//         const p = handle(req, res);
//         if (p && typeof p.catch === 'function') p.catch(logError);
//         return p;
//       } catch (e) {
//         logError(e);
//         if (!res.headersSent) res.status(500).end('Internal error');
//       }
//     });

//     server.listen(PORT, HOST, () => {
//       console.log('=================================================');
//       console.log(`Next.js ready on http://${HOST}:${PORT}`);
//       console.log(`CWD: ${dir}`);
//       console.log(`NODE_ENV: ${process.env.NODE_ENV || 'production'}`);
//       console.log('=================================================');
//     });

//     // Export for Passenger
//     module.exports = server;
//   })
//   .catch((err) => {
//     logError(err);
//     console.error('Failed to start Next.js server');
//     process.exit(1);
//   });


  
const { createServer } = require('http');
const next = require('next');

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
