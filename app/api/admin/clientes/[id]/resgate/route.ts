import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { clientes, cashbackTransacoes } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { valor, eventoId, descricao } = body as { valor: number; eventoId?: string; descricao?: string }

  if (!valor || valor <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  // Buscar saldo atual
  const [cliente] = await db
    .select({ cashbackSaldo: clientes.cashbackSaldo, nome: clientes.nome })
    .from(clientes)
    .where(eq(clientes.id, id))

  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const saldoAtual = parseFloat(String(cliente.cashbackSaldo ?? '0'))

  if (valor > saldoAtual) {
    return NextResponse.json({ error: `Saldo insuficiente. Disponível: R$ ${saldoAtual.toFixed(2)}` }, { status: 400 })
  }

  const valorNeg = (-Math.abs(valor)).toFixed(2)
  const descricaoFinal = descricao || `Resgate de cashback — R$ ${valor.toFixed(2)}`

  // Inserir transação de resgate
  await db.insert(cashbackTransacoes).values({
    clienteId: id,
    eventoId: eventoId || null,
    tipo: 'resgate',
    valor: valorNeg,
    descricao: descricaoFinal,
  })

  // Debitar do saldo
  await db.execute(sql`
    UPDATE clientes
    SET cashback_saldo = cashback_saldo - ${valor},
        updated_at = NOW()
    WHERE id = ${id}
  `)

  const novoSaldo = parseFloat((saldoAtual - valor).toFixed(2))

  return NextResponse.json({
    ok: true,
    novoSaldo,
    valorResgatado: valor,
    descricao: descricaoFinal,
  })
}
