'use client'

import { AnimatedNumber } from './AnimatedNumber'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  Users, CalendarDays, TrendingUp, TrendingDown, DollarSign,
  UserCheck, AlertTriangle, Trophy, Star, Package, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const STATUS_COLORS: Record<string, string> = {
  confirmado: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  realizado:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
  orcamento:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  cancelado:  'text-red-400 bg-red-400/10 border-red-400/30',
}

interface Metrics {
  leadsHoje: number
  leadsAbertos: number
  eventosEstaSemana: number
  receitaMes: number
  taxaConversao: number
  leadsPerdidosMes: number
  topBrinquedo: { nome: string; total: number } | null
  topMonitor: { nome: string; total: number } | null
  proximosEventos: {
    id: string
    nomeCliente: string
    dataEvento: string
    horarioInicio: string
    enderecoCompleto: string
    status: string
  }[]
}

interface ChartData {
  mes: number
  receita: number
  festas: number
}

interface LeadAlerta {
  id: string
  nome: string
  status: string
  ultimaInteracao: Date
}

interface Props {
  metrics: Metrics
  receitaAnual: ChartData[]
  leadsAlerta: LeadAlerta[]
}

function MetricCard({
  titulo, valor, icone, cor, prefix = '', suffix = '', decimals = 0, trend,
}: {
  titulo: string
  valor: number
  icone: React.ReactNode
  cor: string
  prefix?: string
  suffix?: string
  decimals?: number
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div
      className="group relative bg-brand-surface border border-brand-border rounded-2xl p-5 flex flex-col gap-3 overflow-hidden transition-all duration-200 hover:border-opacity-60 hover:shadow-lg hover:-translate-y-0.5"
      style={{ '--card-color': cor } as React.CSSProperties}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, ${cor}12 0%, transparent 70%)` }}
      />
      <div className="flex items-center justify-between relative">
        <span className="text-brand-muted text-xs uppercase tracking-wider font-medium">{titulo}</span>
        <span
          className="flex items-center justify-center w-9 h-9 rounded-xl transition-transform duration-200 group-hover:scale-110"
          style={{ color: cor, backgroundColor: `${cor}18` }}
        >
          {icone}
        </span>
      </div>
      <div className="flex items-end gap-2 relative">
        <p className="text-brand-text text-3xl font-bold leading-none tabular-nums">
          <AnimatedNumber value={valor} prefix={prefix} suffix={suffix} decimals={decimals} />
        </p>
        {trend && (
          <span className={cn(
            'text-xs font-semibold mb-0.5',
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-brand-muted'
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
          </span>
        )}
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: number }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 shadow-xl text-sm">
      <p className="text-brand-muted text-xs mb-1">{MESES_ABREV[(label ?? 1) - 1]}</p>
      <p className="text-brand-text font-bold">
        {payload[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
    </div>
  )
}

export function DashboardClient({ metrics, receitaAnual, leadsAlerta }: Props) {
  const chartData = receitaAnual.map(d => ({
    name: MESES_ABREV[d.mes - 1],
    mes: d.mes,
    receita: d.receita,
    festas: d.festas,
  }))

  const mesAtual = new Date().getMonth() + 1
  const receitaMesAnterior = receitaAnual.find(d => d.mes === mesAtual - 1)?.receita ?? 0
  const trendReceita = metrics.receitaMes > receitaMesAnterior ? 'up' : metrics.receitaMes < receitaMesAnterior ? 'down' : 'neutral'

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-brand-text uppercase tracking-wide">
            Dashboard
          </h1>
          <p className="text-brand-muted text-sm mt-1">Visão geral do negócio em tempo real</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-brand-muted bg-brand-surface border border-brand-border rounded-xl px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Atualizado agora
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <MetricCard
          titulo="Receita do Mês"
          valor={metrics.receitaMes}
          icone={<DollarSign className="size-5" />}
          cor="#34D399"
          prefix="R$ "
          decimals={0}
          trend={trendReceita}
        />
        <MetricCard
          titulo="Eventos Esta Semana"
          valor={metrics.eventosEstaSemana}
          icone={<CalendarDays className="size-5" />}
          cor="#818CF8"
        />
        <MetricCard
          titulo="Leads Abertos"
          valor={metrics.leadsAbertos}
          icone={<TrendingUp className="size-5" />}
          cor="#60A5FA"
        />
        <MetricCard
          titulo="Leads Hoje"
          valor={metrics.leadsHoje}
          icone={<Users className="size-5" />}
          cor="#F472B6"
        />
        <MetricCard
          titulo="Taxa de Conversão"
          valor={metrics.taxaConversao}
          icone={<TrendingUp className="size-5" />}
          cor={metrics.taxaConversao >= 50 ? '#34D399' : '#F59E0B'}
          suffix="%"
          trend={metrics.taxaConversao >= 50 ? 'up' : 'down'}
        />
        <MetricCard
          titulo="Perdidos no Mês"
          valor={metrics.leadsPerdidosMes}
          icone={<TrendingDown className="size-5" />}
          cor="#F87171"
          trend={metrics.leadsPerdidosMes > 5 ? 'down' : 'neutral'}
        />
      </div>

      {/* Chart + Rankings row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart — spans 2 cols */}
        <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-brand-text font-semibold">Receita Anual</h2>
              <p className="text-brand-muted text-xs mt-0.5">{new Date().getFullYear()}</p>
            </div>
            <span className="text-xs text-brand-muted bg-brand-surface-2 border border-brand-border rounded-lg px-2.5 py-1.5">
              {receitaAnual.filter(d => d.receita > 0).length} meses
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={28} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--color-brand-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                tick={{ fill: 'var(--color-brand-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }} />
              <Bar dataKey="receita" fill="var(--color-brand-accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Rankings */}
        <div className="flex flex-col gap-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                <Trophy className="size-4 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-brand-text font-semibold text-sm">Top Brinquedo</h2>
                <p className="text-brand-muted text-xs">Mais alugado</p>
              </div>
            </div>
            {metrics.topBrinquedo ? (
              <div>
                <p className="text-brand-text font-bold text-lg leading-tight">{metrics.topBrinquedo.nome}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  {[...Array(3)].map((_, i) => (
                    <Star key={i} className="size-3.5 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-brand-muted text-xs ml-1">{metrics.topBrinquedo.total} eventos</span>
                </div>
              </div>
            ) : (
              <p className="text-brand-muted text-sm">Sem dados ainda</p>
            )}
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-400/10 flex items-center justify-center">
                <UserCheck className="size-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-brand-text font-semibold text-sm">Top Monitor</h2>
                <p className="text-brand-muted text-xs">Mais ativo</p>
              </div>
            </div>
            {metrics.topMonitor ? (
              <div>
                <p className="text-brand-text font-bold text-lg leading-tight">{metrics.topMonitor.nome}</p>
                <p className="text-brand-muted text-xs mt-2">{metrics.topMonitor.total} eventos trabalhados</p>
              </div>
            ) : (
              <p className="text-brand-muted text-sm">Sem dados ainda</p>
            )}
          </div>
        </div>
      </div>

      {/* Alertas + Próximos eventos row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alertas */}
        {leadsAlerta.length > 0 && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="size-4 text-yellow-400" />
              <h2 className="text-yellow-400 font-semibold text-sm">
                {leadsAlerta.length} lead{leadsAlerta.length !== 1 ? 's' : ''} frios
              </h2>
            </div>
            <ul className="space-y-2">
              {leadsAlerta.slice(0, 5).map(l => (
                <li key={l.id} className="flex items-center gap-2 text-sm text-brand-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/60 shrink-0" />
                  <span className="truncate">{l.nome}</span>
                  <span className="ml-auto shrink-0 text-xs capitalize text-brand-muted/60">{l.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Próximos eventos */}
        <div className={cn('bg-brand-surface border border-brand-border rounded-2xl p-5', leadsAlerta.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3')}>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="size-4 text-brand-accent" />
            <h2 className="text-brand-text font-semibold">Próximas Festas</h2>
          </div>
          {metrics.proximosEventos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="size-8 text-brand-muted mb-2" />
              <p className="text-brand-muted text-sm">Nenhum evento agendado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.proximosEventos.map(e => {
                const statusClass = STATUS_COLORS[e.status] ?? 'text-brand-muted bg-brand-surface-2 border-brand-border'
                const [ano, mes, dia] = e.dataEvento.split('-')
                return (
                  <div
                    key={e.id}
                    className="bg-brand-surface-2 border border-brand-border hover:border-brand-accent/30 rounded-xl p-3.5 flex items-center gap-3.5 transition-all duration-150 hover:-translate-y-px"
                  >
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex flex-col items-center justify-center">
                      <span className="text-brand-accent text-xs font-bold leading-none">{dia}/{mes}</span>
                      <span className="text-brand-muted text-[9px] leading-none mt-0.5">{ano}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-brand-text font-semibold text-sm truncate">{e.nomeCliente}</p>
                      <p className="text-brand-muted text-xs truncate mt-0.5">
                        {e.horarioInicio} · {e.enderecoCompleto.slice(0, 40)}{e.enderecoCompleto.length > 40 ? '…' : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusClass}`}>
                      {e.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
