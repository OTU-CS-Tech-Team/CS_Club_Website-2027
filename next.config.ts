import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: process.cwd(),
  // lets a Cloudflare quick tunnel (phone testing the QR scanner over HTTPS)
  // reach the dev server's /_next assets without a cross-origin block
  allowedDevOrigins: ['*.trycloudflare.com'],
  // keeps Supabase out of the server-action bundle so opening New event
  // does not crash with "Cannot read properties of undefined (reading 'call')"
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
};

export default nextConfig;
