import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getBrinquedoById, updateBrinquedo, deleteBrinquedo } from '@/lib/db/queries/brinquedos'
import { brinquedoSchema } from '@/lib/validations/toy'
import { slugify } from '@/lib/utils'
import { notificarBuscadores } from '@/lib/seo/notificar'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const brinquedo = await getBrinquedoById(id)
  if (!brinquedo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(brinquedo)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const body = await request.json()
    if (body.slug) {
      body.slug = slugify(body.slug)
    }
    const data = brinquedoSchema.partial().parse(body)
    const updated = await updateBrinquedo(id, data)

    // Notifica buscadores se o brinquedo está ativo (público)
    if (updated?.ativo && updated?.slug) {
      await notificarBuscadores([`/brinquedos/${updated.slug}`, '/brinquedos'])
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/admin/brinquedos/id]', error)
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const errs = (error as any).errors as { path: string[]; message: string }[]
      const msg = errs.map(e => `${e.path.join('.')}: ${e.message}`).join(' | ')
      return NextResponse.json({ message: msg }, { status: 400 })
    }
    const msg = error instanceof Error ? error.message : 'Erro ao atualizar'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteBrinquedo(id)
  return NextResponse.json({ success: true })
}
