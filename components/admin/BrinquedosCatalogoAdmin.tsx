'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { Search, Filter, BarChart2, Trophy, TrendingUp, Star, Layers } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Brinquedo = {
  id: string; nome: string; slug: string; categoria: string
  faixaEtaria: string; capacidade: string; fotoDestaque: string | null
  status: string; destaque: boolean; ordemDestaque: number
  fotos?: string[]
}

type ChartRow = { nome: string; total: number }

type ChartData = {
  maisLocados: ChartRow[]
  maisReceita: ChartRow[]
  maisLeads:   ChartRow[]
  maisOrcamentos: ChartRow[]
}

type Props = {
  brinquedos: Brinquedo[]
  chartData:  ChartData
  counts: { publicado: number; rascunho: number; invisivel: number }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  publicado: { label: 'Publicado',  dot: 'bg-green-500',  text: 'text-green-600',  bg: 'bg-green-500/10 border-green-500/25' },
  rascunho:  { label: 'Rascunho',   dot: 'bg-gray-400',   text: 'text-gray-400',   bg: 'bg-gray-400/10 border-gray-400/25' },
  invisivel: { label: 'Invisível',  dot: 'bg-amber-500',  text: 'text-amber-500',  bg: 'bg-amber-500/10 border-amber-500/25' },
} as const

const CATEGORIAS = [
  'todas', 'inflaveis', 'batalhas', 'radicais', 'aquaticos',
  'toboshark', 'tematicos',
]

const CAT_LABEL: Record<string, string> = {
  todas: 'Todas', inflaveis: 'Infláveis', batalhas: 'Batalhas',
  radicais: 'Radicais', aquaticos: 'Aquáticos',
  toboshark: 'Toboshark', tematicos: 'Temáticos',
}

const CHART_COLORS = ['#3B82F6','#60A5FA','#93C5FD','#BFDBFE','#DBEAFE','#EFF6FF','#1D4ED8','#2563EB']

// Abrevia nomes longos para caber no eixo
const abbrev = (nome: string) =>
  nome.length > 14 ? nome.slice(0, 13) + '…' : nome

// Formata valor como R$
const fmtBRL = (v: number) =>
  v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`

// ─── Mini Chart ──────────────────────────────────────────────────────────────
function MiniBarChart({
  data, icon: Icon, title, color = '#3B82F6', formatValue,
}: {
  data: ChartRow[]
  icon: React.ElementType
  title: string
  color?: string
  formatValue?: (v: number) => string
}) {
  const display = data.slice(0, 6)
  const isEmpty = display.length === 0

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-brand-text text-sm font-semibold">{title}</span>
      </div>

      {isEmpty ? (
        <div className="h-[140px] flex items-center justify-center text-brand-muted text-xs">
          Sem dados ainda
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={display} layout="vertical" margin={{ left: 0, right: 32, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="nome"
              tickFormatter={abbrev}
              width={100}
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: `${color}10` }}
              contentStyle={{
                background: '#0B0D1A', border: '1px solid rgba(37,99,235,0.2)',
                borderRadius: 8, fontSize: 12, color: '#F1F5F9',
              }}
              formatter={(value) =>
                [formatValue ? formatValue(Number(value)) : value, title] as [string | number, string]
              }
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={16}>
              {display.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BrinquedosCatalogoAdmin({ brinquedos, chartData, counts }: Props) {
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [showCharts, setShowCharts] = useState(true)

  const filtered = useMemo(() => {
    return brinquedos.filter(b => {
      const matchCat = categoria === 'todas' || b.categoria === categoria
      const matchSearch = b.nome.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [brinquedos, search, categoria])

  return (
    <div className="p-6 pb-24 md:pb-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-brand-text uppercase">
            Catálogo
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-brand-muted text-sm">{brinquedos.length} brinquedos</span>
            {Object.entries(counts).filter(([, v]) => v > 0).map(([key, count]) => {
              const cfg = STATUS_CONFIG[key as keyof typeof STATUS_CONFIG]
              return (
                <span key={key} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {count} {cfg.label.toLowerCase()}
                </span>
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCharts(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showCharts
                ? 'bg-blue-600/10 border-blue-500/30 text-blue-500'
                : 'bg-brand-surface border-brand-border text-brand-muted hover:text-brand-text'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Charts
          </button>
          <Link href="/admin/brinquedos/novo">
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              + Novo Brinquedo
            </button>
          </Link>
        </div>
      </div>

      {/* ── Charts ── */}
      {showCharts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MiniBarChart
            data={chartData.maisLocados}
            icon={Trophy}
            title="Mais locados"
            color="#3B82F6"
          />
          <MiniBarChart
            data={chartData.maisReceita}
            icon={TrendingUp}
            title="Mais receita"
            color="#10B981"
            formatValue={fmtBRL}
          />
          <MiniBarChart
            data={chartData.maisLeads}
            icon={Star}
            title="Mais nos leads"
            color="#F59E0B"
          />
          <MiniBarChart
            data={chartData.maisOrcamentos}
            icon={Layers}
            title="Mais em orçamentos"
            color="#8B5CF6"
          />
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-brand-surface border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Categoria tabs */}
        <div className="flex items-center gap-1.5 bg-brand-surface border border-brand-border rounded-lg px-2 py-1.5 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-brand-muted flex-shrink-0 mr-0.5" />
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                categoria === cat
                  ? 'bg-blue-600 text-white'
                  : 'text-brand-muted hover:text-brand-text hover:bg-brand-surface-2'
              }`}
            >
              {CAT_LABEL[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Resultados ── */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-brand-muted">
          <p className="text-base font-medium">Nenhum brinquedo encontrado</p>
          <p className="text-sm mt-1">Tente outro nome ou categoria.</p>
        </div>
      )}

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(b => {
          const status = (b.status ?? 'publicado') as keyof typeof STATUS_CONFIG
          const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.rascunho

          return (
            <Link
              key={b.id}
              href={`/admin/brinquedos/${b.id}/editar`}
              className="group bg-brand-surface border border-brand-border rounded-xl overflow-hidden hover:border-blue-500/40 transition-colors duration-150 flex flex-col"
            >
              {/* Foto */}
              <div className="relative aspect-video bg-brand-surface-2">
                {b.fotoDestaque ? (
                  <Image src={b.fotoDestaque} alt={b.nome} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-200" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-muted text-sm">
                    Sem foto
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                  <span className="bg-brand-surface/90 backdrop-blur-sm text-brand-text text-xs px-2 py-0.5 rounded-full border border-brand-border font-medium capitalize">
                    {CAT_LABEL[b.categoria] ?? b.categoria}
                  </span>
                  {b.destaque && (
                    <span className="bg-amber-500/90 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      ★ Destaque
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-semibold bg-blue-600 px-3 py-1.5 rounded-lg">
                    Editar brinquedo
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-brand-text font-semibold group-hover:text-blue-500 transition-colors leading-snug">
                    {b.nome}
                  </h3>
                  <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
                <p className="text-brand-muted text-xs">{b.faixaEtaria} · {b.capacidade}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
