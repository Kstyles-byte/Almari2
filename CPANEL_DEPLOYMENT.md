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

### 2. Automatic Updates

Once setup is complete, your workflow is simple:

1. **Make changes locally** (as usual)
2. **Push to GitHub** (as usual)
3. **cPanel automatically**:
   - Pulls latest code from GitHub
   - Runs `npm ci` (installs dependencies)
   - Runs `npm run build` (builds production version)
   - Restarts the application

## 🔧 How It Works

### Custom Server (`server.js`)
- Replaces the default `next start` command
- Required by cPanel's Node.js application manager
- Handles all incoming requests and serves your Next.js app

### Automated Deployment (`cpanel.yml`)
- Automatically executed when Git pulls new code
- Installs dependencies and builds the application
- Sets proper file permissions

### Scripts (`package.json`)
- **`npm start`** - Now runs `node server.js` (for cPanel)
- **`npm run start:next`** - Original Next.js start command (backup)
- **`npm run build`** - Builds production version

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

## 🚫 Troubleshooting

### Application Won't Start
- Check Node.js version compatibility (need 18+)
- Verify `server.js` is in the root directory
- Check application startup file is set to `server.js`

### Environment Variables
- Ensure all required environment variables are set in cPanel
- Double-check Supabase URLs and keys are correct

### Build Errors
- Check the application logs in cPanel
- Ensure all dependencies are compatible with your Node.js version

## 📞 Support

If you encounter issues:
1. Check cPanel error logs
2. Contact your hosting provider about Node.js support
3. Verify all environment variables are set correctly
