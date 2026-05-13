import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { addInteracao } from '@/lib/db/queries/leads'
import { interacaoSchema } from '@/lib/validations/lead'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = interacaoSchema.parse(body)
    const interacao = await addInteracao(data)
    return NextResponse.json(interacao, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/interacoes]', error)
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }
}
