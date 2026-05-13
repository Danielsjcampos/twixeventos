import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getLancamentosMes, createLancamento } from '@/lib/db/queries/lancamentos'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const mes = Number(searchParams.get('mes') ?? new Date().getMonth() + 1)
  const ano = Number(searchParams.get('ano') ?? new Date().getFullYear())
  const data = await getLancamentosMes(mes, ano)
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const l = await createLancamento(body)
    return NextResponse.json(l, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 })
  }
}
