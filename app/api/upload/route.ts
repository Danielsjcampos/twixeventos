import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

/** Max upload size: 10 MB */
const MAX_SIZE_BYTES = 10 * 1024 * 1024

/**
 * POST /api/upload
 *
 * Accepts multipart/form-data with a "file" field (WebP binary from canvas).
 * Writes the file to public/uploads/ and returns the relative public URL.
 *
 * In Docker the directory is persisted via the twix_uploads named volume
 * (mapped to /app/public/uploads inside the container).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida — envie multipart/form-data.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Campo "file" ausente ou inválido.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Arquivo excede o limite de 10 MB.' }, { status: 413 })
  }

  // Determine file extension (default to .webp since client converts before uploading)
  const mimeToExt: Record<string, string> = {
    'image/webp': '.webp',
    'image/jpeg': '.jpg',
    'image/png':  '.png',
  }
  const ext = mimeToExt[file.type] ?? '.webp'

  const filename  = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')

  try {
    await mkdir(uploadDir, { recursive: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno: não foi possível criar o diretório de uploads.' }, { status: 500 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(uploadDir, filename), buffer)
  } catch (err) {
    console.error('[upload] writeFile failed:', err)
    return NextResponse.json({ error: 'Erro interno ao salvar o arquivo.' }, { status: 500 })
  }

  // Return the relative URL so it can be served by Next.js static file serving
  const url = `/uploads/${filename}`
  console.info(`[upload] ✅ Salvo: ${url} (${Math.round(file.size / 1024)} KB)`)

  return NextResponse.json({ url }, { status: 201 })
}
