'use client'

import { useEffect, useState } from 'react'

interface Locacao {
  id: string
  nome_cliente: string
  telefone_cliente: string
  data_evento: string
  valor_total: string | null
  status: string
}

interface TopCliente {
  nome_cliente: string
  telefone_cliente: string
  total: number
}

interface Historico {
  locacoes: Locacao[]
  topClientes: TopCliente[]
}

const STATUS_LABEL: Record<string, string> = {
  orcamento:  'Orçamento',
  confirmado: 'Confirmado',
  realizado:  'Realizado',
  cancelado:  'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  orcamento:  'bg-amber-500/15 text-amber-400',
  confirmado: 'bg-blue-500/15 text-blue-400',
  realizado:  'bg-green-500/15 text-green-400',
  cancelado:  'bg-red-500/15 text-red-400',
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function formatMoney(value: string | null) {
  if (!value) return '—'
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getInitial(nome: string) {
  return nome.trim().charAt(0).toUpperCase()
}

export function BrinquedoHistorico({ brinquedoId }: { brinquedoId: string }) {
  const [data, setData] = useState<Historico | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/brinquedos/${brinquedoId}/historico`)
      .then((r) => {
        if (!r.ok) throw new Error('Erro ao carregar histórico')
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [brinquedoId])

  if (loading) {
    return (
      <div className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-6">
        <p className="text-sm text-brand-muted animate-pulse">Carregando histórico...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-red-500/30 bg-brand-surface p-6">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  const hasData = data && (data.locacoes.length > 0 || data.topClientes.length > 0)

  if (!hasData) {
    return (
      <div className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-8 text-center">
        <p className="text-brand-text font-semibold text-sm">Nenhuma locacao registrada</p>
        <p className="text-brand-muted text-xs mt-1">Este brinquedo ainda nao foi contratado em nenhum evento.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 flex flex-col gap-6">

      {/* Ultimas Locacoes */}
      {data.locacoes.length > 0 && (
        <div className="rounded-2xl border border-brand-border bg-brand-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border">
            <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
              Ultimas Locacoes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-brand-muted">Data</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-brand-muted">Cliente</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-brand-muted">Telefone</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-brand-muted">Valor Total</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-brand-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.locacoes.map((loc) => (
                  <tr key={loc.id} className="border-b border-brand-border/50 last:border-0 hover:bg-brand-surface-2/50 transition-colors">
                    <td className="px-5 py-3 text-brand-text font-medium tabular-nums">
                      {formatDate(loc.data_evento)}
                    </td>
                    <td className="px-5 py-3 text-brand-text">{loc.nome_cliente}</td>
                    <td className="px-5 py-3 text-brand-muted">{loc.telefone_cliente}</td>
                    <td className="px-5 py-3 text-brand-text tabular-nums">{formatMoney(loc.valor_total)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[loc.status] ?? 'bg-brand-surface-2 text-brand-muted'}`}>
                        {STATUS_LABEL[loc.status] ?? loc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clientes Frequentes */}
      {data.topClientes.length > 0 && (
        <div className="rounded-2xl border border-brand-border bg-brand-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border">
            <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
              Clientes Frequentes
            </h3>
          </div>
          <ul className="divide-y divide-brand-border/50">
            {data.topClientes.map((c, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-3">
                <div className="w-9 h-9 rounded-full bg-brand-accent/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-accent text-sm font-bold">{getInitial(c.nome_cliente)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-text truncate">{c.nome_cliente}</p>
                  <p className="text-xs text-brand-muted">{c.telefone_cliente}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-brand-text">{c.total}</p>
                  <p className="text-[11px] text-brand-muted">{c.total === 1 ? 'locacao' : 'locacoes'}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  )
}
