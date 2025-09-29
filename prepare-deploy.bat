@echo off
echo 🚀 Preparing deployment package for cPanel...

REM Check if .next exists
if not exist ".next" (
    echo ❌ .next folder not found. Please run 'npm run build' first.
    pause
    exit /b 1
)

REM Create deployment directory
if exist "deploy" (
    echo 🧹 Cleaning existing deploy directory...
    rmdir /s /q "deploy"
)

echo 📁 Creating deployment directory...
mkdir deploy

echo 📦 Copying files...

REM Core Next.js files
echo   Copying .next...
xcopy ".next" "deploy\.next" /s /e /i /q
copy "package.json" "deploy\"
copy "next.config.js" "deploy\"

REM Application directories
if exist "app" (
    echo   Copying app...
    xcopy "app" "deploy\app" /s /e /i /q
)
if exist "lib" (
    echo   Copying lib...
    xcopy "lib" "deploy\lib" /s /e /i /q
)
if exist "components" (
    echo   Copying components...
    xcopy "components" "deploy\components" /s /e /i /q
)
if exist "actions" (
    echo   Copying actions...
    xcopy "actions" "deploy\actions" /s /e /i /q
)
if exist "types" (
    echo   Copying types...
    xcopy "types" "deploy\types" /s /e /i /q
)

REM Public assets
if exist "public" (
    echo   Copying public...
    xcopy "public" "deploy\public" /s /e /i /q
)

REM Environment files
if exist ".env.production" copy ".env.production" "deploy\"
if exist ".env" copy ".env" "deploy\"
if exist ".env.local" copy ".env.local" "deploy\"

REM Middleware
if exist "middleware.ts" copy "middleware.ts" "deploy\"
if exist "middleware.js" copy "middleware.js" "deploy\"

REM Create deployment instructions
echo # Deployment Instructions > "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo. >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo 1. Upload all files in this deploy folder to your cPanel Node.js app directory >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo. >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo 2. In cPanel, navigate to Node.js and: >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo    - Set Node.js version to 18 or higher >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo    - Set Application mode to Production >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo    - Set Environment variable: NODE_ENV=production >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo. >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo 3. Install dependencies in cPanel terminal: >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo    npm install --production >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo. >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo 4. Start the application: >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo    npm start >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo. >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"
echo 5. Your app should now be accessible via your domain >> "deploy\DEPLOYMENT_INSTRUCTIONS.txt"

echo.
echo ✅ Deployment package ready in deploy folder!
echo 📖 See DEPLOYMENT_INSTRUCTIONS.txt in the deploy folder for upload instructions.
echo.
echo 🚀 Next steps:
echo 1. Upload the contents of the deploy folder to your cPanel
echo 2. Run npm install --production on the server
echo 3. Set your app to production mode in cPanel
echo 4. Start with npm start
echo.
pause