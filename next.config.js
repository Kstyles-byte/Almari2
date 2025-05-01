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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
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
  // Updated experimental features section
  experimental: {
    // Removed serverExternalPackages as it's no longer supported
    // If bcrypt functionality is needed, use a client-side alternative or API route
  },
}

module.exports = nextConfig 