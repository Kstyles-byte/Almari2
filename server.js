#!/usr/bin/env node

// Next.js production server for cPanel/Passenger (no child processes)
const next = require('next');
const express = require('express');
const path = require('path');

process.chdir(__dirname);

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

    // Let Next handle everything else
    server.all('*', (req, res) => handle(req, res));

    server.listen(port, host, () => {
      console.log(`Next.js listening on http://${host}:${port} (dir=${dir})`);
    });

    // Export for Passenger
    module.exports = server;
  })
  .catch((err) => {
    console.error('Failed to start Next.js server:', err);
    process.exit(1);
  });
