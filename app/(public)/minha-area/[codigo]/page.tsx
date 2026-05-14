import { notFound } from 'next/navigation'
import { getClientePorCodigo, getReservasCliente, getHistoricoCashback } from '@/lib/db/queries/area-cliente'
import { getConfig } from '@/lib/db/queries/configuracoes'
import { AreaClienteDashboard } from '@/components/public/AreaClienteDashboard'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ codigo: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params
  const cliente = await getClientePorCodigo(codigo.toUpperCase())
  if (!cliente) return { title: 'Área do Cliente | Twix Eventos' }
  return { title: `Olá, ${cliente.nome.split(' ')[0]}! | Twix Eventos` }
}

export default async function MinhaAreaCodigoPage({ params }: Props) {
  const { codigo } = await params
  const cliente = await getClientePorCodigo(codigo.toUpperCase())
  if (!cliente) notFound()

  const [reservas, historicoCashback, cashbackAtivo, cashbackPct, cashbackMin] = await Promise.all([
    getReservasCliente(cliente.id),
    getHistoricoCashback(cliente.id),
    getConfig('cashback_ativo'),
    getConfig('cashback_percentual'),
    getConfig('cashback_min_resgate'),
  ])

  return (
    <AreaClienteDashboard
      cliente={{
        nome:          cliente.nome,
        primeiroNome:  cliente.nome.split(' ')[0],
        telefone:      cliente.telefone,
        email:         cliente.email ?? undefined,
        codigoAcesso:  cliente.codigoAcesso!,
        cashbackSaldo: parseFloat(String(cliente.cashbackSaldo ?? '0')),
        cashbackTotal: parseFloat(String(cliente.cashbackTotal ?? '0')),
        totalEventos:  cliente.totalEventos,
        membroDesde:   String(cliente.createdAt),
      }}
      reservas={reservas}
      historicoCashback={historicoCashback.map(h => ({
        ...h,
        valor:              parseFloat(String(h.valor ?? '0')),
        percentualAplicado: h.percentualAplicado ? parseFloat(String(h.percentualAplicado)) : null,
        createdAt:          String(h.createdAt),
      }))}
      config={{
        cashbackAtivo:  cashbackAtivo === 'true',
        cashbackPct:    parseFloat(cashbackPct ?? '5'),
        cashbackMin:    parseFloat(cashbackMin ?? '20'),
      }}
    />
  )
}
