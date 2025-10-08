const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { createRequire } = require('module');

// On cPanel, NODE_ENV is often unset. Default to production.
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}
// Constrain memory usage on shared hosting
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=512';
process.env.NEXT_TELEMETRY_DISABLED = process.env.NEXT_TELEMETRY_DISABLED || '1';

// Resolve and enforce the application directory (where this file lives)
const appDir = path.resolve(__dirname);
try {
  process.chdir(appDir);
} catch (e) {
  console.error('FATAL: Failed to chdir to appDir:', e);
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
    const homeLogs = path.join(os.homedir(), 'logs');
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

// Utility: ensure production build exists
function ensureProductionBuildExists() {
  if (process.env.NODE_ENV === 'production') {
    const buildIdPath = path.join(appDir, '.next', 'BUILD_ID');
    const serverDir = path.join(appDir, '.next', 'server');
    if (!fs.existsSync(buildIdPath) || !fs.existsSync(serverDir)) {
      const msg = 'FATAL: No production build found in .next. Upload your local .next or run next build.';
      console.error(msg);
      throw new Error(msg);
    }
  }
}

// Early check for build to fail fast with clear error
try {
  ensureProductionBuildExists();
} catch (e) {
  // Leave a breadcrumb in both locations
  try { fs.appendFileSync(logFilePath, `${new Date().toISOString()} BUILD CHECK FAILED: ${String(e)}\n`); } catch (_) {}
  console.error('BUILD CHECK FAILED:', e);
  // Re-throw so cPanel logs it too
  throw e;
}

// Check for critical environment variables
function checkEnvironmentVariables() {
  const required = {
    'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
    'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
    'DATABASE_URL': process.env.DATABASE_URL
  };
  
  const missing = [];
  const incorrect = [];
  
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key);
    } else if (key === 'NEXTAUTH_URL' && !value.includes('zervia.ng') && process.env.NODE_ENV === 'production') {
      incorrect.push(`${key} should point to zervia.ng, got: ${value}`);
    }
  }
  
  if (missing.length > 0 || incorrect.length > 0) {
    const errorMsg = [
      missing.length > 0 ? `Missing environment variables: ${missing.join(', ')}` : '',
      incorrect.length > 0 ? `Incorrect environment variables: ${incorrect.join(', ')}` : ''
    ].filter(Boolean).join('; ');
    
    console.error('ENVIRONMENT VARIABLES ERROR:', errorMsg);
    try { fs.appendFileSync(logFilePath, `${new Date().toISOString()} ENV ERROR: ${errorMsg}\n`); } catch (_) {}
    throw new Error(`Environment configuration error: ${errorMsg}`);
  }
}

// Check environment variables
try {
  checkEnvironmentVariables();
  console.log('Environment variables validated successfully');
} catch (e) {
  console.error('FATAL: Environment validation failed:', e.message);
  try { fs.appendFileSync(logFilePath, `${new Date().toISOString()} FATAL ENV ERROR: ${String(e)}\n`); } catch (_) {}
  throw e;
}

// Load the local Next.js from this project explicitly (avoid global nodevenv copy)
// Load Next.js from the app's own node_modules
let next;
try {
  const projectRequire = createRequire(path.join(appDir, 'package.json'));
  next = projectRequire('next');
} catch (err) {
  console.error('FATAL: Failed to load Next.js. Ensure dependencies are installed for this Node version.', err && err.stack ? err.stack : err);
  try { fs.appendFileSync(logFilePath, `${new Date().toISOString()} FATAL next require error: ${String(err)}\n`); } catch (_) {}
  throw err;
}

// Determine if we're in development mode
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

console.log(`Starting Next.js server in ${dev ? 'development' : 'production'} mode...`);
console.log(`> __dirname: ${__dirname}`);
console.log(`> process.cwd(): ${process.cwd()}`);
console.log(`> Using app dir: ${appDir}`);
console.log(`> Log file: ${logFilePath}`);
console.log(`> Node version: ${process.version}`);
console.log(`> NODE_OPTIONS: ${process.env.NODE_OPTIONS || ''}`);

// Create the Next.js app, forcing the correct directory so it finds .next
let app;
try {
  app = next({ dev, hostname, port, dir: appDir });
} catch (e) {
  console.error('FATAL: Failed to initialize Next app.', e && e.stack ? e.stack : e);
  throw e;
}
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const start = Date.now();
      const parsedUrl = parse(req.url, true);
      // Lightweight health endpoint that bypasses Next
      if (parsedUrl.pathname === '/_health') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, ts: Date.now() }));
        return;
      }
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
}).catch((e) => {
  console.error('FATAL: app.prepare() failed.', e && e.stack ? e.stack : e);
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
