import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import crypto from 'crypto'

/* ── Detecta storage configurado ── */
function hasVercelBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const contentType = req.headers.get('content-type') ?? ''

  /* ────────────────────────────────────────────────
   * MODO 1 — Upload direto cliente → Vercel Blob
   * Cliente usa `upload()` de @vercel/blob/client.
   * Esta rota só gera o token e recebe a notificação.
   * Bypassa o limite de 4.5MB de body da serverless.
   * ──────────────────────────────────────────────── */
  if (contentType.includes('application/json')) {
    if (!hasVercelBlob()) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN não configurado no servidor.' },
        { status: 500 },
      )
    }

    const body = (await req.json()) as HandleUploadBody

    try {
      const jsonResponse = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async (_pathname) => ({
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/svg+xml',
          ],
          maximumSizeInBytes: 20 * 1024 * 1024, // 20 MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({}),
        }),
        onUploadCompleted: async ({ blob }) => {
          console.info('[upload] Blob criado:', blob.url, blob.contentType)
        },
      })
      return NextResponse.json(jsonResponse)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[upload] handleUpload erro:', msg)
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  }

  /* ────────────────────────────────────────────────
   * MODO 2 — Upload via FormData (DEV / fallback)
   * Usado quando não há Vercel Blob (desenvolvimento).
   * Salva em public/uploads/brinquedos/
   * ──────────────────────────────────────────────── */
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

  const MAX_BYTES = 20 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo: 20 MB.' }, { status: 400 })
  }

  const ext = file.type === 'image/svg+xml' ? 'svg'
            : file.type === 'image/gif'     ? 'gif'
            : 'webp'
  const filename = `${crypto.randomUUID()}.${ext}`
  const raw = Buffer.from(await file.arrayBuffer())

  // Apenas dev — em produção, este caminho não é usado (cliente envia via JSON)
  if (process.env.NODE_ENV !== 'production') {
    const { writeFile, mkdir } = await import('fs/promises')
    const { join } = await import('path')
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'brinquedos')
    await mkdir(uploadsDir, { recursive: true })
    await writeFile(join(uploadsDir, filename), raw)
    return NextResponse.json({
      url: `/uploads/brinquedos/${filename}`,
      originalSize: raw.length,
      finalSize: raw.length,
      storage: 'local',
    })
  }

  return NextResponse.json(
    { error: 'Em produção, use upload direto via @vercel/blob/client.' },
    { status: 500 },
  )
}
