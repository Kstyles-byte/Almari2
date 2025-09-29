#!/bin/bash

echo "🚀 Building Next.js app without SWC compiler..."

# Set environment variables to disable SWC and Rust tools
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export UV_USE_IO_URING=0
export SWCRC=false
export NODE_OPTIONS="--max-old-space-size=1024 --no-turbo-inlining"

# Additional environment variables to disable Rust components
export RUST_BACKTRACE=0
export RAYON_NUM_THREADS=1

# Check if .babelrc exists (it should force Babel usage)
if [ ! -f ".babelrc" ]; then
    echo "Creating .babelrc to force Babel usage..."
    cat > .babelrc << 'EOF'
{
  "presets": ["next/babel"],
  "plugins": []
}
EOF
fi

echo "Environment variables set:"
echo "NODE_ENV: $NODE_ENV"
echo "NEXT_TELEMETRY_DISABLED: $NEXT_TELEMETRY_DISABLED"
echo "NODE_OPTIONS: $NODE_OPTIONS"
echo "RAYON_NUM_THREADS: $RAYON_NUM_THREADS"

# Clean any existing build
echo "🧹 Cleaning existing build..."
rm -rf .next

# Try the build
echo "📦 Starting build process..."
npx next build

BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "Your app is ready for production."
else
    echo "❌ Build failed with exit code $BUILD_EXIT_CODE"
    echo "This is likely due to resource constraints on shared hosting."
    echo ""
    echo "💡 Alternative solutions:"
    echo "1. Build locally and upload the .next folder"
    echo "2. Use a CI/CD service like GitHub Actions"
    echo "3. Contact your hosting provider about resource limits"
    exit $BUILD_EXIT_CODE
fi