import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateMonitor, deleteMonitor } from '@/lib/db/queries/monitores'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const updated = await updateMonitor(id, body)
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await deleteMonitor(id)
  return NextResponse.json({ success: true })
}
