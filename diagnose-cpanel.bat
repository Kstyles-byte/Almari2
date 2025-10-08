@echo off
echo.
echo 🔍 cPanel Node.js Diagnostic Guide
echo ================================
echo.

echo 🚨 Your app is failing to start before any logging occurs.
echo This suggests a fundamental Node.js or cPanel configuration issue.
echo.

echo 📋 Step-by-step troubleshooting:
echo.

echo 1. VERIFY CPANEL NODE.JS APP SETTINGS:
echo    ✅ Go to cPanel → Node.js Apps
echo    ✅ Check Application Root: should be "Almari2"
echo    ✅ Check Application URL: should match your domain
echo    ✅ Check Node.js Version: should be 18.x or 20.x
echo    ✅ Check Application Startup File: try these options:
echo       - server.js (current)
echo       - app.js (alternative)
echo       - simple-start.js (for diagnosis)
echo.

echo 2. TRY DIAGNOSTIC STARTUP FILE:
echo    ✅ In cPanel Node.js Apps, change startup file to: simple-start.js
echo    ✅ Click "Restart"
echo    ✅ Visit your website
echo    ✅ If you see "Almari2 Diagnostic Server - Basic HTTP Working!" then:
echo       - Node.js is working
echo       - The issue is with Next.js or your main application
echo    ✅ If you still get Internal Server Error:
echo       - The issue is with cPanel Node.js configuration
echo.

echo 3. CHECK ENVIRONMENT VARIABLES:
echo    ✅ In cPanel Node.js Apps → Environment Variables
echo    ✅ Make sure these are set:
echo       - NODE_ENV=production
echo       - PORT=(should be auto-set by cPanel)
echo    ✅ Optional but recommended:
echo       - NEXTAUTH_URL=https://zervia.ng
echo       - DATABASE_URL=(your database connection)
echo.

echo 4. CHECK FILE PERMISSIONS:
echo    ✅ In cPanel File Manager
echo    ✅ Go to /home/imsfrkmv/Almari2/
echo    ✅ Right-click on folders → Change Permissions → 755
echo    ✅ Right-click on files → Change Permissions → 644
echo    ✅ Make sure server.js and simple-start.js are executable
echo.

echo 5. CHECK LOGS IN DIFFERENT LOCATIONS:
echo    ✅ cPanel → Node.js Apps → View Logs
echo    ✅ cPanel → Error Logs
echo    ✅ File Manager → logs/ folder in your domain root
echo    ✅ File Manager → /home/imsfrkmv/Almari2/logs/
echo.

echo 6. MANUAL TESTING:
echo    ✅ Try SSH/Terminal if available
echo    ✅ Navigate to /home/imsfrkmv/Almari2/
echo    ✅ Run: node simple-start.js
echo    ✅ See if it shows any error messages
echo.

echo 💡 COMMON CPANEL NODE.JS ISSUES:
echo    - Wrong Application Root path
echo    - Node.js version incompatibility  
echo    - Missing node_modules (run npm install)
echo    - File permission issues
echo    - Environment variables not set
echo    - Port conflicts
echo.

echo 🔧 RECOMMENDED ACTION:
echo 1. Change startup file to "simple-start.js" in cPanel
echo 2. Restart the app
echo 3. Visit your website
echo 4. Report what you see (diagnostic message or still error)
echo.

pause