import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getHistoricoCashbackGlobal, getResumosCashbackGlobal } from '@/lib/db/queries/area-cliente'
import { CashbackHistoricoClient } from '@/components/admin/CashbackHistoricoClient'

export const metadata: Metadata = { title: 'Cashback — Histórico' }
export const dynamic = 'force-dynamic'

async function Content() {
  const [rawTxs, resumo] = await Promise.all([
    getHistoricoCashbackGlobal({ limit: 300 }),
    getResumosCashbackGlobal(),
  ])

  const transacoes = (rawTxs.rows as {
    id: string
    tipo: string
    valor: string
    percentual_aplicado: string | null
    descricao: string | null
    evento_id: string | null
    created_at: string
    cliente_id: string
    cliente_nome: string
    cliente_telefone: string
    cashback_saldo: string
    data_evento: string | null
    evento_valor_total: string | null
  }[]).map(r => ({
    id:              r.id,
    tipo:            r.tipo,
    valor:           parseFloat(r.valor ?? '0'),
    percentual:      r.percentual_aplicado ? parseFloat(r.percentual_aplicado) : null,
    descricao:       r.descricao ?? '',
    eventoId:        r.evento_id,
    createdAt:       r.created_at,
    clienteId:       r.cliente_id,
    clienteNome:     r.cliente_nome,
    clienteTelefone: r.cliente_telefone,
    clienteSaldo:    parseFloat(r.cashback_saldo ?? '0'),
    dataEvento:      r.data_evento,
    eventoValor:     r.evento_valor_total ? parseFloat(r.evento_valor_total) : null,
  }))

  return (
    <CashbackHistoricoClient
      transacoes={transacoes}
      resumo={{
        totalCreditado:    parseFloat(String(resumo.total_creditado   ?? '0')),
        totalResgatado:    parseFloat(String(resumo.total_resgatado   ?? '0')),
        totalExpirado:     parseFloat(String(resumo.total_expirado    ?? '0')),
        qtdCreditos:       Number(resumo.qtd_creditos   ?? 0),
        qtdResgates:       Number(resumo.qtd_resgates   ?? 0),
        clientesComSaldo:  Number(resumo.clientes_com_saldo ?? 0),
        saldoEmCirculacao: parseFloat(String(resumo.saldo_em_circulacao ?? '0')),
      }}
    />
  )
}

export default function CashbackPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="h-8 w-56 bg-brand-surface-2 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
      </div>
    }>
      <Content />
    </Suspense>
  )
}
