# Deployment Guide for cPanel/Shared Hosting

Due to the Rust/SWC compiler issues on shared hosting environments, here are the recommended deployment strategies:

## Option 1: Pre-Build Locally (Recommended)

Since the build works perfectly on your local machine, this is the most reliable approach:

### Steps:

1. **Build locally** (on your Windows machine):
   ```bash
   npm run build
   ```

2. **Create a deployment package**:
   ```bash
   # Create a deployment folder
   mkdir deploy
   
   # Copy essential files
   cp -r .next deploy/
   cp package.json deploy/
   cp -r public deploy/
   cp next.config.js deploy/
   cp -r app deploy/ (if using app directory - which you are)
   cp -r lib deploy/
   cp -r components deploy/
   cp -r actions deploy/
   cp -r middleware.* deploy/ (if exists)
   ```

3. **Upload to cPanel**:
   - Upload the contents of the `deploy` folder to your app directory on cPanel
   - Run `npm install --production` on the server
   - Set your app to production mode in cPanel Node.js settings

4. **Start the application**:
   ```bash
   npm start
   ```

## Option 2: GitHub Actions CI/CD

Set up automated builds using GitHub Actions:

### Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to cPanel

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to cPanel via FTP
      uses: SamKirkland/FTP-Deploy-Action@4.3.0
      with:
        server: your-cpanel-ftp-server
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        local-dir: ./
        exclude: |
          node_modules/**
          .git/**
          .github/**
          **/.DS_Store
```

## Option 3: Try Alternative Build Commands on Server

If you want to attempt building on the server, try these in order:

### 1. Use the custom build script:
```bash
npm run build:cpanel
```

### 2. Use the shell script:
```bash
chmod +x build-no-swc.sh
./build-no-swc.sh
```

### 3. Try with maximum resource constraints:
```bash
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=512" RAYON_NUM_THREADS=1 RUST_BACKTRACE=0 UV_USE_IO_URING=0 NEXT_TELEMETRY_DISABLED=1 npx next build
```

### 4. Build during off-peak hours:
Shared hosting resources are often more available during off-peak hours (typically late night/early morning in the server's timezone).

## Option 4: Alternative Hosting

If the shared hosting continues to have issues, consider:

- **Vercel** (free tier available, made for Next.js)
- **Netlify** (free tier available)
- **Railway** (simple deployment)
- **DigitalOcean App Platform** (affordable)

## Troubleshooting

### Common Issues:

1. **Memory limitations**: Your shared hosting may have memory limits that are too low for Next.js builds
2. **CPU time limits**: Shared hosting often limits CPU time for processes
3. **Rust compiler conflicts**: SWC (the Rust-based compiler) doesn't work well on many shared hosting environments

### Solutions:

1. **Use the pre-build approach** (Option 1) - most reliable
2. **Contact your hosting provider** about resource limits
3. **Build during off-peak hours** when resources are more available
4. **Consider upgrading** to a VPS or dedicated hosting plan

## Files Required for Deployment

Ensure these files are present on your server:

- `.next/` (built application)
- `package.json` (dependencies)
- `public/` (static assets)
- `next.config.js` (configuration)
- Your app files (`app/`, `lib/`, `components/`, `actions/`)
- Environment files (`.env.production`, etc.)

## Environment Variables

Make sure these are set in your cPanel environment:

```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

Plus any application-specific environment variables (database URLs, API keys, etc.).