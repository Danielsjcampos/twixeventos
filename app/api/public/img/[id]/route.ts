import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brinquedos } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { readFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

// Placeholder SVG returned when no image exists
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#1e293b"/>
  <rect x="150" y="100" width="100" height="100" rx="8" fill="#334155"/>
  <path d="M175 160 L190 145 L205 160 L215 148 L230 160" stroke="#475569" stroke-width="2" fill="none"/>
  <circle cx="185" cy="135" r="7" fill="#475569"/>
</svg>`

const CACHE = 'public, max-age=86400, stale-while-revalidate=604800'

function placeholder() {
  return new Response(PLACEHOLDER_SVG, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' },
  })
}

function mimeFromExt(p: string): string {
  const ext = p.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'webp': return 'image/webp'
    case 'png':  return 'image/png'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'gif':  return 'image/gif'
    case 'svg':  return 'image/svg+xml'
    case 'avif': return 'image/avif'
    default:     return 'image/webp'
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    // Busca só 1 imagem (egress mínimo): fotoDestaque ou a 1ª de fotos[]
    const [row] = await db
      .select({
        img: sql<string | null>`coalesce(${brinquedos.fotoDestaque}, ${brinquedos.fotos}[1])`,
      })
      .from(brinquedos)
      .where(eq(brinquedos.id, id))
      .limit(1)

    const value = row?.img ?? null
    if (!value) return placeholder()

    // 1) Imagens antigas: data URL base64 (armazenadas no banco)
    if (value.startsWith('data:')) {
      const commaIdx = value.indexOf(',')
      const header = value.slice(0, commaIdx)
      const base64 = value.slice(commaIdx + 1)
      const mime = header.match(/data:([^;]+)/)?.[1] ?? 'image/webp'
      return new Response(Buffer.from(base64, 'base64'), {
        headers: { 'Content-Type': mime, 'Cache-Control': CACHE, 'X-Content-Type-Options': 'nosniff' },
      })
    }

    // 2) Imagens novas (self-hosted): arquivo na pasta public/uploads
    if (value.startsWith('/uploads/')) {
      const safe = path.normalize(value).replace(/^(\.\.[/\\])+/, '')
      const filePath = path.join(process.cwd(), 'public', safe)
      try {
        const buf = await readFile(filePath)
        return new Response(new Uint8Array(buf), {
          headers: { 'Content-Type': mimeFromExt(safe), 'Cache-Control': CACHE, 'X-Content-Type-Options': 'nosniff' },
        })
      } catch {
        return placeholder()
      }
    }

    // 3) URLs externas (ex.: Vercel Blob legado) → redireciona
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return NextResponse.redirect(value, 307)
    }

    return placeholder()
  } catch {
    return placeholder()
  }
}
