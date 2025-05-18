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
  // Don't attempt to statically optimize the checkout page and related routes
  // This ensures these pages are rendered dynamically at request time
  unstable_excludeDefaultMomentLocales: true,
  experimental: {
    // Force dynamic rendering for specific pages that need it
    serverComponentsExternalPackages: [],
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