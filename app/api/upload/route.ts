import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import crypto from 'crypto'
import sharp from 'sharp'

/* ── Converte qualquer imagem para WebP otimizado ── */
async function toWebP(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()           // respeita EXIF orientation (fotos de celular)
    .webp({ quality: 82, effort: 4 })
    .toBuffer()
}

/* ── helpers ── */
function hasCloudinary() {
  return (
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.includes('seu-') &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_API_SECRET.includes('seu-')
  )
}

function hasVercelBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const raw = Buffer.from(await file.arrayBuffer())

  // Converter para WebP (exceto SVG e GIF animado que não fazem sentido comprimir assim)
  const isSvg = file.type === 'image/svg+xml'
  const isGif = file.type === 'image/gif'
  const webpBuffer = (isSvg || isGif) ? raw : await toWebP(raw)
  const finalType = (isSvg || isGif) ? file.type : 'image/webp'
  const finalExt  = isSvg ? 'svg' : isGif ? 'gif' : 'webp'
  const filename  = `${crypto.randomUUID()}.${finalExt}`

  /* ── 1. Cloudinary (when configured) ── */
  if (hasCloudinary()) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!
    const apiSecret = process.env.CLOUDINARY_API_SECRET!
    const folder = 'twix-eventos/brinquedos'
    const timestamp = Math.round(Date.now() / 1000).toString()
    const signature = crypto
      .createHash('sha256')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex')

    const cldForm = new FormData()
    cldForm.append('file', new Blob([new Uint8Array(webpBuffer)], { type: finalType }), filename)
    cldForm.append('signature', signature)
    cldForm.append('timestamp', timestamp)
    cldForm.append('api_key', apiKey)
    cldForm.append('folder', folder)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cldForm,
    })
    if (!res.ok) return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 })
    const data = await res.json()
    return NextResponse.json({ url: data.secure_url as string, originalSize: raw.length, finalSize: webpBuffer.length })
  }

  /* ── 2. Vercel Blob (production default) ── */
  if (hasVercelBlob()) {
    const { put } = await import('@vercel/blob')
    const blob = await put(`twix-eventos/${filename}`, webpBuffer, {
      access: 'public',
      contentType: finalType,
    })
    return NextResponse.json({ url: blob.url, originalSize: raw.length, finalSize: webpBuffer.length })
  }

  /* ── 3. Local filesystem (dev only) ── */
  if (process.env.NODE_ENV !== 'production') {
    const { writeFile, mkdir } = await import('fs/promises')
    const { join } = await import('path')
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'brinquedos')
    await mkdir(uploadsDir, { recursive: true })
    await writeFile(join(uploadsDir, filename), webpBuffer)
    return NextResponse.json({ url: `/uploads/brinquedos/${filename}`, originalSize: raw.length, finalSize: webpBuffer.length })
  }

  /* ── Nenhum storage configurado em produção ── */
  return NextResponse.json(
    { error: 'Storage não configurado. Adicione BLOB_READ_WRITE_TOKEN nas variáveis de ambiente do Vercel.' },
    { status: 500 }
  )
}
