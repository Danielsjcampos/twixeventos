import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
}

export default nextConfig
