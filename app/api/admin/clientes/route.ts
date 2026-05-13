import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getClientes, createCliente } from '@/lib/db/queries/clientes'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? undefined
  const data = await getClientes(search)
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const cliente = await createCliente(body)
    return NextResponse.json(cliente, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
