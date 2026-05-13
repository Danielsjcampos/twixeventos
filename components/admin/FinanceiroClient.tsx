'use client'

import { useState } from 'react'
import { AnimatedNumber } from './AnimatedNumber'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { DollarSign, CalendarDays, Package, TrendingUp, ChevronLeft, ChevronRight, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LancamentosClient } from './LancamentosClient'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const PIE_COLORS = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#8B5CF6','#06B6D4']

const STATUS_PAG: Record<string, string> = {
  pago:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  pendente: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  parcial:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
}

const STATUS_EVT: Record<string, string> = {
  confirmado: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  realizado:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
  orcamento:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
}

interface Kpis {
  totalFaturado: number
  totalFestas: number
  brinquedosAlugados: number
  ticketMedioFestas: number
  ticketMedioBrinquedos: number
}

interface Evento {
  id: string
  nomeCliente: string
  dataEvento: string
  horarioInicio: string
  valorTotal: string | null
  custoMonitores: string | null
  custoTransporte: string | null
  custosExtras: string | null
  origemCliente: string | null
  tipoCliente: string | null
  status: string
  statusPagamento: string
}

interface Brinquedo {
  nome: string
  alugados: number
  receita: number
}

interface Origem {
  origem: string
  total: number
}

interface ChartAnual {
  mes: number
  receita: number
  festas: number
}

type Lancamento = {
  id: string; tipo: string; descricao: string; valor: string
  forma: string | null; status: string; data: string
  categoria: string | null; observacoes: string | null
  eventoId: string | null; monitorId: string | null
  nomeEvento: string | null; nomeMonitor: string | null
  criadoPor: string | null; createdAt: string
}

interface Props {
  anoInicial: number
  mesInicial: number
  kpisInicial: Kpis
  eventosInicial: Evento[]
  rankingBrinquedosInicial: Brinquedo[]
  origensInicial: Origem[]
  receitaAnual: ChartAnual[]
  lancamentosInicial: Lancamento[]
}

function KpiCard({ titulo, valor, icone, cor, prefix = '', decimals = 0 }: {
  titulo: string; valor: number; icone: React.ReactNode; cor: string
  prefix?: string; decimals?: number
}) {
  return (
    <div
      className="group bg-brand-surface border border-brand-border rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, ${cor}14, transparent 70%)` }} />
      <div className="flex items-center justify-between">
        <span className="text-brand-muted text-xs uppercase tracking-wider">{titulo}</span>
        <span className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ color: cor, backgroundColor: `${cor}18` }}>
          {icone}
        </span>
      </div>
      <p className="text-brand-text text-2xl font-bold tabular-nums">
        <AnimatedNumber value={valor} prefix={prefix} decimals={decimals} />
      </p>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 shadow-xl text-sm">
      <p className="text-brand-muted text-xs mb-1">{label}</p>
      <p className="text-brand-text font-bold">
        {payload[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
    </div>
  )
}

export function FinanceiroClient({
  anoInicial, mesInicial,
  kpisInicial, eventosInicial, rankingBrinquedosInicial, origensInicial,
  receitaAnual, lancamentosInicial,
}: Props) {
  const [mes, setMes] = useState(mesInicial)
  const [ano, setAno] = useState(anoInicial)
  const [kpis, setKpis] = useState(kpisInicial)
  const [eventos, setEventos] = useState(eventosInicial)
  const [ranking, setRanking] = useState(rankingBrinquedosInicial)
  const [origens, setOrigens] = useState(origensInicial)
  const [lancamentos, setLancamentos] = useState(lancamentosInicial)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'lancamentos'>('visao_geral')

  const chartAnual = receitaAnual.map(d => ({
    name: MESES_ABREV[d.mes - 1],
    receita: d.receita,
  }))

  const totalOrigens = origens.reduce((s, o) => s + o.total, 0)
  const maxAlugados = Math.max(...ranking.map(r => r.alugados), 1)

  async function navigate(novoMes: number, novoAno: number) {
    setLoading(true)
    try {
      const [finRes, lanRes] = await Promise.all([
        fetch(`/api/admin/financeiro?mes=${novoMes}&ano=${novoAno}`),
        fetch(`/api/admin/lancamentos?mes=${novoMes}&ano=${novoAno}`),
      ])
      const data = await finRes.json()
      const lanData = await lanRes.json()
      setMes(novoMes)
      setAno(novoAno)
      setKpis(data.kpis)
      setEventos(data.eventos)
      setRanking(data.ranking)
      setOrigens(data.origens)
      setLancamentos(lanData)
    } finally {
      setLoading(false)
    }
  }

  function prevMes() {
    if (mes === 1) navigate(12, ano - 1)
    else navigate(mes - 1, ano)
  }
  function nextMes() {
    const hoje = new Date()
    if (ano > hoje.getFullYear() || (ano === hoje.getFullYear() && mes >= hoje.getMonth() + 1)) return
    if (mes === 12) navigate(1, ano + 1)
    else navigate(mes + 1, ano)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-brand-text uppercase tracking-wide">
            Financeiro
          </h1>
          <p className="text-brand-muted text-sm mt-1">Receitas, festas e performance por período</p>
        </div>
        {/* Month navigator */}
        <div className="flex items-center gap-2 bg-brand-surface border border-brand-border rounded-2xl px-4 py-2.5">
          <button
            onClick={prevMes}
            disabled={loading}
            className="p-1 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-2 transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="w-40 text-center">
            {loading ? (
              <div className="h-5 bg-brand-surface-2 rounded-lg animate-pulse mx-auto w-32" />
            ) : (
              <span className="text-brand-text font-semibold text-sm">{MESES[mes - 1]} {ano}</span>
            )}
          </div>
          <button
            onClick={nextMes}
            disabled={loading}
            className="p-1 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-2 transition-colors disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-surface-2 border border-brand-border rounded-xl p-1 w-fit">
        {[
          { id: 'visao_geral', label: 'Visão Geral', icon: TrendingUp },
          { id: 'lancamentos', label: 'Lançamentos Avulsos', icon: List },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-brand-surface border border-brand-border text-brand-text shadow-sm'
                : 'text-brand-muted hover:text-brand-text',
            )}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'lancamentos' && (
        <LancamentosClient
          lancamentos={lancamentos}
          mes={mes} ano={ano}
          onRefresh={navigate}
        />
      )}

      {activeTab === 'visao_geral' && <>
      {/* KPI cards */}
      <div className={cn('grid grid-cols-2 lg:grid-cols-5 gap-3 transition-opacity duration-200', loading && 'opacity-50')}>
        <KpiCard titulo="Total Faturado" valor={kpis.totalFaturado} icone={<DollarSign className="size-4" />} cor="#34D399" prefix="R$ " decimals={0} />
        <KpiCard titulo="Total de Festas" valor={kpis.totalFestas} icone={<CalendarDays className="size-4" />} cor="#818CF8" />
        <KpiCard titulo="Brinquedos Alugados" valor={kpis.brinquedosAlugados} icone={<Package className="size-4" />} cor="#60A5FA" />
        <KpiCard titulo="Ticket / Festa" valor={kpis.ticketMedioFestas} icone={<TrendingUp className="size-4" />} cor="#F59E0B" prefix="R$ " decimals={0} />
        <KpiCard titulo="Ticket / Brinquedo" valor={kpis.ticketMedioBrinquedos} icone={<TrendingUp className="size-4" />} cor="#EC4899" prefix="R$ " decimals={0} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Annual bar chart */}
        <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-brand-text font-semibold">Receita {ano}</h2>
              <p className="text-brand-muted text-xs mt-0.5">Visão anual</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartAnual} barSize={24} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--color-brand-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} tick={{ fill: 'var(--color-brand-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }} />
              <Bar
                dataKey="receita"
                radius={[4, 4, 0, 0]}
                fill="var(--color-brand-accent)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Origens pie */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
          <h2 className="text-brand-text font-semibold mb-1">Origem dos Clientes</h2>
          <p className="text-brand-muted text-xs mb-4">{MESES[mes - 1]}</p>
          {origens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-brand-muted text-sm">
              Sem dados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={origens} dataKey="total" nameKey="origem" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {origens.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} festas`]} />
                <Legend
                  formatter={(v) => <span className="text-xs text-brand-muted">{v}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Ranking + Events row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Brinquedo ranking */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5">
          <h2 className="text-brand-text font-semibold mb-1">Ranking de Brinquedos</h2>
          <p className="text-brand-muted text-xs mb-4">{MESES[mes - 1]} {ano}</p>
          {ranking.length === 0 ? (
            <p className="text-brand-muted text-sm text-center py-8">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {ranking.map((b, i) => (
                <div key={b.nome} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        'shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                        i === 0 ? 'bg-yellow-400/20 text-yellow-400' :
                        i === 1 ? 'bg-zinc-400/20 text-zinc-400' :
                        i === 2 ? 'bg-orange-400/20 text-orange-400' :
                        'bg-brand-surface-2 text-brand-muted'
                      )}>
                        {i + 1}
                      </span>
                      <span className="text-brand-text font-medium truncate">{b.nome}</span>
                    </div>
                    <span className="text-brand-muted shrink-0 ml-2">{b.alugados}×</span>
                  </div>
                  <div className="h-1.5 bg-brand-surface-2 rounded-full overflow-hidden ml-7">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(b.alugados / maxAlugados) * 100}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Events table */}
        <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
            <div>
              <h2 className="text-brand-text font-semibold">Festas do Mês</h2>
              <p className="text-brand-muted text-xs mt-0.5">{MESES[mes - 1]} {ano} · {eventos.length} festas</p>
            </div>
          </div>
          <div className={cn('overflow-x-auto transition-opacity duration-200', loading && 'opacity-50')}>
            {eventos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-brand-muted">
                <CalendarDays className="size-8 mb-2 opacity-40" />
                <p className="text-sm">Nenhuma festa neste período</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border">
                    {['Data','Cliente','Valor Total','Gastos','Resultado','Origem','Status'].map(h => (
                      <th key={h} className="text-left text-xs text-brand-muted font-medium uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eventos.map(e => {
                    const vt = Number(e.valorTotal ?? 0)
                    const gastos = Number(e.custoMonitores ?? 0) + Number(e.custoTransporte ?? 0) + Number(e.custosExtras ?? 0)
                    const resultado = vt - gastos
                    const [, mes2, dia] = e.dataEvento.split('-')
                    return (
                      <tr key={e.id} className="border-b border-brand-border/50 hover:bg-brand-surface-2 transition-colors">
                        <td className="px-4 py-3 text-brand-muted whitespace-nowrap">{dia}/{mes2}</td>
                        <td className="px-4 py-3 text-brand-text font-medium max-w-[140px] truncate">{e.nomeCliente}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold whitespace-nowrap tabular-nums">
                          {vt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-4 py-3 text-red-400 whitespace-nowrap tabular-nums">
                          {gastos > 0 ? gastos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                        </td>
                        <td className={cn('px-4 py-3 font-semibold whitespace-nowrap tabular-nums', resultado >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {resultado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-4 py-3 text-brand-muted max-w-[100px] truncate">{e.origemCliente ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border capitalize', STATUS_EVT[e.status] ?? 'text-brand-muted bg-brand-surface-2 border-brand-border')}>
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-brand-surface-2">
                    <td colSpan={2} className="px-4 py-3 text-brand-muted text-xs font-semibold uppercase">Total</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold tabular-nums">
                      {eventos.reduce((s, e) => s + Number(e.valorTotal ?? 0), 0)
                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-3 text-red-400 font-bold tabular-nums">
                      {eventos.reduce((s, e) => s + Number(e.custoMonitores ?? 0) + Number(e.custoTransporte ?? 0) + Number(e.custosExtras ?? 0), 0)
                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-bold tabular-nums">
                      {eventos.reduce((s, e) => {
                        const vt = Number(e.valorTotal ?? 0)
                        const g = Number(e.custoMonitores ?? 0) + Number(e.custoTransporte ?? 0) + Number(e.custosExtras ?? 0)
                        return s + vt - g
                      }, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
      </> /* end activeTab === 'visao_geral' */}
    </div>
  )
}
