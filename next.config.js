/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  
  // Disable SWC compiler to avoid Rust compilation issues on shared hosting
  swcMinify: false,
  
  // Disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint checking during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuration optimized for Node.js deployment on cPanel
  // All server features (API routes, server actions, etc.) are preserved
  
  // Don't attempt to statically optimize the checkout page and related routes
  // This ensures these pages are rendered dynamically at request time
  // Remove deprecated options; Next.js 15 no longer supports these keys
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb', // Allow up to 6MB for image uploads
    },
    // Disable features that might cause issues on shared hosting
    esmExternals: false,
    // Reduce memory usage
    turbo: {
      memoryLimit: 512, // Limit memory usage to 512MB
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Optimize for limited memory and CPU on shared hosting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        maxSize: 244000, // Smaller chunks for limited memory
        minSize: 20000,
      },
    };
    
    // Reduce parallelism to avoid resource exhaustion
    config.parallelism = 1;
    
    // Disable some optimizations that can be resource intensive
    config.optimization.minimize = process.env.NODE_ENV === 'production';
    
    if (!isServer) {
      // Don't bundle server-only modules on the client side
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        aws4: false,
        'aws-sdk': false,
        'mock-aws-s3': false,
        nock: false,
        'node-gyp': false,
        'node-pre-gyp': false,
        bcrypt: false,
      }
    }
    
    // Add case insensitive module resolution for Windows/Linux compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve(__dirname, './components')
    }
    
    return config
  },
}

module.exports = nextConfig 