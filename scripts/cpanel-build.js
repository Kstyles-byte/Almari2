#!/usr/bin/env node

/**
 * Custom build script optimized for cPanel/shared hosting environments
 * This script addresses common issues with Next.js builds on shared hosting:
 * - Resource limitations
 * - Non-standard NODE_ENV values
 * - SWC/Rust compiler issues
 */

const { spawn } = require('child_process');
const path = require('path');

// Set proper environment variables
process.env.NODE_ENV = 'production';
process.env.NODE_OPTIONS = '--max-old-space-size=1024 --no-turbo-inlining'; // Limit to 1GB RAM and disable turbo
process.env.UV_USE_IO_URING = '0'; // Disable io_uring to avoid resource issues

// Disable Rust-based tools that might cause issues
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.SWCRC = 'false';
process.env.RUST_BACKTRACE = '0';
process.env.RAYON_NUM_THREADS = '1';
process.env.CPANEL_BUILD = 'true';
process.env.DISABLE_MINIFICATION = 'true';

const fs = require('fs');

console.log('🚀 Starting optimized build for cPanel/shared hosting...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  NODE_OPTIONS: process.env.NODE_OPTIONS,
  UV_USE_IO_URING: process.env.UV_USE_IO_URING,
  NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED,
  RAYON_NUM_THREADS: process.env.RAYON_NUM_THREADS,
});

// Clean existing build
console.log('🧹 Cleaning existing build...');
const { execSync } = require('child_process');
try {
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }
} catch (cleanError) {
  console.warn('Could not clean .next folder:', cleanError.message);
}

// Function to run build with retry logic
function runBuild(attempt = 1) {
  const maxAttempts = 3;
  
  console.log(`\n📦 Build attempt ${attempt}/${maxAttempts}...`);
  
  // Resolve Next.js CLI directly to avoid relying on `npx` in constrained environments (Windows/cPanel)
  let nextBin;
  try {
    nextBin = require.resolve('next/dist/bin/next');
  } catch (e) {
    console.error('❌ Could not resolve Next.js binary. Ensure dependencies are installed (run `npm ci`).');
    process.exit(1);
  }

  const buildProcess = spawn(process.execPath, [nextBin, 'build'], {
    stdio: 'inherit',
    env: { ...process.env },
    cwd: process.cwd()
  });
  
  buildProcess.on('exit', (code) => {
    if (code === 0) {
      console.log('✅ Build completed successfully!');
      console.log('\n🎉 Your app is ready for production deployment.');
      console.log('\nNext steps:');
      console.log('1. Start your app with: npm start');
      console.log('2. Or use PM2: pm2 start ecosystem.config.js');
      process.exit(0);
    } else {
      console.error(`❌ Build failed with exit code ${code}`);
      
      if (attempt < maxAttempts) {
        console.log(`\n🔄 Retrying build (${attempt + 1}/${maxAttempts})...`);
        // Wait a bit before retrying
        setTimeout(() => {
          runBuild(attempt + 1);
        }, 2000);
      } else {
        console.error('\n💥 All build attempts failed.');
        console.error('\nTroubleshooting tips:');
        console.error('1. Check if you have enough available memory');
        console.error('2. Try building during off-peak hours');
        console.error('3. Contact your hosting provider about resource limits');
        console.error('4. Consider using a build service like Vercel or Netlify');
        process.exit(1);
      }
    }
  });
  
  buildProcess.on('error', (error) => {
    console.error('❌ Build process error:', error.message);
    if (attempt < maxAttempts) {
      setTimeout(() => {
        runBuild(attempt + 1);
      }, 2000);
    } else {
      process.exit(1);
    }
  });
}

// Start the build process
runBuild();