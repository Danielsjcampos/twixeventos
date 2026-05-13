import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getAllBrinquedosAdmin, createBrinquedo } from '@/lib/db/queries/brinquedos'
import { brinquedoSchema } from '@/lib/validations/toy'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const brinquedos = await getAllBrinquedosAdmin()
  return NextResponse.json(brinquedos)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = brinquedoSchema.parse(body)
    const brinquedo = await createBrinquedo(data)
    return NextResponse.json(brinquedo, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/brinquedos]', error)
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }
}
