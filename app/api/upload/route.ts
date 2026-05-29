import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { put } from '@vercel/blob'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename') || 'upload.webp'

    // Envia o stream binário diretamente para o Vercel Blob
    const blob = await put(filename, request.body!, {
      access: 'public',
    })

    return NextResponse.json(blob)
  } catch (error) {
    console.error('[POST /api/upload]', error)
    const msg = error instanceof Error ? error.message : 'Erro ao fazer upload da imagem'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
