# 🚀 Almari2 cPanel Deployment Guide

This guide covers deploying your Next.js app to TrueHost cPanel when server memory is insufficient for building.

## 🔧 New Workflow Overview

Due to memory constraints on the server (512MB), we now use a **hybrid deployment approach**:

1. **Build locally** with full memory resources
2. **Upload pre-built files** to server
3. **Deploy source code** via Git (installs dependencies only)
4. **Server runs** the pre-built application

## 📋 Prerequisites

- Node.js 18+ installed locally
- Git repository connected to cPanel
- Access to cPanel File Manager
- PowerShell (Windows) or Terminal access

## 🎯 Quick Start

### Option 1: Automated Script (Recommended)

```powershell
# Build and create deployment package
.\deploy-to-cpanel.ps1

# Or build only (if you want to upload manually)
.\deploy-to-cpanel.ps1 -BuildOnly
```

### Option 2: Manual Process

```powershell
# 1. Build locally
npm run build:production:win

# 2. Create deployment package
node build-for-cpanel.js
```

## 📂 File Changes Made

### `.cpanel.yml` 
- **Before**: Builds on server (runs out of memory)
- **After**: Only installs production dependencies
- **Change**: Removed build step, added `--production` flag

### New Files Added
- `deploy-to-cpanel.ps1` - Main deployment script
- `build-for-cpanel.js` - Local build script (already existed, optimized)
- `DEPLOYMENT-GUIDE.md` - This guide

## 🔄 Step-by-Step Deployment Process

### Step 1: Local Build
```powershell
# Option A: Use the PowerShell script
.\deploy-to-cpanel.ps1

# Option B: Use Node.js script  
node build-for-cpanel.js

# Option C: Use npm script
npm run build:production:win
```

**What happens:**
- Cleans previous builds
- Sets production environment variables
- Builds with optimizations for cPanel
- Creates deployment package

### Step 2: Upload Pre-built Files

1. **Locate the deployment zip** (created by script)
   - Format: `almari2-deploy-YYYY-MM-DD-HHMM.zip`
   
2. **Upload to cPanel File Manager**
   - Go to cPanel → File Manager
   - Navigate to `/home/imsfrkmv/Almari2/`
   - Upload the zip file
   - Extract it in place

3. **Verify upload**
   - Check that `.next` folder exists
   - Ensure all source files are present

### Step 3: Deploy Source Code

```bash
# Push your changes to trigger cPanel deployment
git add .
git commit -m "Deploy with pre-built assets"  
git push origin main
```

**What cPanel does:**
- Syncs source code (excludes `.next` from deletion)
- Installs production dependencies only
- Restarts the Node.js application
- Uses your uploaded `.next` folder

## 🛠️ Configuration Details

### Environment Variables (Local Build)
```bash
NODE_ENV=production
CPANEL_BUILD=true
DISABLE_MINIFICATION=true
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=4096
```

### Package.json Scripts Used
- `build:production:win` - Windows-compatible production build
- `build:production` - Unix-compatible production build  
- `build:local-deploy` - Alias for local deployment script

### Memory Settings
- **Local build**: 4GB RAM allocation
- **Server install**: Only dependency installation (minimal memory)
- **Runtime**: Normal Next.js memory usage

## 📊 File Size Expectations

| Component | Typical Size |
|-----------|--------------|
| `.next` folder | 15-50 MB |
| Deployment zip | 5-20 MB |
| Source code | 2-10 MB |
| `node_modules` | 100-300 MB |

## 🚨 Troubleshooting

### Local Build Issues

**"Out of memory" during local build:**
```powershell
# Increase Node.js memory limit
$env:NODE_OPTIONS = "--max-old-space-size=8192"
npm run build:production:win
```

**TypeScript/ESLint errors:**
- Builds ignore TS/ESLint errors in production
- Check `next.config.js` settings

### Upload Issues

**File too large:**
- Check cPanel file upload limits
- Use File Manager's extract feature
- Consider uploading `.next` folder separately

**Extraction fails:**
- Try extracting on local machine first
- Upload individual folders via FTP
- Use cPanel's built-in extraction tool

### Deployment Issues

**Dependencies not installing:**
```bash
# Check npm path in logs
cat ~/deploy.log

# Manual install if needed (via SSH/Terminal)
cd /home/imsfrkmv/Almari2
npm install --production
```

**Application not starting:**
- Check that `server.js` exists
- Verify Node.js app configuration in cPanel
- Review application logs

## 🔍 Monitoring Deployment

### Check Deployment Logs
```bash
# View recent deployment activity
tail ~/deploy.log

# Monitor application logs  
tail /home/imsfrkmv/Almari2/logs/app.log
```

### Verify Deployment Success
1. **Check files exist:**
   - Source code updated
   - `.next` folder present
   - `node_modules` installed

2. **Test application:**
   - Visit your domain
   - Check key functionality
   - Monitor for errors

## 🎯 Best Practices

### Before Each Deployment
- [ ] Test build locally
- [ ] Verify all changes committed
- [ ] Check deployment zip size
- [ ] Backup current server state (if critical)

### During Development
- [ ] Use `npm run dev` for local development  
- [ ] Only run deployment process for production pushes
- [ ] Keep deployment logs for troubleshooting

### Optimization Tips
- **Code splitting**: Already configured in `next.config.js`
- **Image optimization**: Use Next.js Image component
- **Bundle analysis**: Run `npm run build` locally to see bundle sizes

## 🔄 Updating Your App

### For Code Changes:
1. Make changes locally
2. Test with `npm run dev`
3. Run `.\deploy-to-cpanel.ps1`
4. Upload new deployment zip
5. Git push to update source

### For Dependency Changes:
1. Update `package.json`
2. Run `npm install` locally
3. Run `.\deploy-to-cpanel.ps1`
4. Upload deployment zip
5. Git push (will install new dependencies)

## 📞 Support & Resources

- **TrueHost cPanel Documentation**
- **Next.js Deployment Guide**: https://nextjs.org/docs/deployment
- **Node.js Memory Management**: https://nodejs.org/api/cli.html#--max-old-space-sizesize

---

*This deployment strategy optimizes for memory-constrained shared hosting while maintaining full Next.js functionality.*