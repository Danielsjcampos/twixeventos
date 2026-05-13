import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import crypto from 'crypto'

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

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

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
    cldForm.append('file', new Blob([buffer], { type: file.type }), file.name)
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
    return NextResponse.json({ url: data.secure_url as string })
  }

  /* ── 2. Vercel Blob (production default) ── */
  if (hasVercelBlob()) {
    const { put } = await import('@vercel/blob')
    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `twix-eventos/${crypto.randomUUID()}.${ext}`
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: file.type || 'image/jpeg',
    })
    return NextResponse.json({ url: blob.url })
  }

  /* ── 3. Local filesystem (dev only) ── */
  if (process.env.NODE_ENV !== 'production') {
    const { writeFile, mkdir } = await import('fs/promises')
    const { join } = await import('path')
    const ext = file.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'jpg')
    const filename = `${crypto.randomUUID()}.${ext}`
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'brinquedos')
    await mkdir(uploadsDir, { recursive: true })
    await writeFile(join(uploadsDir, filename), buffer)
    return NextResponse.json({ url: `/uploads/brinquedos/${filename}` })
  }

  /* ── Nenhum storage configurado em produção ── */
  return NextResponse.json(
    { error: 'Storage não configurado. Adicione BLOB_READ_WRITE_TOKEN nas variáveis de ambiente do Vercel.' },
    { status: 500 }
  )
}
