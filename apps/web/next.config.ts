import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@lcau/shared'],
  experimental: {
    // For Cloudflare Pages deployment
  },
};

export default nextConfig;
