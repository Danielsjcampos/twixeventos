import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const cloudinaryOk =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
  !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.includes('seu-') &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_API_SECRET.includes('seu-')

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  /* ── Cloudinary (when configured) ── */
  if (cloudinaryOk) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!
    const apiSecret = process.env.CLOUDINARY_API_SECRET!
    const folder = 'twix-eventos/brinquedos'
    const timestamp = Math.round(Date.now() / 1000).toString()
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha256').update(toSign).digest('hex')

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

  /* ── Local fallback (dev / Cloudinary not configured) ── */
  const ext = file.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'jpg')
  const filename = `${crypto.randomUUID()}.${ext}`
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'brinquedos')
  await mkdir(uploadsDir, { recursive: true })
  await writeFile(path.join(uploadsDir, filename), buffer)
  return NextResponse.json({ url: `/uploads/brinquedos/${filename}` })
}
