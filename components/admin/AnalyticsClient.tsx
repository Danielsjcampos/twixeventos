'use client'

import { useState, useTransition } from 'react'
import {
  BarChart3, Eye, MousePointerClick, Search, Users, ExternalLink,
  Monitor, Smartphone, Tablet, Power, Loader2,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { setFlags } from '@/app/actions/configuracoes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Resumo {
  pageviews: number; cliques: number; buscas: number; saidas: number; visitantes: number
}
interface Props {
  resumo: Resumo
  porDia: { dia: string; total: number; visitantes: number }[]
  paginas: { path: string; total: number; visitantes: number }[]
  cliques: { rotulo: string | null; total: number }[]
  buscas: { termo: string | null; total: number }[]
  dispositivos: { device: string | null; total: number }[]
  referrers: { referrer: string | null; total: number }[]
  trackingAtivo: boolean
}

const fmtData = (d: string) => {
  const [, m, dia] = d.split('-')
  return `${dia}/${m}`
}

const deviceIcon = (d: string | null) =>
  d === 'mobile' ? Smartphone : d === 'tablet' ? Tablet : Monitor

const refLabel = (r: string | null) => {
  if (!r) return 'Direto / sem origem'
  try { return new URL(r).hostname.replace(/^www\./, '') } catch { return r }
}

export function AnalyticsClient(props: Props) {
  const { resumo, porDia, paginas, cliques, buscas, dispositivos, referrers } = props
  const [ativo, setAtivo] = useState(props.trackingAtivo)
  const [pending, startTransition] = useTransition()

  const toggleTracking = () => {
    const novo = !ativo
    setAtivo(novo)
    startTransition(async () => {
      try {
        await setFlags({ tracking_ativo: String(novo) })
        toast.success(novo ? 'Rastreamento ativado.' : 'Rastreamento desativado.')
      } catch {
        setAtivo(!novo)
        toast.error('Falha ao salvar a configuração.')
      }
    })
  }

  const cards = [
    { label: 'Visitantes', value: resumo.visitantes, icon: Users, cor: 'text-blue-500 bg-blue-500/10' },
    { label: 'Visualizações', value: resumo.pageviews, icon: Eye, cor: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Cliques', value: resumo.cliques, icon: MousePointerClick, cor: 'text-amber-500 bg-amber-500/10' },
    { label: 'Buscas', value: resumo.buscas, icon: Search, cor: 'text-purple-500 bg-purple-500/10' },
    { label: 'Saídas (links ext.)', value: resumo.saidas, icon: ExternalLink, cor: 'text-rose-500 bg-rose-500/10' },
  ]

  const totalDisp = dispositivos.reduce((s, d) => s + d.total, 0) || 1

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-text flex items-center gap-2">
            <BarChart3 className="size-6 text-brand-accent" />
            Analytics do Site
          </h1>
          <p className="text-brand-muted text-sm mt-1">
            Rastreamento próprio (first-party) — últimos 30 dias. Visualizações, cliques, buscas e origens.
          </p>
        </div>
        <button
          onClick={toggleTracking}
          disabled={pending}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors border',
            ativo
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/15'
              : 'bg-brand-surface-2 text-brand-muted border-brand-border hover:text-brand-text'
          )}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
          {ativo ? 'Rastreamento Ativo' : 'Rastreamento Desligado'}
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl border border-brand-border bg-brand-surface p-4 shadow-sm">
            <span className={cn('inline-flex items-center justify-center size-9 rounded-lg mb-3', c.cor)}>
              <c.icon className="size-4.5" />
            </span>
            <h3 className="text-2xl font-black text-brand-text">{c.value.toLocaleString('pt-BR')}</h3>
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Gráfico de Visualizações por dia */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm">
        <h3 className="text-sm font-bold text-brand-text mb-4">Visualizações por dia</h3>
        {porDia.length === 0 ? (
          <p className="text-brand-muted text-sm py-12 text-center">Ainda não há dados. Assim que o site receber visitas, os gráficos aparecem aqui.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={porDia} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gpv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-accent, #e11d48)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-brand-accent, #e11d48)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis dataKey="dia" tickFormatter={fmtData} fontSize={11} stroke="currentColor" opacity={0.5} />
                <YAxis fontSize={11} stroke="currentColor" opacity={0.5} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(label: any) => fmtData(String(label))}
                  contentStyle={{ background: 'var(--color-brand-surface, #fff)', border: '1px solid var(--color-brand-border, #ddd)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any, n: any) => [v, n === 'total' ? 'Visualizações' : 'Visitantes']}
                />
                <Area type="monotone" dataKey="total" stroke="var(--color-brand-accent, #e11d48)" strokeWidth={2} fill="url(#gpv)" />
                <Area type="monotone" dataKey="visitantes" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Grids de listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListaCard titulo="Páginas mais vistas" icon={Eye} vazio={paginas.length === 0}>
          {paginas.map((p, i) => (
            <LinhaRank key={p.path} pos={i + 1} label={p.path} valor={p.total} sub={`${p.visitantes} visit.`} maxValor={paginas[0]?.total ?? 1} />
          ))}
        </ListaCard>

        <ListaCard titulo="Cliques mais frequentes" icon={MousePointerClick} vazio={cliques.length === 0}>
          {cliques.map((c, i) => (
            <LinhaRank key={(c.rotulo ?? '') + i} pos={i + 1} label={c.rotulo ?? '—'} valor={c.total} maxValor={cliques[0]?.total ?? 1} />
          ))}
        </ListaCard>

        <ListaCard titulo="Palavras-chave buscadas no site" icon={Search} vazio={buscas.length === 0}>
          {buscas.map((b, i) => (
            <LinhaRank key={(b.termo ?? '') + i} pos={i + 1} label={b.termo ?? '—'} valor={b.total} maxValor={buscas[0]?.total ?? 1} />
          ))}
        </ListaCard>

        <ListaCard titulo="Origens do tráfego" icon={ExternalLink} vazio={referrers.length === 0}>
          {referrers.map((r, i) => (
            <LinhaRank key={(r.referrer ?? '') + i} pos={i + 1} label={refLabel(r.referrer)} valor={r.total} maxValor={referrers[0]?.total ?? 1} />
          ))}
        </ListaCard>
      </div>

      {/* Dispositivos */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm">
        <h3 className="text-sm font-bold text-brand-text mb-4 flex items-center gap-2">
          <Monitor className="size-4 text-brand-accent" /> Dispositivos
        </h3>
        {dispositivos.length === 0 ? (
          <p className="text-brand-muted text-sm text-center py-6">Sem dados.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {dispositivos.map(d => {
              const Icon = deviceIcon(d.device)
              const pct = Math.round((d.total / totalDisp) * 100)
              return (
                <div key={d.device ?? 'x'} className="text-center">
                  <Icon className="size-6 mx-auto text-brand-accent mb-2" />
                  <div className="text-2xl font-black text-brand-text">{pct}%</div>
                  <div className="text-xs text-brand-muted capitalize">{d.device ?? 'outro'} · {d.total}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ListaCard({ titulo, icon: Icon, vazio, children }: { titulo: string; icon: any; vazio: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-sm">
      <h3 className="text-sm font-bold text-brand-text mb-4 flex items-center gap-2">
        <Icon className="size-4 text-brand-accent" /> {titulo}
      </h3>
      {vazio ? (
        <p className="text-brand-muted text-sm text-center py-6">Sem dados ainda.</p>
      ) : (
        <div className="space-y-2.5">{children}</div>
      )}
    </div>
  )
}

function LinhaRank({ pos, label, valor, sub, maxValor }: { pos: number; label: string; valor: number; sub?: string; maxValor: number }) {
  const pct = Math.max(4, Math.round((valor / maxValor) * 100))
  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-3 text-sm relative z-10 px-2 py-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono font-bold text-brand-muted w-4 shrink-0">{pos}</span>
          <span className="text-brand-text font-medium truncate" title={label}>{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {sub && <span className="text-[10px] text-brand-muted">{sub}</span>}
          <span className="font-bold text-brand-text font-mono">{valor}</span>
        </div>
      </div>
      <div className="absolute inset-0 bg-brand-accent/5 rounded-md" style={{ width: `${pct}%` }} />
    </div>
  )
}
