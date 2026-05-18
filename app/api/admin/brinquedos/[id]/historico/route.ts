import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getBrinquedoHistorico } from '@/lib/db/queries/brinquedos'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const data = await getBrinquedoHistorico(id)
  return NextResponse.json(data)
}
