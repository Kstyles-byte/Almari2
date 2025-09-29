/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  
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
  
  // Turbopack configuration removed - not needed for standard builds
  
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb', // Allow up to 6MB for image uploads
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
    // Only disable minification in production if we're on a server environment
    // This allows local builds to work normally while still being compatible with shared hosting
    const isServerEnvironment = process.env.CPANEL_BUILD === 'true' || process.env.DISABLE_MINIFICATION === 'true';
    
    if (isServerEnvironment) {
      // Disable minification only for server builds
      if (config.optimization) {
        config.optimization.minimize = false;
        config.optimization.minimizer = [];
      }
      
      // Reduce parallelism to avoid resource exhaustion on shared hosting
      config.parallelism = 1;
    }
    
    // Optimize for limited memory environments when needed
    config.optimization = {
      ...config.optimization,
      ...(isServerEnvironment && {
        minimize: false,
        minimizer: [],
      }),
      splitChunks: {
        ...config.optimization.splitChunks,
        maxSize: isServerEnvironment ? 244000 : undefined,
        minSize: isServerEnvironment ? 20000 : undefined,
      },
    };
    
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