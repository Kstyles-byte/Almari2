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
      // EXTREME memory optimization for shared hosting
      config.parallelism = 1;
      config.cache = false;
      config.watchOptions = { ignored: /node_modules/ };
      
      // Disable as much as possible
      config.resolve = config.resolve || {};
      config.resolve.symlinks = false;
      config.resolve.cacheWithContext = false;
      
      // Disable minification and compression
      if (config.optimization) {
        config.optimization.minimize = false;
        config.optimization.minimizer = [];
        config.optimization.concatenateModules = false;
        config.optimization.flagIncludedChunks = false;
        config.optimization.innerGraph = false;
        config.optimization.mangleWasmImports = false;
        config.optimization.providedExports = false;
        config.optimization.usedExports = false;
        config.optimization.sideEffects = false;
      }
      
      // Reduce memory usage by limiting chunk sizes
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 10000,
        maxSize: 200000,
        minChunks: 1,
        maxAsyncRequests: 3,
        maxInitialRequests: 3,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 150000,
          },
        },
      };
      
      // Disable webpack's compilation cache to save memory
      config.cache = false;
    } else {
      // Normal optimization for local development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          maxSize: 244000,
          minSize: 20000,
        },
      };
    }
    
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