# cPanel Node.js Deployment Guide

This project is now configured for deployment on cPanel hosting with Node.js support.

## Files Created/Modified

### 🆕 New Files
- **`server.js`** - Custom Node.js server for cPanel deployment
- **`CPANEL_DEPLOYMENT.md`** - This deployment guide

### ✏️ Modified Files
- **`cpanel.yml`** - Automated deployment configuration
- **`package.json`** - Updated start script to use custom server
- **`next.config.js`** - Optimized for Node.js deployment

## 🚀 Deployment Steps

### 1. Initial Setup in cPanel

1. **Setup Node.js App**:
   - Go to cPanel → "Setup Node.js App"
   - Node.js Version: 18 or higher
   - Application Mode: Production
   - Application Root: `/home/yourusername/yourproject`
   - Application Startup File: `server.js`

2. **Connect Git Repository**:
   - Go to cPanel → "Git Version Control"
   - Create repository pointing to your application directory
   - Clone from your GitHub repository
   - Enable "Pull on deploy"

3. **Install Dependencies**:
   - In cPanel Node.js app interface, click "Run NPM Install"
   - Or via terminal: `cd /home/yourusername/yourproject && npm install`

4. **Start Application**:
   - In cPanel Node.js app interface, click "Start App"

### 2. Fully Automated Updates ✨

Once setup is complete, your workflow is **completely automated**:

1. **Make changes locally** (as usual)
2. **Push to GitHub** (as usual)
3. **cPanel automatically does EVERYTHING**:
   - 🔄 Pulls latest code from GitHub
   - 📁 Copies all files to the Node.js app directory
   - 📦 Runs `npm ci` (installs/updates dependencies)
   - 🔨 Runs `npm run build:safe` (builds production version with optimizations)
   - 🧹 Cleans up development dependencies
   - ✅ Verifies the build was successful
   - 🔄 **You just need to restart the app in cPanel (one click!)**

**No more manual uploads! No more .next folder management!**

## 🔧 How It Works

### Custom Server (`server.js`)
- Replaces the default `next start` command
- Required by cPanel's Node.js application manager
- Handles all incoming requests and serves your Next.js app

### Automated Deployment (`.cpanel.yml`) 🤖
- **Automatically executed** when Git pulls new code
- **Copies all source files** to the Node.js app directory
- **Installs dependencies** using `npm ci` for faster, reliable installs
- **Builds the application** with optimizations for shared hosting
- **Cleans up** development dependencies to save space
- **Verifies build success** and creates the `.next` folder
- **Sets proper file permissions** for security

### Scripts (`package.json`) 📜
- **`npm start`** - Runs `node server.js` (production server for cPanel)
- **`npm run build:safe`** - Optimized build for shared hosting (used by deployment)
- **`npm run build:production`** - Standard production build
- **`npm run build:optimized`** - Memory-optimized build for resource-constrained environments
- **`npm run start:production`** - Production server with NODE_ENV set
- **`npm run clean`** - Cleans build cache and .next folder

## 🌐 Environment Variables

Make sure to set your environment variables in cPanel:
1. Go to your Node.js app in cPanel
2. Click on "Environment Variables"
3. Add your variables:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_SUPABASE_URL=your_supabase_url`
   - `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`
   - Any other environment variables your app needs

## ✅ What This Setup Preserves

- ✅ **Server Actions** - All your `'use server'` functions work
- ✅ **API Routes** - All `/api/*` endpoints work
- ✅ **Database Operations** - Supabase calls work normally
- ✅ **Authentication** - NextAuth/Supabase auth works
- ✅ **File Uploads** - Image uploads and processing work
- ✅ **Real-time Features** - All dynamic features preserved

## 😫 Troubleshooting

### 🚨 "npm: command not found" During Deployment
**This is the most common issue!** If you see this error in your Git deployment logs:

1. **Check your Node.js app setup**:
   - Go to cPanel → "Setup Node.js App"
   - Ensure your app is created and running
   - Note the Node.js version (18, 20, or 22)

2. **Use the manual deployment script**:
   - Go to cPanel → "Terminal"
   - Navigate to your app: `cd /home/imsfrkmv/Almari2`
   - Run: `bash manual-deploy.sh`
   - This will show you exactly where Node.js is installed

3. **Alternative - Build directly in cPanel**:
   - Go to your Node.js app interface
   - Click "Run NPM Install" 
   - Then click "Run NPM Build" (or use custom command: `npm run build:safe`)

### Application Won't Start
- Check Node.js version compatibility (need 18+)
- Verify `server.js` is in the root directory
- Check application startup file is set to `server.js`
- Restart the app after any changes

### Environment Variables
- Ensure all required environment variables are set in cPanel
- Double-check Supabase URLs and keys are correct
- Use the `CPANEL_ENV_SETUP.md` checklist

### Build Errors
- Check the application logs in cPanel
- Ensure all dependencies are compatible with your Node.js version
- Try `npm run build:optimized` for memory-constrained environments
- Use Terminal to run `bash cpanel-deploy.sh` manually

## 📞 Support

If you encounter issues:
1. Check cPanel error logs
2. Contact your hosting provider about Node.js support
3. Verify all environment variables are set correctly
