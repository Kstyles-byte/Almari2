# PowerShell script to prepare deployment package for cPanel
# Run this on your local Windows machine after successful build

Write-Host "🚀 Preparing deployment package for cPanel..." -ForegroundColor Green

# Check if .next exists (build must be completed first)
if (-not (Test-Path ".next")) {
    Write-Host "❌ .next folder not found. Please run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Create deployment directory
$deployDir = "deploy"
if (Test-Path $deployDir) {
    Write-Host "🧹 Cleaning existing deploy directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $deployDir
}

Write-Host "📁 Creating deployment directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Copy essential files for cPanel deployment
Write-Host "📦 Copying files..." -ForegroundColor Yellow

# Core Next.js files
Copy-Item -Recurse ".next" "$deployDir\.next"
Copy-Item "package.json" "$deployDir\package.json"
Copy-Item "next.config.js" "$deployDir\next.config.js"

# Application directories
$appDirs = @("app", "lib", "components", "actions", "types")
foreach ($dir in $appDirs) {
    if (Test-Path $dir) {
        Write-Host "  Copying $dir..." -ForegroundColor Cyan
        Copy-Item -Recurse $dir "$deployDir\$dir"
    }
}

# Public assets
if (Test-Path "public") {
    Write-Host "  Copying public assets..." -ForegroundColor Cyan
    Copy-Item -Recurse "public" "$deployDir\public"
}

# Environment files
$envFiles = @(".env.production", ".env", ".env.local")
foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "  Copying $envFile..." -ForegroundColor Cyan
        Copy-Item $envFile "$deployDir\$envFile"
    }
}

# Middleware (if exists)
if (Test-Path "middleware.ts") {
    Copy-Item "middleware.ts" "$deployDir\middleware.ts"
} elseif (Test-Path "middleware.js") {
    Copy-Item "middleware.js" "$deployDir\middleware.js"
}

# Create a production package.json (optional optimization)
$originalPackage = Get-Content "package.json" | ConvertFrom-Json

# Create a minimal package.json for production
$productionPackage = @{
    name = $originalPackage.name
    version = $originalPackage.version
    private = $originalPackage.private
    scripts = @{
        start = $originalPackage.scripts.start
        "start:next" = $originalPackage.scripts."start:next"
    }
    dependencies = $originalPackage.dependencies
    engines = $originalPackage.engines
}

if ($originalPackage.browser) {
    $productionPackage.browser = $originalPackage.browser
}

$productionPackage | ConvertTo-Json -Depth 10 | Set-Content "$deployDir\package.json"

# Create deployment instructions
$instructions = @"
# Deployment Instructions

1. Upload all files in this 'deploy' folder to your cPanel Node.js app directory

2. In cPanel, navigate to Node.js and:
   - Set Node.js version to 18 or higher
   - Set Application mode to 'Production'
   - Set Environment variable: NODE_ENV=production

3. Install dependencies (in cPanel terminal or file manager terminal):
   npm install --production

4. Start the application:
   npm start

5. Your app should now be accessible via your domain

## Troubleshooting

If you get a 503 error:
- Check that all files were uploaded correctly
- Verify Node.js version is 18+
- Check the error logs in cPanel
- Ensure all environment variables are set

## Files included in this deployment:
"@

$instructions | Set-Content "$deployDir\DEPLOYMENT_INSTRUCTIONS.txt"

# List all copied items
Write-Host "📋 Deployment package contents:" -ForegroundColor Green
Get-ChildItem -Recurse $deployDir | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    Write-Host "  $relativePath" -ForegroundColor Gray
}

Write-Host "`n✅ Deployment package ready in '$deployDir' folder!" -ForegroundColor Green
Write-Host "📖 See DEPLOYMENT_INSTRUCTIONS.txt in the deploy folder for upload instructions." -ForegroundColor Yellow

# Calculate total size
$totalSize = (Get-ChildItem -Recurse $deployDir | Measure-Object -Property Length -Sum).Sum
$sizeInMB = [math]::Round($totalSize / 1MB, 2)
Write-Host "📊 Total package size: $sizeInMB MB" -ForegroundColor Cyan

Write-Host "`n🚀 Next steps:" -ForegroundColor Green
Write-Host "1. Upload the contents of the 'deploy' folder to your cPanel" -ForegroundColor White
Write-Host "2. Run 'npm install --production' on the server" -ForegroundColor White  
Write-Host "3. Set your app to production mode in cPanel" -ForegroundColor White
Write-Host "4. Start with 'npm start'" -ForegroundColor White