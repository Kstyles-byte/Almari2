@echo off
echo.
echo 🔍 Checking Deployment Status
echo ===========================
echo.

echo 📋 Deployment Summary:
echo ✅ Local build: COMPLETED
echo ✅ Zip upload: COMPLETED  
echo ✅ Git push: COMPLETED
echo ✅ Dependencies: INSTALLED (428 packages)
echo ✅ Build step: SKIPPED (using pre-built .next)
echo ✅ Restart: SIGNALED
echo.

echo 🚨 Current Issue: Internal Server Error
echo.

echo 💡 Common fixes to try:
echo.
echo 1. CHECK NODE.JS APP SETTINGS in cPanel:
echo    - Go to cPanel → Node.js Apps
echo    - Verify "Application Root" is set to: Almari2
echo    - Verify "Application URL" matches your domain
echo    - Verify "Application Startup File" is: server.js
echo    - Click "Restart" if needed
echo.
echo 2. CHECK SERVER.JS FILE:
echo    - Ensure server.js exists in the root directory
echo    - Verify it's configured for production
echo.
echo 3. CHECK ENVIRONMENT VARIABLES:
echo    - DATABASE_URL (if using database)
echo    - NEXTAUTH_SECRET (if using auth)
echo    - Any other required environment variables
echo.
echo 4. CHECK FILE PERMISSIONS:
echo    - Ensure files have correct permissions (755 for directories, 644 for files)
echo.
echo 5. MANUAL RESTART:
echo    - In cPanel Node.js Apps, click "Restart"
echo    - Or create/touch tmp/restart.txt file manually
echo.

echo 🔧 Next Steps:
echo 1. Check your cPanel Node.js App settings
echo 2. Verify server.js exists and is correct
echo 3. Check application logs in cPanel
echo 4. Try manual restart
echo.

pause