import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { darGirosBonus, getGirosDisponiveis, getGirosBonusCliente } from '@/lib/db/queries/area-cliente'
import { db } from '@/lib/db'
import { clientes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

interface Params { params: Promise<{ id: string }> }

// GET — retorna giros disponíveis e bonus atual
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [girosDisponiveis, girosBonus] = await Promise.all([
    getGirosDisponiveis(id),
    getGirosBonusCliente(id),
  ])
  return NextResponse.json({ girosDisponiveis, girosBonus })
}

// POST — dá N giros extras ao cliente
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { quantidade } = await req.json() as { quantidade: number }

  if (!quantidade || quantidade < 1 || quantidade > 50) {
    return NextResponse.json({ error: 'Quantidade inválida (1–50)' }, { status: 400 })
  }

  const [cliente] = await db
    .select({ id: clientes.id, nome: clientes.nome })
    .from(clientes)
    .where(eq(clientes.id, id))

  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  await darGirosBonus(id, quantidade)

  const [novosGiros, novoBonus] = await Promise.all([
    getGirosDisponiveis(id),
    getGirosBonusCliente(id),
  ])

  return NextResponse.json({
    ok: true,
    girosDisponiveis: novosGiros,
    girosBonus: novoBonus,
    quantidade,
  })
}
