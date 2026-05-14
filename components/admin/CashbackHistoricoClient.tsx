'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Coins, TrendingUp, TrendingDown, Wallet, Users, Search, X, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Transacao {
  id: string
  tipo: string
  valor: number
  percentual: number | null
  descricao: string
  eventoId: string | null
  createdAt: string
  clienteId: string
  clienteNome: string
  clienteTelefone: string
  clienteSaldo: number
  dataEvento: string | null
  eventoValor: number | null
}

interface Resumo {
  totalCreditado: number
  totalResgatado: number
  totalExpirado: number
  qtdCreditos: number
  qtdResgates: number
  clientesComSaldo: number
  saldoEmCirculacao: number
}

interface Props {
  transacoes: Transacao[]
  resumo: Resumo
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function fmtDateShort(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function CashbackHistoricoClient({ transacoes, resumo }: Props) {
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'credito' | 'resgate'>('todos')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return transacoes.filter(t => {
      const matchSearch = !q || t.clienteNome.toLowerCase().includes(q) || t.clienteTelefone.includes(q) || t.descricao.toLowerCase().includes(q)
      const matchTipo = filtroTipo === 'todos' || t.tipo === filtroTipo
      return matchSearch && matchTipo
    })
  }, [transacoes, search, filtroTipo])

  const taxaResgate = resumo.totalCreditado > 0
    ? ((resumo.totalResgatado / resumo.totalCreditado) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-brand-text flex items-center gap-2">
          <Coins size={20} className="text-amber-400" /> Cashback — Histórico Interno
        </h1>
        <p className="text-xs text-brand-muted mt-0.5">Visão completa de créditos e resgates de todos os clientes</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total creditado"
          value={fmt(resumo.totalCreditado)}
          sub={`${resumo.qtdCreditos} transações`}
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          label="Total resgatado"
          value={fmt(resumo.totalResgatado)}
          sub={`${resumo.qtdResgates} resgates · ${taxaResgate}% do emitido`}
          icon={TrendingDown}
          color="amber"
        />
        <KpiCard
          label="Em circulação"
          value={fmt(resumo.saldoEmCirculacao)}
          sub="saldo disponível total"
          icon={Wallet}
          color="blue"
        />
        <KpiCard
          label="Clientes com saldo"
          value={String(resumo.clientesComSaldo)}
          sub="prontos para resgatar"
          icon={Users}
          color="purple"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente, telefone ou descrição..."
            className="w-full pl-8 pr-3 py-2 bg-brand-surface-2 border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-amber-500/40"
          />
        </div>

        <div className="flex items-center gap-1 bg-brand-surface-2 border border-brand-border rounded-xl p-1">
          <Filter size={13} className="text-brand-muted ml-1" />
          {(['todos', 'credito', 'resgate'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                filtroTipo === t
                  ? t === 'credito' ? 'bg-emerald-500/20 text-emerald-400'
                    : t === 'resgate' ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-brand-accent/20 text-brand-accent'
                  : 'text-brand-muted hover:text-brand-text'
              )}
            >
              {t === 'todos' ? 'Todos' : t === 'credito' ? 'Créditos' : 'Resgates'}
            </button>
          ))}
        </div>

        {(search || filtroTipo !== 'todos') && (
          <button onClick={() => { setSearch(''); setFiltroTipo('todos') }}
            className="flex items-center gap-1 text-xs text-brand-muted hover:text-brand-text px-2 py-2 rounded-lg hover:bg-brand-surface-2 transition-colors">
            <X size={12} /> Limpar
          </button>
        )}
        <span className="text-xs text-brand-muted ml-auto">{filtered.length} registro(s)</span>
      </div>

      {/* Tabela / Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-brand-muted">
          <Coins size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          {/* Header da tabela — desktop */}
          <div className="hidden md:grid grid-cols-[1fr_120px_120px_140px_1fr] gap-4 px-5 py-3 border-b border-brand-border bg-brand-surface-2/50">
            <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wide">Cliente</span>
            <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wide">Tipo</span>
            <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wide text-right">Valor</span>
            <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wide">Data</span>
            <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wide">Descrição</span>
          </div>

          <div className="divide-y divide-brand-border/50">
            {filtered.map(t => {
              const isCredito = t.tipo === 'credito'
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_140px_1fr] gap-2 md:gap-4 px-4 md:px-5 py-3.5 hover:bg-brand-surface-2/40 transition-colors"
                >
                  {/* Cliente */}
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                      isCredito ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400')}>
                      {t.clienteNome.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/admin/clientes/${t.clienteId}`}
                        className="text-sm font-medium text-brand-text hover:text-brand-accent truncate block transition-colors">
                        {t.clienteNome}
                      </Link>
                      <p className="text-[11px] text-brand-muted">{t.clienteTelefone}</p>
                    </div>
                  </div>

                  {/* Tipo */}
                  <div className="flex items-center md:block">
                    <span className={cn('inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border',
                      isCredito
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}>
                      {isCredito ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                      {isCredito ? 'Crédito' : 'Resgate'}
                    </span>
                  </div>

                  {/* Valor */}
                  <div className="md:text-right">
                    <p className={cn('text-sm font-bold tabular-nums', isCredito ? 'text-emerald-400' : 'text-amber-400')}>
                      {isCredito ? '+' : ''}{fmt(Math.abs(t.valor))}
                    </p>
                    {t.percentual && (
                      <p className="text-[10px] text-brand-muted">{t.percentual}%</p>
                    )}
                    {!isCredito && t.eventoValor && (
                      <p className="text-[10px] text-brand-muted">do evento {fmt(t.eventoValor)}</p>
                    )}
                  </div>

                  {/* Data */}
                  <div>
                    <p className="text-xs text-brand-text">{fmtDate(t.createdAt)}</p>
                    {t.dataEvento && (
                      <p className="text-[10px] text-brand-muted">Festa: {fmtDateShort(t.dataEvento)}</p>
                    )}
                  </div>

                  {/* Descrição */}
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-brand-muted truncate flex-1">{t.descricao}</p>
                    {t.eventoId && (
                      <Link href={`/admin/eventos`}
                        className="shrink-0 text-[10px] text-brand-accent hover:underline font-medium">
                        ver evento
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: 'emerald' | 'amber' | 'blue' | 'purple'
}) {
  const palette = {
    emerald: { bg: 'bg-emerald-500/8',  border: 'border-emerald-500/20', icon: 'text-emerald-400', val: 'text-emerald-400' },
    amber:   { bg: 'bg-amber-500/8',    border: 'border-amber-500/20',   icon: 'text-amber-400',   val: 'text-amber-400'   },
    blue:    { bg: 'bg-blue-500/8',     border: 'border-blue-500/20',    icon: 'text-blue-400',    val: 'text-blue-400'    },
    purple:  { bg: 'bg-purple-500/8',   border: 'border-purple-500/20',  icon: 'text-purple-400',  val: 'text-purple-400'  },
  }[color]

  return (
    <div className={cn('rounded-2xl border p-4', palette.bg, palette.border)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={palette.icon} />
        <p className="text-xs text-brand-muted font-medium">{label}</p>
      </div>
      <p className={cn('text-xl font-bold tabular-nums', palette.val)}>{value}</p>
      <p className="text-[10px] text-brand-muted mt-0.5">{sub}</p>
    </div>
  )
}
