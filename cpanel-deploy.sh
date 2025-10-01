#!/bin/bash
# cPanel Deployment Script for Almari2 Next.js App
# This script handles the build process with proper Node.js environment setup

set -e  # Exit on any error

echo "🚀 Starting Almari2 deployment process..."

# Set deployment path
DEPLOYPATH="/home/imsfrkmv/Almari2"
echo "📍 Deploy path: $DEPLOYPATH"

# Navigate to deployment directory
cd "$DEPLOYPATH" || { echo "❌ Failed to navigate to $DEPLOYPATH"; exit 1; }

# Try to find Node.js installation
echo "🔍 Looking for Node.js installation..."

# Common Node.js paths in cPanel
NODE_PATHS=(
    "/home/imsfrkmv/nodevenv/Almari2/18/bin"
    "/home/imsfrkmv/nodevenv/Almari2/20/bin"
    "/home/imsfrkmv/nodevenv/Almari2/22/bin"
    "/usr/local/bin"
    "/usr/bin"
)

# Find the Node.js installation
NODE_BIN=""
NPM_BIN=""

for path in "${NODE_PATHS[@]}"; do
    if [ -f "$path/node" ] && [ -f "$path/npm" ]; then
        NODE_BIN="$path/node"
        NPM_BIN="$path/npm"
        echo "✅ Found Node.js at: $NODE_BIN"
        echo "✅ Found NPM at: $NPM_BIN"
        break
    fi
done

# If not found, try to use system-wide installations
if [ -z "$NODE_BIN" ]; then
    NODE_BIN=$(which node 2>/dev/null || echo "")
    NPM_BIN=$(which npm 2>/dev/null || echo "")
fi

# Check if we found Node.js and NPM
if [ -z "$NODE_BIN" ] || [ -z "$NPM_BIN" ]; then
    echo "❌ Node.js or NPM not found. Please ensure Node.js is properly installed in cPanel."
    echo "Available paths checked:"
    for path in "${NODE_PATHS[@]}"; do
        echo "  - $path"
    done
    exit 1
fi

# Display versions
echo "📋 Node.js version: $($NODE_BIN --version)"
echo "📋 NPM version: $($NPM_BIN --version)"

# Set environment variables for build
export NODE_ENV=production
export CPANEL_BUILD=true
export DISABLE_MINIFICATION=true
export NODE_OPTIONS="--max-old-space-size=1024"
export UV_USE_IO_URING=0
export NEXT_TELEMETRY_DISABLED=1

echo "🌍 Environment variables set:"
echo "  NODE_ENV=$NODE_ENV"
echo "  CPANEL_BUILD=$CPANEL_BUILD"
echo "  NODE_OPTIONS=$NODE_OPTIONS"

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f "package-lock.json" ]; then
    echo "Using npm ci (faster, reliable install)..."
    $NPM_BIN ci --prefer-offline --no-audit --production=false
else
    echo "Using npm install..."
    $NPM_BIN install --prefer-offline --no-audit
fi

# Check if node_modules was created
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules directory not created. Installation may have failed."
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the application
echo "🔨 Building application for production..."

# Try multiple build commands in order of preference
BUILD_SUCCESS=false

if $NPM_BIN run build:safe 2>&1; then
    echo "✅ Build successful using build:safe"
    BUILD_SUCCESS=true
elif $NPM_BIN run build:production 2>&1; then
    echo "✅ Build successful using build:production"
    BUILD_SUCCESS=true
elif $NPM_BIN run build 2>&1; then
    echo "✅ Build successful using default build"
    BUILD_SUCCESS=true
else
    echo "❌ All build attempts failed"
    BUILD_SUCCESS=false
fi

if [ "$BUILD_SUCCESS" = false ]; then
    echo "❌ Build failed. Check the error messages above."
    exit 1
fi

# Verify build was successful
if [ -d ".next" ]; then
    echo "✅ Build verification successful - .next directory created"
    echo "📁 .next directory size: $(du -sh .next | cut -f1)"
else
    echo "❌ Build verification failed - .next directory not found"
    exit 1
fi

# Clean up development dependencies to save space
echo "🧹 Cleaning up development dependencies..."
$NPM_BIN prune --production

echo "✅ Deployment completed successfully!"
echo "🔄 Please restart your Node.js application in cPanel to apply changes."
echo "🎯 Your app should now be available at your domain."