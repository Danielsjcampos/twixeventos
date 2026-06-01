import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

// VERSÃO PORTAINER / SELF-HOSTED
// Recebe a imagem, normaliza para WebP com sharp (auto-rotate + resize + compressão)
// e grava em public/uploads/brinquedos (volume Docker persistente).
// Economia de tráfego: WebP q80 + dimensão máx 1400px + cache imutável (ver next.config.ts).
// O cliente (lib/cloudinary/upload.ts) não muda — ele já faz POST do arquivo e lê { url }.
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'brinquedos')
const MAX_WIDTH = 1400
const QUALITY = 80

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const input = Buffer.from(await request.arrayBuffer())
    if (input.length === 0) {
      return NextResponse.json({ message: 'Arquivo vazio' }, { status: 400 })
    }

    // Conversão automatizada para WebP (garante o formato mesmo se o cliente enviar PNG/JPG)
    const webp = await sharp(input)
      .rotate() // respeita a orientação EXIF (fotos de celular)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer()

    await mkdir(UPLOAD_DIR, { recursive: true })
    const filename = `${randomUUID()}.webp`
    await writeFile(path.join(UPLOAD_DIR, filename), webp)

    // URL pública servida como arquivo estático (cache imutável)
    return NextResponse.json({ url: `/uploads/brinquedos/${filename}` })
  } catch (error) {
    console.error('[POST /api/upload]', error)
    const msg = error instanceof Error ? error.message : 'Erro ao processar a imagem'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
