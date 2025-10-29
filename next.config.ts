/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'standalone',
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
  webpack: (config: any, { isServer }: any) => {
    // Only disable minification in production if we're on a server environment
    // This allows local builds to work normally while still being compatible with shared hosting
    const isServerEnvironment = process.env.CPANEL_BUILD === 'true' || process.env.DISABLE_MINIFICATION === 'true';
    
    // if (isServerEnvironment) {
    //   // Memory-friendly optimization for shared hosting/GitHub Actions
    //   config.parallelism = 1;
    //   config.cache = false;
      
    //   // Additional memory optimizations
    //   config.stats = 'errors-warnings';
    //   config.performance = {
    //     hints: false,
    //   };
      
    //   // Only disable minification, preserve Next.js defaults for CSS and other optimizations
    //   if (config.optimization) {
    //     config.optimization.minimize = false;
    //     config.optimization.minimizer = [];
        
    //     // Preserve existing splitChunks but modify settings
    //     if (config.optimization.splitChunks) {
    //       config.optimization.splitChunks = {
    //         ...config.optimization.splitChunks,
    //         chunks: 'all',
    //         minSize: 20000,
    //         maxSize: 244000,
    //         cacheGroups: {
    //           ...config.optimization.splitChunks.cacheGroups,
    //           default: {
    //             minChunks: 2,
    //             priority: -20,
    //             reuseExistingChunk: true,
    //           },
    //           vendor: {
    //             test: /[\\/]node_modules[\\/]/,
    //             name: 'vendors',
    //             priority: -10,
    //             chunks: 'all',
    //           },
    //         },
    //       };
    //     }
    //   }
    // } else {
    //   // Normal optimization for local development
    //   if (config.optimization && config.optimization.splitChunks) {
    //     config.optimization.splitChunks = {
    //       ...config.optimization.splitChunks,
    //       maxSize: 244000,
    //       minSize: 20000,
    //     };
    //   }
    // }
    
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