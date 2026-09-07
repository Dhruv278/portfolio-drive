import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Dev only: allow the dev server to be opened as 127.0.0.1 as well as localhost
  // (Playwright and the DevTools bridge both use the IP form).
  allowedDevOrigins: ['127.0.0.1'],
}

export default nextConfig
