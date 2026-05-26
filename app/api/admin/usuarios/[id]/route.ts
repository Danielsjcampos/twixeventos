import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { updateUsuario, deleteUsuario } from '@/lib/db/queries/usuarios'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const [updated] = await updateUsuario(id, body)
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await deleteUsuario(id)
  return new NextResponse(null, { status: 204 })
}
