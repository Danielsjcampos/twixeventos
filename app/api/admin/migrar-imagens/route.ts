import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { brinquedos, eventos, pagamentos, lancamentosFinanceiros } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// MIGRAÇÃO ÚNICA (self-hosted): move TODAS as imagens/arquivos base64 do banco
// (Neon) para arquivos no volume do Portainer (public/uploads/...) e grava só o
// caminho no banco. Processa UMA linha por vez para não estourar a memória.
//
//   curl -X POST -H "x-migrate-secret: SEU_CRON_SECRET" \
//        https://web.twixeventos.com/api/admin/migrar-imagens
//
// Idempotente: valores que já são caminho (/uploads/...) são ignorados.

const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads')

function extFromDataUrl(d: string): string {
  const mime = d.slice(5, d.indexOf(';')).toLowerCase()
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
    // 1) brinquedos — busca só os IDs, processa um por um (memória mínima)
    const bIds = await db.select({ id: brinquedos.id }).from(brinquedos)
    for (const { id } of bIds) {
      const [b] = await db.select({
        id: brinquedos.id, fotoDestaque: brinquedos.fotoDestaque, fotos: brinquedos.fotos,
      }).from(brinquedos).where(eq(brinquedos.id, id)).limit(1)
      if (!b) continue

      let changed = false
      let fotoDestaque = b.fotoDestaque
      if (isDataUrl(b.fotoDestaque)) { fotoDestaque = await salvar(b.fotoDestaque, 'brinquedos'); stats.arquivos++; changed = true }
      let fotos = b.fotos
      if (Array.isArray(b.fotos) && b.fotos.some(isDataUrl)) {
        const out: string[] = []
        for (const f of b.fotos) { if (isDataUrl(f)) { out.push(await salvar(f, 'brinquedos')); stats.arquivos++ } else out.push(f) }
        fotos = out; changed = true
      }
      if (changed) {
        await db.update(brinquedos).set({ fotoDestaque, fotos }).where(eq(brinquedos.id, id))
        stats.brinquedos++
      }
    }

    // 2) eventos.fotos_montagem
    const eIds = await db.select({ id: eventos.id }).from(eventos)
    for (const { id } of eIds) {
      const [e] = await db.select({ id: eventos.id, fotosMontagem: eventos.fotosMontagem })
        .from(eventos).where(eq(eventos.id, id)).limit(1)
      if (e && Array.isArray(e.fotosMontagem) && e.fotosMontagem.some(isDataUrl)) {
        const out: string[] = []
        for (const f of e.fotosMontagem) { if (isDataUrl(f)) { out.push(await salvar(f, 'eventos')); stats.arquivos++ } else out.push(f) }
        await db.update(eventos).set({ fotosMontagem: out }).where(eq(eventos.id, id))
        stats.eventos++
      }
    }

    // 3) pagamentos.comprovante
    const pIds = await db.select({ id: pagamentos.id }).from(pagamentos)
    for (const { id } of pIds) {
      const [p] = await db.select({ id: pagamentos.id, comprovante: pagamentos.comprovante })
        .from(pagamentos).where(eq(pagamentos.id, id)).limit(1)
      if (p && isDataUrl(p.comprovante)) {
        const novo = await salvar(p.comprovante, 'comprovantes'); stats.arquivos++
        await db.update(pagamentos).set({ comprovante: novo }).where(eq(pagamentos.id, id))
        stats.pagamentos++
      }
    }

    // 4) lancamentos_financeiros.comprovante
    const lIds = await db.select({ id: lancamentosFinanceiros.id }).from(lancamentosFinanceiros)
    for (const { id } of lIds) {
      const [l] = await db.select({ id: lancamentosFinanceiros.id, comprovante: lancamentosFinanceiros.comprovante })
        .from(lancamentosFinanceiros).where(eq(lancamentosFinanceiros.id, id)).limit(1)
      if (l && isDataUrl(l.comprovante)) {
        const novo = await salvar(l.comprovante, 'comprovantes'); stats.arquivos++
        await db.update(lancamentosFinanceiros).set({ comprovante: novo }).where(eq(lancamentosFinanceiros.id, id))
        stats.lancamentos++
      }
    }

    return NextResponse.json({ ok: true, ...stats })
  } catch (error) {
    console.error('[migrar-imagens]', error)
    const msg = error instanceof Error ? error.message : 'Erro na migração'
    return NextResponse.json({ error: msg, parcial: stats }, { status: 500 })
  }
}
