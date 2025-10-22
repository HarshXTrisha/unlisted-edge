import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Simplified configuration for Vercel
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    }
  },
  
  // Image optimization (updated to use remotePatterns)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default nextConfig;
