import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brinquedos } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// MIGRAÇÃO ÚNICA (self-hosted): move imagens base64 que estão no banco (Neon)
// para arquivos no volume do Portainer (public/uploads/brinquedos) e grava só o
// caminho no banco. Reduz drasticamente o tamanho/egress do Neon.
//
// Uso (uma vez):
//   curl -X POST "https://web.twixeventos.com/api/admin/migrar-imagens?secret=SEU_CRON_SECRET"
//
// Idempotente: valores que já são caminho (/uploads/...) são ignorados.

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'brinquedos')

function extFromDataUrl(d: string): string {
  const mime = d.slice(5, d.indexOf(';')).toLowerCase() // depois de "data:"
  if (mime.includes('png')) return 'png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('avif')) return 'avif'
  if (mime.includes('svg')) return 'svg'
  return 'webp'
}

async function salvarDataUrl(d: string): Promise<string> {
  const comma = d.indexOf(',')
  const base64 = d.slice(comma + 1)
  const filename = `${randomUUID()}.${extFromDataUrl(d)}`
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(base64, 'base64'))
  return `/uploads/brinquedos/${filename}`
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const secret = request.headers.get('x-migrate-secret') ?? url.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
    const rows = await db.select().from(brinquedos)

    let brinquedosMigrados = 0
    let arquivosGerados = 0

    for (const b of rows) {
      let changed = false

      let novaFotoDestaque = b.fotoDestaque
      if (typeof b.fotoDestaque === 'string' && b.fotoDestaque.startsWith('data:')) {
        novaFotoDestaque = await salvarDataUrl(b.fotoDestaque)
        arquivosGerados++
        changed = true
      }

      let novasFotos = b.fotos
      if (Array.isArray(b.fotos) && b.fotos.some(f => typeof f === 'string' && f.startsWith('data:'))) {
        const out: string[] = []
        for (const f of b.fotos) {
          if (typeof f === 'string' && f.startsWith('data:')) {
            out.push(await salvarDataUrl(f))
            arquivosGerados++
          } else {
            out.push(f)
          }
        }
        novasFotos = out
        changed = true
      }

      if (changed) {
        await db.update(brinquedos)
          .set({ fotoDestaque: novaFotoDestaque, fotos: novasFotos })
          .where(eq(brinquedos.id, b.id))
        brinquedosMigrados++
      }
    }

    return NextResponse.json({
      ok: true,
      totalBrinquedos: rows.length,
      brinquedosMigrados,
      arquivosGerados,
      restantesBase64: 0,
    })
  } catch (error) {
    console.error('[migrar-imagens]', error)
    const msg = error instanceof Error ? error.message : 'Erro na migração'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
