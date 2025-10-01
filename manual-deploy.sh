#!/bin/bash
# Manual Deployment Script for Almari2
# Use this if automatic deployment fails
# Run this from your cPanel Terminal: bash manual-deploy.sh

echo "🔧 Manual Deployment for Almari2"
echo "=================================="

# Check current directory
echo "📍 Current directory: $(pwd)"
echo "📁 Contents: $(ls -la)"

# Try to find Node.js
echo ""
echo "🔍 Searching for Node.js installation..."

# Check common locations
echo "Checking /home/imsfrkmv/nodevenv/Almari2/:"
ls -la /home/imsfrkmv/nodevenv/Almari2/ 2>/dev/null || echo "Directory not found"

# Check what Node.js versions are available
echo ""
echo "Available Node.js versions:"
find /home/imsfrkmv/nodevenv -name "node" 2>/dev/null || echo "No Node.js found in nodevenv"

# Check system-wide Node.js
echo ""
echo "System-wide Node.js:"
which node && node --version || echo "No system Node.js found"
which npm && npm --version || echo "No system npm found"

echo ""
echo "🔧 Manual Installation Steps:"
echo "1. Make sure you're in the correct directory:"
echo "   cd /home/imsfrkmv/Almari2"
echo ""
echo "2. If you found Node.js above, use the full path. For example:"
echo "   /home/imsfrkmv/nodevenv/Almari2/18/bin/npm install"
echo "   /home/imsfrkmv/nodevenv/Almari2/18/bin/npm run build:safe"
echo ""
echo "3. Or try activating the Node.js environment first:"
echo "   source /home/imsfrkmv/nodevenv/Almari2/18/bin/activate"
echo "   npm install"
echo "   npm run build:safe"
echo ""
echo "4. Check if .next folder was created:"
echo "   ls -la .next"
echo ""
echo "5. Restart your Node.js app in cPanel interface"

# If we're actually in the deployment directory, try to help
if [ -f "package.json" ]; then
    echo ""
    echo "✅ Found package.json - we're in the right place!"
    
    # Try to run deployment automatically
    echo "🚀 Attempting automatic deployment..."
    
    # Source the deployment script if it exists
    if [ -f "cpanel-deploy.sh" ]; then
        echo "📄 Found cpanel-deploy.sh, running it..."
        bash cpanel-deploy.sh
    else
        echo "❌ cpanel-deploy.sh not found. Manual steps required."
    fi
else
    echo ""
    echo "⚠️  package.json not found. You may need to:"
    echo "1. Navigate to /home/imsfrkmv/Almari2"
    echo "2. Or make sure Git deployment completed successfully"
fi