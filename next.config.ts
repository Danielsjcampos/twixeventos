import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Gera .next/standalone para deploy Docker (sem node_modules completo)
  output: 'standalone',
  // sharp e postgres usam binários nativos — não podem ser bundled
  serverExternalPackages: ['sharp', 'postgres'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'twixeventos.com',
      },
    ],
  },
}

export default nextConfig
