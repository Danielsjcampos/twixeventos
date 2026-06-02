import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brinquedos, eventos, pagamentos, lancamentosFinanceiros } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// MIGRAÇÃO ÚNICA (self-hosted): move TODAS as imagens/arquivos base64 do banco
// (Neon) para arquivos no volume do Portainer (public/uploads/...) e grava só o
// caminho no banco. Reduz drasticamente o tamanho/egress do Neon.
//
//   curl -X POST -H "x-migrate-secret: SEU_CRON_SECRET" \
//        https://web.twixeventos.com/api/admin/migrar-imagens
//
// Idempotente: valores que já são caminho (/uploads/...) são ignorados.

const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads')

function extFromDataUrl(d: string): string {
  const mime = d.slice(5, d.indexOf(';')).toLowerCase() // depois de "data:"
  if (mime.includes('png')) return 'png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('avif')) return 'avif'
  if (mime.includes('svg')) return 'svg'
  if (mime.includes('pdf')) return 'pdf'
  return 'webp'
}

const isDataUrl = (v: unknown): v is string => typeof v === 'string' && v.startsWith('data:')

async function salvar(d: string, subdir: string): Promise<string> {
  const dir = path.join(UPLOADS_ROOT, subdir)
  await mkdir(dir, { recursive: true })
  const base64 = d.slice(d.indexOf(',') + 1)
  const filename = `${randomUUID()}.${extFromDataUrl(d)}`
  await writeFile(path.join(dir, filename), Buffer.from(base64, 'base64'))
  return `/uploads/${subdir}/${filename}`
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const secret = request.headers.get('x-migrate-secret') ?? url.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats: Record<string, number> = {
    brinquedos: 0, eventos: 0, pagamentos: 0, lancamentos: 0, arquivos: 0,
  }

  try {
    // 1) brinquedos: fotoDestaque + fotos[]
    for (const b of await db.select().from(brinquedos)) {
      let changed = false
      let fotoDestaque = b.fotoDestaque
      if (isDataUrl(b.fotoDestaque)) { fotoDestaque = await salvar(b.fotoDestaque, 'brinquedos'); stats.arquivos++; changed = true }
      let fotos = b.fotos
      if (Array.isArray(b.fotos) && b.fotos.some(isDataUrl)) {
        fotos = []
        for (const f of b.fotos) { if (isDataUrl(f)) { fotos.push(await salvar(f, 'brinquedos')); stats.arquivos++ } else fotos.push(f) }
        changed = true
      }
      if (changed) { await db.update(brinquedos).set({ fotoDestaque, fotos }).where(eq(brinquedos.id, b.id)); stats.brinquedos++ }
    }

    // 2) eventos: fotos_montagem[]
    for (const e of await db.select().from(eventos)) {
      if (Array.isArray(e.fotosMontagem) && e.fotosMontagem.some(isDataUrl)) {
        const out: string[] = []
        for (const f of e.fotosMontagem) { if (isDataUrl(f)) { out.push(await salvar(f, 'eventos')); stats.arquivos++ } else out.push(f) }
        await db.update(eventos).set({ fotosMontagem: out }).where(eq(eventos.id, e.id)); stats.eventos++
      }
    }

    // 3) pagamentos: comprovante
    for (const p of await db.select().from(pagamentos)) {
      if (isDataUrl(p.comprovante)) {
        const novo = await salvar(p.comprovante, 'comprovantes'); stats.arquivos++
        await db.update(pagamentos).set({ comprovante: novo }).where(eq(pagamentos.id, p.id)); stats.pagamentos++
      }
    }

    // 4) lancamentos_financeiros: comprovante
    for (const l of await db.select().from(lancamentosFinanceiros)) {
      if (isDataUrl(l.comprovante)) {
        const novo = await salvar(l.comprovante, 'comprovantes'); stats.arquivos++
        await db.update(lancamentosFinanceiros).set({ comprovante: novo }).where(eq(lancamentosFinanceiros.id, l.id)); stats.lancamentos++
      }
    }

    return NextResponse.json({ ok: true, ...stats })
  } catch (error) {
    console.error('[migrar-imagens]', error)
    const msg = error instanceof Error ? error.message : 'Erro na migração'
    return NextResponse.json({ error: msg, parcial: stats }, { status: 500 })
  }
}
