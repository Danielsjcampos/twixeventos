import { readFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Serve os arquivos enviados (volume Docker em public/uploads) via rota,
// porque o Next standalone NÃO serve arquivos gravados em runtime na pasta
// public (usa um manifesto fixo do build). Esta rota lê do disco a cada request.
const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads')

function mimeFromExt(p: string): string {
  switch (p.split('.').pop()?.toLowerCase()) {
    case 'webp': return 'image/webp'
    case 'png':  return 'image/png'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'gif':  return 'image/gif'
    case 'svg':  return 'image/svg+xml'
    case 'avif': return 'image/avif'
    case 'pdf':  return 'application/pdf'
    default:     return 'application/octet-stream'
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params
  // Junta e normaliza, bloqueando path traversal (../)
  const rel = path.normalize(parts.join('/')).replace(/^(\.\.(\/|\\|$))+/, '')
  const filePath = path.join(UPLOADS_ROOT, rel)
  if (!filePath.startsWith(UPLOADS_ROOT)) {
    return new Response('Forbidden', { status: 403 })
  }
  try {
    const buf = await readFile(filePath)
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': mimeFromExt(rel),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
