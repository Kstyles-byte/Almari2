@echo off
echo.
echo 🚀 Almari2 cPanel Deployment Script
echo =================================
echo.

REM Set environment variables for production build
set NODE_ENV=production
set CPANEL_BUILD=true
set DISABLE_MINIFICATION=true
set NEXT_TELEMETRY_DISABLED=1
set NODE_OPTIONS=--max-old-space-size=4096

echo 🔨 Building application locally...
echo.

REM Clean previous build
if exist ".next" (
    echo 🧹 Cleaning previous build...
    rmdir /s /q ".next"
)

echo 📦 Running production build...
call npm run build:production:win

if not exist ".next" (
    echo ❌ Build failed - .next directory not created
    pause
    exit /b 1
)

echo ✅ Build completed successfully!
echo.

REM Clean previous deployment package
if exist "almari2-deploy" (
    echo 🧹 Cleaning previous deployment package...
    rmdir /s /q "almari2-deploy"
)

echo 📦 Creating deployment package...
mkdir "almari2-deploy"

echo 📁 Copying .next directory...
xcopy ".next" "almari2-deploy\.next" /E /I /Q

REM Copy essential files
echo 📄 Copying essential files...
if exist "package.json" copy "package.json" "almari2-deploy\"
if exist "package-lock.json" copy "package-lock.json" "almari2-deploy\"
if exist "server.js" copy "server.js" "almari2-deploy\"
if exist "next.config.js" copy "next.config.js" "almari2-deploy\"

REM Copy source directories
echo 📁 Copying source directories...
if exist "app" xcopy "app" "almari2-deploy\app" /E /I /Q
if exist "components" xcopy "components" "almari2-deploy\components" /E /I /Q
if exist "lib" xcopy "lib" "almari2-deploy\lib" /E /I /Q
if exist "public" xcopy "public" "almari2-deploy\public" /E /I /Q
if exist "types" xcopy "types" "almari2-deploy\types" /E /I /Q
if exist "actions" xcopy "actions" "almari2-deploy\actions" /E /I /Q
if exist "contexts" xcopy "contexts" "almari2-deploy\contexts" /E /I /Q
if exist "hooks" xcopy "hooks" "almari2-deploy\hooks" /E /I /Q
if exist "providers" xcopy "providers" "almari2-deploy\providers" /E /I /Q

echo.
echo 🗜️ Creating deployment zip...
powershell -command "& { $date = Get-Date -Format 'yyyy-MM-dd-HHmm'; Compress-Archive -Path 'almari2-deploy\*' -DestinationPath \"almari2-deploy-$date.zip\" -Force; Write-Host \"✅ Created almari2-deploy-$date.zip\" }"

echo.
echo ✅ Deployment package created successfully!
echo.
echo 📋 Next steps:
echo 1. Upload the almari2-deploy-*.zip file to your cPanel File Manager
echo 2. Extract it in /home/imsfrkmv/Almari2/
echo 3. Push your source code via Git (this will install dependencies)
echo 4. Your app should be ready!
echo.
echo 💡 Tips:
echo    - The .next folder contains your pre-built app
echo    - Git push will only install dependencies (no build)
echo    - If you make code changes, run this script again
echo.
pause