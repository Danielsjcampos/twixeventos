import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getBrinquedoById, updateBrinquedo, deleteBrinquedo } from '@/lib/db/queries/brinquedos'

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
    const updated = await updateBrinquedo(id, body)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/admin/brinquedos/id]', error)
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
