import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  // lets a Cloudflare quick tunnel (phone testing the QR scanner over HTTPS)
  // reach the dev server's /_next assets without a cross-origin block
  allowedDevOrigins: ['*.trycloudflare.com'],
};

export default nextConfig;
