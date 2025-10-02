const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const next = require('next');

// On cPanel, NODE_ENV is often unset. Default to production.
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Determine if we're in development mode
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

// Resolve and log the intended application directory (where this file lives)
const appDir = path.resolve(__dirname);
console.log(`Starting Next.js server in ${dev ? 'development' : 'production'} mode...`);
console.log(`> __dirname: ${__dirname}`);
console.log(`> process.cwd(): ${process.cwd()}`);
console.log(`> Using app dir: ${appDir}`);

// Create the Next.js app, forcing the correct directory so it finds .next
const app = next({ dev, hostname, port, dir: appDir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      
      // Handle the request with Next.js
      await handle(req, res, parsedUrl);
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
