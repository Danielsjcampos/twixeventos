import { NextRequest, NextResponse } from 'next/server'
import {
  getClientePorCodigo,
  getReservasCliente,
  getHistoricoCashback,
} from '@/lib/db/queries/area-cliente'
import { getConfig } from '@/lib/db/queries/configuracoes'

// GET /api/cliente/[codigo] — dados completos do portal do cliente
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params
  if (!codigo) return NextResponse.json({ error: 'Código inválido' }, { status: 400 })

  const cliente = await getClientePorCodigo(codigo.toUpperCase())
  if (!cliente) return NextResponse.json({ error: 'Acesso negado' }, { status: 404 })

  const [reservas, historicoCashback, cashbackAtivo, cashbackPct, cashbackMinResgate] = await Promise.all([
    getReservasCliente(cliente.id),
    getHistoricoCashback(cliente.id),
    getConfig('cashback_ativo'),
    getConfig('cashback_percentual'),
    getConfig('cashback_min_resgate'),
  ])

  return NextResponse.json({
    cliente: {
      nome:           cliente.nome,
      primeiroNome:   cliente.nome.split(' ')[0],
      telefone:       cliente.telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3'),
      email:          cliente.email,
      codigoAcesso:   cliente.codigoAcesso,
      cashbackSaldo:  cliente.cashbackSaldo,
      cashbackTotal:  cliente.cashbackTotal,
      totalEventos:   cliente.totalEventos,
      membroDesde:    cliente.createdAt,
    },
    reservas,
    historicoCashback,
    config: {
      cashbackAtivo:     cashbackAtivo === 'true',
      cashbackPct:       parseFloat(cashbackPct ?? '5'),
      cashbackMinResgate: parseFloat(cashbackMinResgate ?? '20'),
    },
  })
}
