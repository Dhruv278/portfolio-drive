import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Dev only: allow the dev server to be opened as 127.0.0.1 as well as localhost
  // (Playwright and the DevTools bridge both use the IP form).
  allowedDevOrigins: ['127.0.0.1'],
  // The bot's route reads the owner's markdown from disk; trace it into the serverless bundle.
  outputFileTracingIncludes: { '/api/ask': ['./src/content/knowledge/*.md'] },
  async headers() {
    return [
      {
        // Models and their palette textures never change without a new path, so browsers may keep them.
        source: '/models/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/Dhruv_Gopani_Resume.pdf',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
    ]
  },
}

export default nextConfig
