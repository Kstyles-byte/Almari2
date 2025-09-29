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
process.env.NODE_OPTIONS = '--max-old-space-size=1024'; // Limit to 1GB RAM
process.env.UV_USE_IO_URING = '0'; // Disable io_uring to avoid resource issues

// Disable Rust-based tools that might cause issues
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.SWCRC = 'false';

console.log('🚀 Starting optimized build for cPanel/shared hosting...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  NODE_OPTIONS: process.env.NODE_OPTIONS,
  UV_USE_IO_URING: process.env.UV_USE_IO_URING,
  NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED,
});

// Function to run build with retry logic
function runBuild(attempt = 1) {
  const maxAttempts = 3;
  
  console.log(`\n📦 Build attempt ${attempt}/${maxAttempts}...`);
  
  const buildProcess = spawn('npx', ['next', 'build'], {
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