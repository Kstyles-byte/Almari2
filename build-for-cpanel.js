#!/usr/bin/env node
/**
 * Local Build Script for cPanel Deployment
 * Use this if the server build fails due to memory constraints
 * Run: node build-for-cpanel.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️ Building Almari2 for cPanel Deployment');
console.log('==========================================');

// Set environment variables for cPanel-compatible build
process.env.NODE_ENV = 'production';
process.env.CPANEL_BUILD = 'true';
process.env.DISABLE_MINIFICATION = 'true';
process.env.NEXT_TELEMETRY_DISABLED = '1';

try {
    // Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    if (fs.existsSync('.next')) {
        fs.rmSync('.next', { recursive: true, force: true });
    }
    if (fs.existsSync('cpanel-deploy-package')) {
        fs.rmSync('cpanel-deploy-package', { recursive: true, force: true });
    }

    // Build the application
    console.log('🔨 Building application...');
    execSync('npm run build:production', { stdio: 'inherit' });

    // Verify build succeeded
    if (!fs.existsSync('.next')) {
        throw new Error('.next directory not created - build may have failed');
    }

    console.log('✅ Build successful!');

    // Create deployment package
    console.log('📦 Creating deployment package...');
    fs.mkdirSync('cpanel-deploy-package', { recursive: true });

    // Copy built files
    console.log('📁 Copying .next directory...');
    execSync('xcopy ".next" "cpanel-deploy-package\\.next" /E /I /Q', { stdio: 'inherit' });

    // Copy essential files
    const essentialFiles = [
        'package.json',
        'package-lock.json',
        'server.js',
        'next.config.js',
        'cpanel-deploy.sh',
        'manual-deploy.sh'
    ];

    essentialFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`📄 Copying ${file}...`);
            fs.copyFileSync(file, path.join('cpanel-deploy-package', file));
        }
    });

    // Copy source directories (for completeness)
    const sourceDirs = [
        'app',
        'components', 
        'lib',
        'public',
        'types',
        'actions',
        'contexts',
        'hooks',
        'providers'
    ];

    sourceDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            console.log(`📁 Copying ${dir} directory...`);
            execSync(`xcopy "${dir}" "cpanel-deploy-package\\${dir}" /E /I /Q`, { stdio: 'inherit' });
        }
    });

    console.log('✅ Deployment package created successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Compress the "cpanel-deploy-package" folder to a ZIP file');
    console.log('2. Upload and extract it to your cPanel file manager at /home/imsfrkmv/Almari2');
    console.log('3. In cPanel Node.js app, run "npm install --production"');
    console.log('4. Restart your Node.js application');
    console.log('');
    console.log('🎯 Your app should now work with the pre-built .next folder!');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('- Make sure you have enough memory locally to build');
    console.log('- Try running "npm run build" manually to see detailed errors');
    console.log('- Ensure all dependencies are installed: "npm install"');
    process.exit(1);
}