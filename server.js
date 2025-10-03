const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

// On cPanel, NODE_ENV is often unset. Default to production.
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Resolve and enforce the application directory (where this file lives)
const appDir = path.resolve(__dirname);
try {
  process.chdir(appDir);
} catch (e) {
  console.error('Failed to chdir to appDir:', e);
}

// Prepare logging: write all console output to logs/app.log as well
// Prefer app-local logs dir; fallback to user-level logs
let logsDir = path.join(appDir, 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (e) {
  // ignore
}
if (!fs.existsSync(logsDir)) {
  // fallback to ~/logs
  try {
    const homeLogs = path.join(require('os').homedir(), 'logs');
    if (!fs.existsSync(homeLogs)) {
      fs.mkdirSync(homeLogs, { recursive: true });
    }
    logsDir = homeLogs;
  } catch (e) {
    // ignore
  }
}
const logFilePath = path.join(logsDir, 'app.log');
let logStream;
try {
  logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
} catch (e) {
  // ignore stream errors; fallback to console only
}
const originalLog = console.log.bind(console);
const originalError = console.error.bind(console);
function writeLog(prefix, args) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${prefix} ${args.map(String).join(' ')}\n`;
  if (logStream) {
    try { logStream.write(line); } catch (_) {}
  }
  if (prefix === 'ERROR') originalError(line.trim()); else originalLog(line.trim());
}
console.log = (...args) => writeLog('INFO', args);
console.error = (...args) => writeLog('ERROR', args);

// Load the local Next.js from this project explicitly (avoid global nodevenv copy)
const projectRequire = createRequire(path.join(appDir, 'package.json'));
const next = projectRequire('next');

// Determine if we're in development mode
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

console.log(`Starting Next.js server in ${dev ? 'development' : 'production'} mode...`);
console.log(`> __dirname: ${__dirname}`);
console.log(`> process.cwd(): ${process.cwd()}`);
console.log(`> Using app dir: ${appDir}`);
console.log(`> Log file: ${logFilePath}`);

// Create the Next.js app, forcing the correct directory so it finds .next
const app = next({ dev, hostname, port, dir: appDir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const start = Date.now();
      const parsedUrl = parse(req.url, true);
      console.log(`HTTP ${req.method} ${parsedUrl.pathname}`);
      await handle(req, res, parsedUrl);
      const ms = Date.now() - start;
      console.log(`HTTP ${req.method} ${parsedUrl.pathname} -> ${res.statusCode} (${ms}ms)`);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
  .once('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
