import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import crypto from 'crypto'
import sharp from 'sharp'

/* ── Converte para WebP otimizado (só se não for já WebP) ── */
async function toWebP(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; converted: boolean }> {
  if (mimeType === 'image/webp') {
    // Já é WebP (cliente converteu antes de enviar) — só redimensiona se necessário
    const img = sharp(buffer).rotate() // respeita EXIF
    const meta = await img.metadata()
    if ((meta.width ?? 0) > 1400) {
      const out = await img.resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
      return { buffer: out, converted: false }
    }
    return { buffer, converted: false }
  }
  // PNG / JPG / etc → converte para WebP
  const out = await sharp(buffer).rotate().webp({ quality: 82, effort: 4 }).toBuffer()
  return { buffer: out, converted: true }
}

/* ── helpers ── */
function hasCloudinary() {
  const name   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''
  const secret = process.env.CLOUDINARY_API_SECRET ?? ''
  return name && !name.includes('seu-') && secret && !secret.includes('seu-')
}

function hasVercelBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

  // Validação básica de tamanho (20 MB)
  const MAX_BYTES = 20 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo: 20 MB.' }, { status: 400 })
  }

  const raw = Buffer.from(await file.arrayBuffer())

  // SVG e GIF animado → sem conversão
  const isSvg = file.type === 'image/svg+xml'
  const isGif = file.type === 'image/gif'

  let webpBuffer: Buffer
  let finalType: string
  let finalExt: string

  if (isSvg || isGif) {
    webpBuffer = raw
    finalType  = file.type
    finalExt   = isSvg ? 'svg' : 'gif'
  } else {
    const result = await toWebP(raw, file.type)
    webpBuffer = result.buffer
    finalType  = 'image/webp'
    finalExt   = 'webp'
  }

  const filename = `${crypto.randomUUID()}.${finalExt}`

  /* ── 1. Cloudinary (quando configurado) ── */
  if (hasCloudinary()) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
    const apiKey    = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!
    const apiSecret = process.env.CLOUDINARY_API_SECRET!
    const folder    = 'twix-eventos/brinquedos'
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
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[upload] Cloudinary error:', err)
      return NextResponse.json({ error: 'Falha no Cloudinary. Verifique as credenciais.' }, { status: 500 })
    }
    const data = await res.json()
    return NextResponse.json({
      url: data.secure_url as string,
      originalSize: raw.length,
      finalSize: webpBuffer.length,
      storage: 'cloudinary',
    })
  }

  /* ── 2. Vercel Blob (padrão em produção) ── */
  if (hasVercelBlob()) {
    try {
      const { put } = await import('@vercel/blob')
      const blob = await put(`twix-eventos/${filename}`, webpBuffer, {
        access: 'public',
        contentType: finalType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
      })
      return NextResponse.json({
        url: blob.url,
        originalSize: raw.length,
        finalSize: webpBuffer.length,
        storage: 'vercel-blob',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : ''
      console.error('[upload] Vercel Blob ERRO COMPLETO:', msg)
      console.error('[upload] Stack:', stack)
      return NextResponse.json(
        { error: `Falha no Vercel Blob: ${msg}` },
        { status: 500 },
      )
    }
  }

  /* ── 3. Filesystem local (dev) ── */
  if (process.env.NODE_ENV !== 'production') {
    const { writeFile, mkdir } = await import('fs/promises')
    const { join } = await import('path')
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'brinquedos')
    await mkdir(uploadsDir, { recursive: true })
    await writeFile(join(uploadsDir, filename), webpBuffer)
    return NextResponse.json({
      url: `/uploads/brinquedos/${filename}`,
      originalSize: raw.length,
      finalSize: webpBuffer.length,
      storage: 'local',
    })
  }

  /* ── Nenhum storage configurado em produção ── */
  console.error('[upload] Nenhum storage configurado. BLOB_READ_WRITE_TOKEN ausente.')
  return NextResponse.json(
    {
      error: 'Storage de imagens não configurado no servidor. Configure o Vercel Blob no painel do Vercel (Storage → Connect → Blob).',
    },
    { status: 500 }
  )
}
