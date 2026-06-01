import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Build self-hosted (Docker/Portainer): gera .next/standalone com server.js
  output: 'standalone',

  // sharp usa binários nativos — não pode ser bundled pelo webpack no Vercel
  serverExternalPackages: ['sharp'],

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
      // Vercel Blob Storage
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },

  // Economia de tráfego: imagens enviadas (nome único/uuid) são imutáveis →
  // cache de 1 ano no browser/CDN, evitando re-downloads.
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
