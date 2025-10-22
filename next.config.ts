import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Simplified configuration for Vercel
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    }
  },
  
  // Image optimization
  images: {
    domains: ['localhost', 'vercel.app'],
  },
};

export default nextConfig;
