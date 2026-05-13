import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { addDataComecorativa, updateDataComecorativa, deleteDataComecorativa } from '@/lib/db/queries/clientes'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const body = await request.json()
    const data = await addDataComecorativa({ ...body, clienteId: id })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao adicionar data' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: dataId } = await params
  try {
    const body = await request.json()
    const updated = await updateDataComecorativa(dataId, body)
    return NextResponse.json(updated)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteDataComecorativa(id)
  return NextResponse.json({ ok: true })
}
