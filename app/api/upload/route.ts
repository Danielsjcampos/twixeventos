import { NextResponse } from 'next/server'

/**
 * Rota descontinuada a partir da v1.6.0.
 *
 * Imagens agora são processadas 100% no client e armazenadas como base64
 * data URLs diretamente no PostgreSQL (sem Vercel Blob / S3 / Cloudinary).
 *
 * Veja: lib/cloudinary/upload.ts
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Rota descontinuada. Imagens agora são processadas no client e salvas como base64 direto no banco.',
    },
    { status: 410 }, // 410 Gone
  )
}
