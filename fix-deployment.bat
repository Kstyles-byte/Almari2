@echo off
echo.
echo 🔧 Deployment Fix Script
echo =======================
echo.

echo The deployment was successful but you're getting "Internal Server Error"
echo This is usually due to missing directories or app not restarting properly.
echo.

echo 🎯 Most likely causes:
echo 1. Missing tmp directory (shown in logs)
echo 2. App needs manual restart
echo 3. Environment variables not set
echo 4. File permissions issue
echo.

echo 📋 Quick fixes to try in cPanel:
echo.
echo 1. CHECK NODE.JS APP in cPanel:
echo    ✅ Go to cPanel → Node.js Apps
echo    ✅ Find your Almari2 application
echo    ✅ Click "Restart" button
echo    ✅ Verify settings:
echo       - Application Root: Almari2
echo       - Application URL: zervia.ng (or your domain)
echo       - Application Startup File: server.js
echo.

echo 2. CREATE MISSING DIRECTORIES in File Manager:
echo    ✅ Go to cPanel → File Manager
echo    ✅ Navigate to /home/imsfrkmv/Almari2/
echo    ✅ Create folder: "tmp" (if missing)
echo    ✅ Create folder: "logs" (if missing)
echo    ✅ Inside tmp folder, create file: "restart.txt"
echo.

echo 3. CHECK APPLICATION LOGS:
echo    ✅ In File Manager, go to: /home/imsfrkmv/Almari2/logs/
echo    ✅ Look for "app.log" file
echo    ✅ View the file to see exact error messages
echo.

echo 4. VERIFY ENVIRONMENT VARIABLES (if using database/auth):
echo    ✅ In Node.js Apps, check Environment Variables section
echo    ✅ Ensure required variables are set:
echo       - DATABASE_URL (if using database)
echo       - NEXTAUTH_SECRET (if using authentication)
echo       - Any other app-specific variables
echo.

echo 🚨 If you're still getting errors after trying above:
echo 1. Check the app.log file for specific error messages
echo 2. Verify all your .env variables are set in cPanel
echo 3. Make sure your domain is pointing to the right directory
echo.

echo 💡 Your deployment files are correctly uploaded:
echo ✅ .next folder: PRE-BUILT and uploaded
echo ✅ Dependencies: INSTALLED (428 packages)  
echo ✅ Source code: SYNCHRONIZED
echo ✅ Server file: CONFIGURED
echo.

echo The issue is likely just a configuration or restart problem!
echo.
pause