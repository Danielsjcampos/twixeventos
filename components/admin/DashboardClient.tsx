'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatedNumber } from './AnimatedNumber'
import {
  Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  ComposedChart, Line,
} from 'recharts'
import {
  Users, CalendarDays, TrendingUp, TrendingDown, DollarSign,
  UserCheck, AlertTriangle, Trophy, Clock,
  Target, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const FUNNEL_ORDER  = ['novo_lead','qualificado','orcamento','confirmado','realizado']
const FUNNEL_LABELS: Record<string, string> = {
  novo_lead:   'Novo Lead',
  qualificado: 'Qualificado',
  orcamento:   'Orçamento',
  confirmado:  'Confirmado',
  realizado:   'Realizado',
}
const FUNNEL_COLORS = ['#818CF8','#60A5FA','#34D399','#F59E0B','#A78BFA']

const PIE_COLORS = ['#818CF8','#60A5FA','#34D399','#F59E0B','#F472B6','#38BDF8']

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  confirmado: { label: 'Confirmado', color: '#34D399', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  realizado:  { label: 'Realizado',  color: '#818CF8', bg: 'bg-violet-400/10',  border: 'border-violet-400/30'  },
  orcamento:  { label: 'Orçamento',  color: '#F59E0B', bg: 'bg-amber-400/10',   border: 'border-amber-400/30'   },
  cancelado:  { label: 'Cancelado',  color: '#F87171', bg: 'bg-red-400/10',     border: 'border-red-400/30'     },
}

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface Metrics {
  leadsHoje: number
  leadsAbertos: number
  eventosEstaSemana: number
  receitaMes: number
  taxaConversao: number
  leadsPerdidosMes: number
  topBrinquedo: { nome: string; total: number } | null
  topMonitor:   { nome: string; total: number } | null
  proximosEventos: {
    id: string; nomeCliente: string; dataEvento: string
    horarioInicio: string; enderecoCompleto: string; status: string
  }[]
  leadsPorStatus:   { status: string; total: number }[]
  origemLeads:      { origem: string; total: number }[]
  topBrinquedos:    { nome: string; total: number }[]
}
interface ChartData { mes: number; receita: number; festas: number }
interface LeadAlerta { id: string; nome: string; status: string; ultimaInteracao: Date }
interface Props { metrics: Metrics; receitaAnual: ChartData[]; leadsAlerta: LeadAlerta[] }

/* ─────────────────────────────────────────────
   Animated entry wrapper
───────────────────────────────────────────── */
function FadeIn({ children, delay = 0, className }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(16px)'
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, delay)
    return () => clearTimeout(t)
  }, [delay])
  return <div ref={ref} className={className}>{children}</div>
}

/* ─────────────────────────────────────────────
   KPI Card
───────────────────────────────────────────── */
function KpiCard({
  titulo, valor, icon, color, prefix = '', suffix = '', decimals = 0, trend, sub,
}: {
  titulo: string; valor: number; icon: React.ReactNode; color: string
  prefix?: string; suffix?: string; decimals?: number
  trend?: 'up' | 'down' | 'neutral'; sub?: string
}) {
  return (
    <div
      className="group relative bg-brand-surface border border-brand-border rounded-2xl p-5 overflow-hidden
                 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-default"
    >
      {/* glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 80% 0%, ${color}22 0%, transparent 65%)` }}
      />
      {/* top accent line */}
      <div
        className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }}
      />

      <div className="flex items-start justify-between mb-3">
        <span className="text-brand-muted text-[11px] uppercase tracking-widest font-semibold">{titulo}</span>
        <span
          className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
          style={{ color, background: `${color}18` }}
        >
          {icon}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <p className="text-brand-text text-[2rem] font-extrabold leading-none tabular-nums tracking-tight">
          <AnimatedNumber value={valor} prefix={prefix} suffix={suffix} decimals={decimals} />
        </p>
        {trend && trend !== 'neutral' && (
          <span className={cn('flex items-center gap-0.5 text-xs font-bold mb-1', trend === 'up' ? 'text-emerald-400' : 'text-red-400')}>
            {trend === 'up' ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          </span>
        )}
      </div>
      {sub && <p className="text-brand-muted text-xs mt-1.5">{sub}</p>}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Section Card
───────────────────────────────────────────── */
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-brand-surface border border-brand-border rounded-2xl p-5', className)}>
      {children}
    </div>
  )
}
function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-brand-text font-bold text-sm">{title}</h2>
        {sub && <p className="text-brand-muted text-xs mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Custom tooltips
───────────────────────────────────────────── */
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-3 shadow-2xl text-xs space-y-1 min-w-[130px]">
      <p className="text-brand-muted font-medium mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="text-brand-muted capitalize">{p.dataKey === 'receita' ? 'Receita' : 'Festas'}</span>
          <span className="text-brand-text font-bold">
            {p.dataKey === 'receita'
              ? p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
              : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function DefaultTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 shadow-2xl text-xs">
      {label && <p className="text-brand-muted mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-brand-text font-bold">{p.name ? `${p.name}: ` : ''}{p.value}</p>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Lead Funnel (custom — horizontal bars com %)
───────────────────────────────────────────── */
function LeadFunnel({ data }: { data: { status: string; total: number }[] }) {
  const statusMap = Object.fromEntries(data.map(d => [d.status, d.total]))
  const rows = FUNNEL_ORDER.map((s, i) => ({
    label: FUNNEL_LABELS[s],
    total: statusMap[s] ?? 0,
    color: FUNNEL_COLORS[i],
  }))
  const max = Math.max(...rows.map(r => r.total), 1)

  return (
    <div className="space-y-2.5">
      {rows.map((row, i) => {
        const pct = Math.round((row.total / max) * 100)
        const conv = i > 0 && rows[i - 1].total > 0
          ? Math.round((row.total / rows[i - 1].total) * 100)
          : null
        return (
          <div key={row.label} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                <span className="text-brand-text text-xs font-medium">{row.label}</span>
              </div>
              <div className="flex items-center gap-3">
                {conv !== null && (
                  <span className="text-brand-muted text-[10px] tabular-nums">
                    ↳ {conv}%
                  </span>
                )}
                <span className="text-brand-text text-xs font-bold tabular-nums w-8 text-right">{row.total}</span>
              </div>
            </div>
            <div className="h-6 bg-brand-surface-2 rounded-lg overflow-hidden border border-brand-border">
              <div
                className="h-full rounded-lg transition-all duration-1000 ease-out flex items-center px-2"
                style={{
                  width: `${Math.max(pct, row.total > 0 ? 6 : 0)}%`,
                  background: `linear-gradient(90deg, ${row.color}99, ${row.color})`,
                  boxShadow: `0 0 12px ${row.color}60`,
                }}
              >
                {pct > 20 && (
                  <span className="text-white text-[10px] font-bold">{pct}%</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Radial Gauge — taxa de conversão
───────────────────────────────────────────── */
function ConversionGauge({ value }: { value: number }) {
  const color = value >= 60 ? '#34D399' : value >= 40 ? '#F59E0B' : '#F87171'
  const gaugeData = [{ name: 'conversão', value, fill: color }]

  return (
    <div className="relative flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height={180}>
        <RadialBarChart
          cx="50%" cy="75%"
          innerRadius="60%" outerRadius="90%"
          startAngle={180} endAngle={0}
          data={gaugeData}
          barSize={16}
        >
          <RadialBar
            background={{ fill: 'rgba(255,255,255,0.04)' }}
            dataKey="value"
            cornerRadius={8}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute bottom-8 flex flex-col items-center">
        <span className="text-4xl font-extrabold tabular-nums" style={{ color }}>
          {value}%
        </span>
        <span className="text-brand-muted text-xs mt-1">conversão 30d</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Origem Donut
───────────────────────────────────────────── */
function OrigemDonut({ data }: { data: { origem: string; total: number }[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.total, 0)

  if (!data.length) return <p className="text-brand-muted text-sm text-center py-8">Sem dados</p>

  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0" style={{ width: 120, height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={32} outerRadius={52}
              dataKey="total"
              paddingAngle={3}
              onMouseEnter={(_, i) => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                  opacity={activeIdx === null || activeIdx === i ? 1 : 0.4}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        {data.map((d, i) => (
          <div
            key={d.origem}
            className="flex items-center gap-2 text-xs cursor-default"
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            <span className="text-brand-muted truncate flex-1">{d.origem}</span>
            <span className="text-brand-text font-bold tabular-nums">{total > 0 ? Math.round(d.total / total * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export function DashboardClient({ metrics, receitaAnual, leadsAlerta }: Props) {
  const chartData = receitaAnual.map(d => ({
    name: MESES[d.mes - 1],
    mes: d.mes,
    receita: d.receita,
    festas: d.festas,
  }))

  const mesAtual = new Date().getMonth() + 1
  const receitaMesAnt = receitaAnual.find(d => d.mes === mesAtual - 1)?.receita ?? 0
  const trendReceita  = metrics.receitaMes > receitaMesAnt ? 'up' : metrics.receitaMes < receitaMesAnt ? 'down' : 'neutral'
  const totalLeads    = metrics.leadsPorStatus.reduce((s, d) => s + d.total, 0)
  const maxBrinquedo  = Math.max(...(metrics.topBrinquedos.map(b => b.total)), 1)

  const eventoStatusChip = (status: string) => {
    const cfg = STATUS_CFG[status]
    if (!cfg) return <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-surface-2 text-brand-muted border border-brand-border capitalize">{status}</span>
    return (
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${cfg.bg} ${cfg.border}`} style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <FadeIn delay={0} className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-brand-text uppercase tracking-wide">
            Dashboard
          </h1>
          <p className="text-brand-muted text-sm mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-brand-muted bg-brand-surface border border-brand-border rounded-xl px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Ao vivo
        </div>
      </FadeIn>

      {/* ── KPI Cards ── */}
      <FadeIn delay={60}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard titulo="Receita do Mês"       valor={metrics.receitaMes}       icon={<DollarSign className="size-4" />}  color="#34D399" prefix="R$" decimals={0} trend={trendReceita} sub={`vs R$ ${receitaMesAnt.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mês ant.`} />
          <KpiCard titulo="Eventos Esta Semana"  valor={metrics.eventosEstaSemana} icon={<CalendarDays className="size-4" />} color="#818CF8" sub="próximos 7 dias" />
          <KpiCard titulo="Leads no Pipeline"    valor={metrics.leadsAbertos}      icon={<TrendingUp className="size-4" />}   color="#60A5FA" sub="em aberto" />
          <KpiCard titulo="Leads Hoje"           valor={metrics.leadsHoje}         icon={<Users className="size-4" />}        color="#F472B6" sub="novos hoje" />
          <KpiCard titulo="Conversão 30d"        valor={metrics.taxaConversao}     icon={<Target className="size-4" />}       color={metrics.taxaConversao >= 50 ? '#34D399' : '#F59E0B'} suffix="%" trend={metrics.taxaConversao >= 50 ? 'up' : 'down'} sub="leads → confirmados" />
          <KpiCard titulo="Perdidos no Mês"      valor={metrics.leadsPerdidosMes}  icon={<TrendingDown className="size-4" />} color="#F87171" trend={metrics.leadsPerdidosMes > 5 ? 'down' : 'neutral'} sub="leads perdidos" />
        </div>
      </FadeIn>

      {/* ── Receita Anual (area) + Gauge ── */}
      <FadeIn delay={120}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Area chart – 2 cols */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="Receita Anual"
              sub={`${new Date().getFullYear()} — receita por mês`}
              action={
                <span className="text-xs text-brand-muted bg-brand-surface-2 border border-brand-border rounded-lg px-2.5 py-1.5">
                  {receitaAnual.filter(d => d.receita > 0).length} meses
                </span>
              }
            />
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 0, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#818CF8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#818CF8" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-brand-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="r"
                  orientation="left"
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
                  tick={{ fill: 'var(--color-brand-muted)', fontSize: 10 }}
                  axisLine={false} tickLine={false} width={34}
                />
                <YAxis yAxisId="f" orientation="right" tick={{ fill: 'var(--color-brand-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<RevenueTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                <Area yAxisId="r" type="monotone" dataKey="receita" fill="url(#gradReceita)" stroke="#818CF8" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#818CF8', strokeWidth: 0 }} />
                <Line yAxisId="f" type="monotone" dataKey="festas" stroke="#F472B6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#F472B6', strokeWidth: 0 }} strokeDasharray="4 3" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-3 pl-1">
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-violet-400 rounded" /><span className="text-brand-muted text-[10px]">Receita</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-pink-400 rounded border-dashed" style={{ borderTop: '2px dashed #F472B6', background: 'none' }} /><span className="text-brand-muted text-[10px]">Festas</span></div>
            </div>
          </Card>

          {/* Radial gauge */}
          <Card className="flex flex-col">
            <CardHeader title="Taxa de Conversão" sub="Leads → Confirmados (30 dias)" />
            <div className="flex-1 flex flex-col justify-between">
              <ConversionGauge value={metrics.taxaConversao} />
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-brand-surface-2 rounded-xl p-3 text-center border border-brand-border">
                  <p className="text-brand-text font-extrabold text-lg tabular-nums">{totalLeads}</p>
                  <p className="text-brand-muted text-[10px] uppercase tracking-wider mt-0.5">Total Leads</p>
                </div>
                <div className="bg-brand-surface-2 rounded-xl p-3 text-center border border-brand-border">
                  <p className="text-brand-text font-extrabold text-lg tabular-nums">{metrics.leadsPerdidosMes}</p>
                  <p className="text-brand-muted text-[10px] uppercase tracking-wider mt-0.5">Perdidos/Mês</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </FadeIn>

      {/* ── Funil + Top Brinquedos + Origem ── */}
      <FadeIn delay={180}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Funil de leads */}
          <Card>
            <CardHeader title="Funil de Leads" sub="Pipeline por etapa" />
            <LeadFunnel data={metrics.leadsPorStatus} />
          </Card>

          {/* Top brinquedos */}
          <Card>
            <CardHeader title="Top Brinquedos" sub="Mais alugados no período" />
            {metrics.topBrinquedos.length === 0 ? (
              <p className="text-brand-muted text-sm text-center py-6">Sem dados ainda</p>
            ) : (
              <div className="space-y-2.5">
                {metrics.topBrinquedos.map((b, i) => {
                  const pct = Math.round((b.total / maxBrinquedo) * 100)
                  return (
                    <div key={b.nome}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold"
                            style={{ background: `${PIE_COLORS[i % PIE_COLORS.length]}20`, color: PIE_COLORS[i % PIE_COLORS.length] }}
                          >{i + 1}</span>
                          <span className="text-brand-text text-xs font-medium truncate">{b.nome}</span>
                        </div>
                        <span className="text-brand-muted text-xs tabular-nums ml-2 shrink-0">{b.total}×</span>
                      </div>
                      <div className="h-1.5 bg-brand-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${pct}%`,
                            background: PIE_COLORS[i % PIE_COLORS.length],
                            boxShadow: `0 0 6px ${PIE_COLORS[i % PIE_COLORS.length]}80`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Origem dos leads */}
          <Card>
            <CardHeader title="Origem dos Leads" sub="Últimos 90 dias" />
            <OrigemDonut data={metrics.origemLeads} />
            <div className="mt-4 pt-4 border-t border-brand-border grid grid-cols-2 gap-2">
              {metrics.topBrinquedo && (
                <div className="bg-brand-surface-2 rounded-xl p-3 border border-brand-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Trophy className="size-3 text-yellow-400" />
                    <span className="text-brand-muted text-[10px] uppercase tracking-wider">Top Brinq.</span>
                  </div>
                  <p className="text-brand-text text-xs font-bold leading-tight line-clamp-2">{metrics.topBrinquedo.nome}</p>
                  <p className="text-brand-muted text-[10px] mt-0.5">{metrics.topBrinquedo.total} eventos</p>
                </div>
              )}
              {metrics.topMonitor && (
                <div className="bg-brand-surface-2 rounded-xl p-3 border border-brand-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <UserCheck className="size-3 text-blue-400" />
                    <span className="text-brand-muted text-[10px] uppercase tracking-wider">Top Monitor</span>
                  </div>
                  <p className="text-brand-text text-xs font-bold leading-tight line-clamp-2">{metrics.topMonitor.nome}</p>
                  <p className="text-brand-muted text-[10px] mt-0.5">{metrics.topMonitor.total} eventos</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </FadeIn>

      {/* ── Próximos Eventos + Alertas ── */}
      <FadeIn delay={240}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Alertas */}
          {leadsAlerta.length > 0 && (
            <Card className="border-yellow-500/20 bg-yellow-500/3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-yellow-400/15 flex items-center justify-center">
                  <AlertTriangle className="size-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-yellow-400 font-bold text-sm">{leadsAlerta.length} lead{leadsAlerta.length !== 1 ? 's' : ''} frios</p>
                  <p className="text-brand-muted text-xs">Sem interação há +48h</p>
                </div>
              </div>
              <ul className="space-y-2">
                {leadsAlerta.slice(0, 6).map(l => (
                  <li key={l.id} className="flex items-center gap-2.5 text-sm bg-brand-surface-2 rounded-xl px-3 py-2.5 border border-brand-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0 animate-pulse" />
                    <span className="text-brand-text text-xs font-medium truncate flex-1">{l.nome}</span>
                    <span className="text-brand-muted text-[10px] capitalize shrink-0">{l.status.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Próximos eventos */}
          <Card className={leadsAlerta.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <CardHeader title="Próximas Festas" sub="Agenda dos próximos dias" action={
              <span className="text-xs text-brand-muted bg-brand-surface-2 border border-brand-border rounded-lg px-2.5 py-1.5">
                {metrics.proximosEventos.length} eventos
              </span>
            } />

            {metrics.proximosEventos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-surface-2 border border-brand-border flex items-center justify-center">
                  <Clock className="size-5 text-brand-muted" />
                </div>
                <p className="text-brand-muted text-sm">Nenhum evento agendado</p>
              </div>
            ) : (
              <div className={cn(
                'gap-3',
                leadsAlerta.length > 0 ? 'grid grid-cols-1 sm:grid-cols-2' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              )}>
                {metrics.proximosEventos.map(e => {
                  const [ano, mes, dia] = e.dataEvento.split('-')
                  const isHoje = e.dataEvento === new Date().toISOString().slice(0, 10)
                  return (
                    <div
                      key={e.id}
                      className={cn(
                        'group relative bg-brand-surface-2 border rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden',
                        isHoje ? 'border-brand-accent/40' : 'border-brand-border'
                      )}
                    >
                      {isHoje && (
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-accent to-transparent" />
                      )}
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center border',
                          isHoje
                            ? 'bg-brand-accent/15 border-brand-accent/30 text-brand-accent'
                            : 'bg-brand-surface border-brand-border text-brand-muted'
                        )}>
                          <span className="text-sm font-extrabold leading-none">{dia}</span>
                          <span className="text-[9px] uppercase tracking-wider mt-0.5">{MESES[Number(mes) - 1]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-brand-text font-bold text-sm truncate">{e.nomeCliente}</p>
                          <p className="text-brand-muted text-xs mt-0.5 truncate">
                            {e.horarioInicio} · {e.enderecoCompleto.slice(0, 35)}{e.enderecoCompleto.length > 35 ? '…' : ''}
                          </p>
                          <div className="mt-2">{eventoStatusChip(e.status)}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </FadeIn>

      <div className="h-8" />
    </div>
  )
}
