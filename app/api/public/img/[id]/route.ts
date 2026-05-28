import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brinquedos } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Placeholder SVG returned when no image exists
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#1e293b"/>
  <rect x="150" y="100" width="100" height="100" rx="8" fill="#334155"/>
  <path d="M175 160 L190 145 L205 160 L215 148 L230 160" stroke="#475569" stroke-width="2" fill="none"/>
  <circle cx="185" cy="135" r="7" fill="#475569"/>
</svg>`

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const [row] = await db
      .select({ fotoDestaque: brinquedos.fotoDestaque, fotos: brinquedos.fotos })
      .from(brinquedos)
      .where(eq(brinquedos.id, id))
      .limit(1)

    // Pick best available image: fotoDestaque first, then first in fotos[]
    const dataUrl = row?.fotoDestaque ?? row?.fotos?.[0] ?? null

    if (!dataUrl || !dataUrl.startsWith('data:')) {
      // Return SVG placeholder
      return new Response(PLACEHOLDER_SVG, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=60',
        },
      })
    }

    // Parse "data:image/webp;base64,<data>"
    const commaIdx = dataUrl.indexOf(',')
    const header = dataUrl.slice(0, commaIdx)
    const base64 = dataUrl.slice(commaIdx + 1)
    const mimeMatch = header.match(/data:([^;]+)/)
    const mime = mimeMatch?.[1] ?? 'image/webp'
    const buffer = Buffer.from(base64, 'base64')

    return new Response(buffer, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response(PLACEHOLDER_SVG, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' },
    })
  }
}
