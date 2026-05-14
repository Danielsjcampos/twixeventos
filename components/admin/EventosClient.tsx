'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, X, Check, Search, UserPlus, UserCheck, Coins, Medal, Star, Gem } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatCurrency } from '@/lib/utils'

// ─── Loyalty tiers ────────────────────────────────────────────────────────────
function getLoyaltyTier(totalEventos: number) {
  if (totalEventos >= 8) return { label: 'Diamante', icon: Gem,   color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/25',   pct: 8 }
  if (totalEventos >= 5) return { label: 'Ouro',     icon: Star,  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/25', pct: 7 }
  if (totalEventos >= 3) return { label: 'Prata',    icon: Medal, color: 'text-slate-300',  bg: 'bg-slate-400/10 border-slate-400/25',  pct: 6 }
  if (totalEventos >= 1) return { label: 'Bronze',   icon: Medal, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25', pct: 5 }
  return null
}

// ─── ClienteSearchResult type ─────────────────────────────────────────────────
interface ClienteResult {
  id: string
  nome: string
  telefone: string
  email: string | null
  cidade: string | null
  totalEventos: number
  cashbackSaldo: string | null
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Monitor {
  id: string
  nome: string
  telefone: string
  valorDia: string | null
}

interface EventoMonitor {
  id: string
  monitorId: string
  valorPago: string | null
  confirmado: boolean
  monitor: Monitor
}

interface Pagamento {
  id: string
  descricao: string
  valor: string
  tipo: string
  forma: string
  status: string
  dataPrevista: string | null
  dataRecebido: string | null
}

interface CheckItem { id: string; texto: string; concluido: boolean }

interface Evento {
  id: string
  nomeCliente: string
  telefoneCliente: string
  emailCliente: string | null
  dataEvento: string
  horarioInicio: string
  horarioFim: string | null
  enderecoCompleto: string
  regiaoEvento: string | null
  valorTotal: string | null
  valorEntrada: string | null
  valorRestante: string | null
  formaPagamento: string | null
  statusPagamento: string
  custoMonitores: string | null
  custoTransporte: string | null
  custosExtras: string | null
  status: string
  observacoes: string | null
  checklistMontagem?: CheckItem[] | unknown
  monitoresEvento?: EventoMonitor[]
  pagamentos?: Pagamento[]
}

// ─── Status configs ────────────────────────────────────────────────────────────

const STATUS_EVENTO = [
  { value: 'orcamento',     label: 'Orçamento',       color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  { value: 'confirmado',    label: 'Confirmado',       color: 'bg-green-500/10 text-green-400 border-green-500/30' },
  { value: 'em_preparo',    label: 'Em Preparo',       color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { value: 'em_andamento',  label: 'Em Andamento',     color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { value: 'finalizado',    label: 'Finalizado',       color: 'bg-brand-muted/20 text-brand-muted border-brand-border' },
  { value: 'cancelado',     label: 'Cancelado',        color: 'bg-red-500/10 text-red-400 border-red-500/30' },
]

const STATUS_PAG = [
  { value: 'pendente',  label: 'Pendente',  color: 'text-yellow-400' },
  { value: 'parcial',   label: 'Parcial',   color: 'text-blue-400' },
  { value: 'pago',      label: 'Pago',      color: 'text-green-400' },
  { value: 'cancelado', label: 'Cancelado', color: 'text-red-400' },
]

const FORMAS_PAG = ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'transferencia']

// ─── Main component ────────────────────────────────────────────────────────────

export function EventosClient({
  eventos: initial,
  monitoresDisponiveis,
}: {
  eventos: Evento[]
  monitoresDisponiveis: Monitor[]
}) {
  const [eventos, setEventos] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editEvento, setEditEvento] = useState<Evento | null>(null)
  const [filterStatus, setFilterStatus] = useState('todos')
  const [loading, setLoading] = useState(false)

  // Detailed evento data (loaded on expand)
  const [detail, setDetail] = useState<Record<string, Evento>>({})

  const filtered = useMemo(() =>
    filterStatus === 'todos' ? eventos : eventos.filter(e => e.status === filterStatus),
    [eventos, filterStatus]
  )

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!detail[id]) {
      try {
        const res = await fetch(`/api/admin/eventos/${id}`)
        const data = await res.json()
        setDetail(d => ({ ...d, [id]: data }))
      } catch {
        toast.error('Erro ao carregar evento')
      }
    }
  }

  const openNew = () => { setEditEvento(null); setShowForm(true) }
  const openEdit = (e: Evento) => { setEditEvento(e); setShowForm(true) }

  const afterSave = (saved: Evento) => {
    setEventos(es => {
      const idx = es.findIndex(e => e.id === saved.id)
      if (idx >= 0) return es.map((e, i) => i === idx ? { ...e, ...saved } : e)
      return [saved, ...es]
    })
    setDetail(d => ({ ...d, [saved.id]: saved }))
    setShowForm(false)
    setEditEvento(null)
  }

  const del = async (id: string) => {
    if (!confirm('Excluir este evento?')) return
    await fetch(`/api/admin/eventos/${id}`, { method: 'DELETE' })
    setEventos(es => es.filter(e => e.id !== id))
    toast.success('Evento excluído')
  }

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/eventos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const updated = await res.json()
    setEventos(es => es.map(e => e.id === id ? { ...e, status: updated.status } : e))
    setDetail(d => d[id] ? { ...d, [id]: { ...d[id], status: updated.status } } : d)
    toast.success('Status atualizado')
  }

  const eventoDetail = (id: string) => detail[id] ?? eventos.find(e => e.id === id)

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-brand-text uppercase">
            Agenda de Eventos
          </h1>
          <p className="text-brand-muted text-sm mt-1">{filtered.length} evento(s)</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="size-4" />
          Novo Evento
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setFilterStatus('todos')}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', filterStatus === 'todos' ? 'bg-brand-accent text-white' : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-brand-text')}
        >
          Todos
        </button>
        {STATUS_EVENTO.map(s => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border', filterStatus === s.value ? s.color + ' font-bold' : 'bg-brand-surface border-brand-border text-brand-muted hover:text-brand-text')}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <EventoForm
          evento={editEvento}
          onSave={afterSave}
          onCancel={() => { setShowForm(false); setEditEvento(null) }}
        />
      )}

      {/* Eventos list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-brand-surface border border-brand-border rounded-xl p-12 text-center text-brand-muted">
            Nenhum evento encontrado.
          </div>
        )}
        {filtered.map(evento => {
          const ev = eventoDetail(evento.id)
          const isExpanded = expanded === evento.id
          const statusInfo = STATUS_EVENTO.find(s => s.value === evento.status)

          return (
            <div key={evento.id} className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
              {/* Summary row */}
              <div className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-brand-text font-semibold truncate">{evento.nomeCliente}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border', statusInfo?.color ?? 'bg-brand-surface-2 text-brand-muted border-brand-border')}>
                      {statusInfo?.label ?? evento.status}
                    </span>
                  </div>
                  <p className="text-brand-muted text-sm mt-0.5">
                    📅 {formatDate(evento.dataEvento)} às {evento.horarioInicio}
                    {evento.horarioFim ? ` – ${evento.horarioFim}` : ''}
                  </p>
                  <p className="text-brand-muted text-sm truncate">📍 {evento.enderecoCompleto}</p>
                  {evento.valorTotal && (
                    <p className="text-brand-accent text-sm font-semibold mt-1">
                      Total: {formatCurrency(evento.valorTotal)}
                      {evento.statusPagamento && (
                        <span className={cn('ml-2 text-xs', STATUS_PAG.find(s => s.value === evento.statusPagamento)?.color ?? 'text-brand-muted')}>
                          ({evento.statusPagamento})
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(evento)} className="p-1.5 text-brand-muted hover:text-brand-accent rounded-lg hover:bg-brand-surface-2 transition-colors">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => del(evento.id)} className="p-1.5 text-brand-muted hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                  <button onClick={() => toggleExpand(evento.id)} className="p-1.5 text-brand-muted hover:text-brand-text rounded-lg hover:bg-brand-surface-2 transition-colors">
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-brand-border">
                  <EventoDetail
                    evento={ev!}
                    monitoresDisponiveis={monitoresDisponiveis}
                    onStatusChange={s => updateStatus(evento.id, s)}
                    onDetailUpdate={updated => setDetail(d => ({ ...d, [evento.id]: { ...d[evento.id], ...updated } }))}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── EventoDetail ─────────────────────────────────────────────────────────────

function EventoDetail({
  evento,
  monitoresDisponiveis,
  onStatusChange,
  onDetailUpdate,
}: {
  evento: Evento
  monitoresDisponiveis: Monitor[]
  onStatusChange: (s: string) => void
  onDetailUpdate: (data: Partial<Evento>) => void
}) {
  const [tab, setTab] = useState<'info' | 'financeiro' | 'monitores' | 'checklist'>('info')
  const [monitores, setMonitores] = useState(evento.monitoresEvento ?? [])
  const [pagamentos, setPagamentos] = useState(evento.pagamentos ?? [])

  // Monitor add state
  const [addingMonitor, setAddingMonitor] = useState(false)
  const [newMonitorId, setNewMonitorId] = useState('')
  const [newMonitorValor, setNewMonitorValor] = useState('')

  // Pagamento add state
  const [addingPag, setAddingPag] = useState(false)
  const [newPag, setNewPag] = useState({ descricao: '', valor: '', tipo: 'receita', forma: 'pix', status: 'pendente', dataPrevista: '' })

  const receitas = pagamentos.filter(p => p.tipo === 'receita' && p.status !== 'cancelado')
  const despesas = pagamentos.filter(p => p.tipo === 'despesa' && p.status !== 'cancelado')
  const totalReceitas = receitas.reduce((s, p) => s + Number(p.valor), 0)
  const totalDespesas = despesas.reduce((s, p) => s + Number(p.valor), 0)
  const lucro = totalReceitas - totalDespesas

  const addMonitor = async () => {
    if (!newMonitorId) { toast.error('Selecione um monitor'); return }
    const res = await fetch(`/api/admin/eventos/${evento.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'add_monitor', monitorId: newMonitorId, valorPago: newMonitorValor || null }),
    })
    const em = await res.json()
    const monitor = monitoresDisponiveis.find(m => m.id === newMonitorId)!
    setMonitores(ms => [...ms, { ...em, monitor }])
    setAddingMonitor(false)
    setNewMonitorId('')
    setNewMonitorValor('')
    toast.success('Monitor adicionado')
  }

  const removeMonitor = async (emId: string) => {
    await fetch(`/api/admin/eventos/${evento.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'remove_monitor', eventoMonitorId: emId }),
    })
    setMonitores(ms => ms.filter(m => m.id !== emId))
    toast.success('Monitor removido')
  }

  const confirmMonitor = async (em: EventoMonitor) => {
    await fetch(`/api/admin/eventos/${evento.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'update_monitor', eventoMonitorId: em.id, confirmado: !em.confirmado, valorPago: em.valorPago }),
    })
    setMonitores(ms => ms.map(m => m.id === em.id ? { ...m, confirmado: !m.confirmado } : m))
  }

  const addPagamento = async () => {
    if (!newPag.descricao || !newPag.valor) { toast.error('Preencha descrição e valor'); return }
    const res = await fetch(`/api/admin/eventos/${evento.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'add_pagamento', ...newPag }),
    })
    const p = await res.json()
    setPagamentos(ps => [...ps, p])
    setAddingPag(false)
    setNewPag({ descricao: '', valor: '', tipo: 'receita', forma: 'pix', status: 'pendente', dataPrevista: '' })
    toast.success('Lançamento adicionado')
  }

  const markPagamento = async (pag: Pagamento, status: string) => {
    const res = await fetch(`/api/admin/eventos/${evento.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'update_pagamento', pagamentoId: pag.id, updates: { status, dataRecebido: status === 'recebido' ? new Date().toISOString().slice(0, 10) : null } }),
    })
    const updated = await res.json()
    setPagamentos(ps => ps.map(p => p.id === pag.id ? { ...p, ...updated } : p))
    toast.success('Status atualizado')
  }

  const delPagamento = async (id: string) => {
    await fetch(`/api/admin/eventos/${evento.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'delete_pagamento', pagamentoId: id }),
    })
    setPagamentos(ps => ps.filter(p => p.id !== id))
    toast.success('Lançamento removido')
  }

  const TABS = [
    { key: 'info',       label: 'Detalhes' },
    { key: 'financeiro', label: `Financeiro${pagamentos.length ? ` (${pagamentos.length})` : ''}` },
    { key: 'monitores',  label: `Monitores${monitores.length ? ` (${monitores.length})` : ''}` },
    { key: 'checklist',  label: 'Checklist' },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-0 border-b border-brand-border overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              tab === t.key ? 'border-brand-accent text-brand-accent' : 'border-transparent text-brand-muted hover:text-brand-text'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Status change */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-brand-muted text-xs">Status:</span>
          {STATUS_EVENTO.map(s => (
            <button
              key={s.value}
              onClick={() => onStatusChange(s.value)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-all',
                evento.status === s.value ? s.color + ' font-bold scale-105' : 'bg-brand-surface-2 border-brand-border text-brand-muted hover:border-brand-accent/50'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* TAB: Info */}
        {tab === 'info' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoRow label="Cliente" value={evento.nomeCliente} />
            <InfoRow label="Telefone" value={evento.telefoneCliente} />
            {evento.emailCliente && <InfoRow label="Email" value={evento.emailCliente} />}
            <InfoRow label="Data" value={formatDate(evento.dataEvento)} />
            <InfoRow label="Horário" value={`${evento.horarioInicio}${evento.horarioFim ? ` – ${evento.horarioFim}` : ''}`} />
            <InfoRow label="Endereço" value={evento.enderecoCompleto} />
            {evento.regiaoEvento && <InfoRow label="Região" value={evento.regiaoEvento} />}
            {evento.observacoes && <InfoRow label="Observações" value={evento.observacoes} className="sm:col-span-2" />}
          </div>
        )}

        {/* TAB: Financeiro */}
        {tab === 'financeiro' && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                <p className="text-green-400 text-xs font-medium mb-1">Receitas</p>
                <p className="text-green-400 font-bold text-lg">{formatCurrency(totalReceitas)}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                <p className="text-red-400 text-xs font-medium mb-1">Despesas</p>
                <p className="text-red-400 font-bold text-lg">{formatCurrency(totalDespesas)}</p>
              </div>
              <div className={cn('rounded-xl p-3 text-center border', lucro >= 0 ? 'bg-brand-accent/10 border-brand-accent/20' : 'bg-red-500/10 border-red-500/20')}>
                <p className={cn('text-xs font-medium mb-1', lucro >= 0 ? 'text-brand-accent' : 'text-red-400')}>Lucro</p>
                <p className={cn('font-bold text-lg', lucro >= 0 ? 'text-brand-accent' : 'text-red-400')}>{formatCurrency(lucro)}</p>
              </div>
            </div>

            {/* Lançamentos */}
            <div className="space-y-2">
              {pagamentos.map(p => (
                <div key={p.id} className={cn('flex items-center gap-3 rounded-xl p-3 border text-sm', p.tipo === 'receita' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20')}>
                  <div className="flex-1 min-w-0">
                    <p className="text-brand-text font-medium truncate">{p.descricao}</p>
                    <p className="text-brand-muted text-xs">{p.forma} · {p.dataPrevista ? formatDate(p.dataPrevista) : 'sem data'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-bold', p.tipo === 'receita' ? 'text-green-400' : 'text-red-400')}>
                      {p.tipo === 'receita' ? '+' : '-'}{formatCurrency(p.valor)}
                    </p>
                    <p className={cn('text-xs', p.status === 'recebido' ? 'text-green-400' : p.status === 'cancelado' ? 'text-red-400' : 'text-yellow-400')}>
                      {p.status}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {p.status === 'pendente' && (
                      <button onClick={() => markPagamento(p, 'recebido')} className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors" title="Marcar recebido">
                        <Check className="size-3.5" />
                      </button>
                    )}
                    <button onClick={() => delPagamento(p.id)} className="p-1 text-brand-muted hover:text-red-500 rounded transition-colors">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add pagamento */}
            {addingPag ? (
              <div className="bg-brand-surface-2 border border-brand-border rounded-xl p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <input value={newPag.descricao} onChange={e => setNewPag(p => ({ ...p, descricao: e.target.value }))}
                      placeholder="Descrição (ex: Sinal entrada)"
                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent" />
                  </div>
                  <input type="number" step="0.01" value={newPag.valor} onChange={e => setNewPag(p => ({ ...p, valor: e.target.value }))}
                    placeholder="Valor (R$)"
                    className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent" />
                  <select value={newPag.tipo} onChange={e => setNewPag(p => ({ ...p, tipo: e.target.value }))}
                    className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent">
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                  <select value={newPag.forma} onChange={e => setNewPag(p => ({ ...p, forma: e.target.value }))}
                    className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent">
                    {FORMAS_PAG.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <input type="date" value={newPag.dataPrevista} onChange={e => setNewPag(p => ({ ...p, dataPrevista: e.target.value }))}
                    className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addPagamento} className="bg-brand-accent hover:bg-brand-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Adicionar</button>
                  <button onClick={() => setAddingPag(false)} className="text-brand-muted text-sm px-3 py-2 hover:bg-brand-surface rounded-lg transition-colors">Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingPag(true)}
                className="flex items-center gap-2 text-brand-accent text-sm hover:text-brand-accent-hover transition-colors">
                <Plus className="size-4" />
                Novo lançamento
              </button>
            )}
          </div>
        )}

        {/* TAB: Monitores */}
        {tab === 'monitores' && (
          <div className="space-y-3">
            {monitores.map(em => (
              <div key={em.id} className="flex items-center gap-3 bg-brand-surface-2 rounded-xl p-3">
                <div className="flex-1">
                  <p className="text-brand-text font-medium text-sm">{em.monitor.nome}</p>
                  <p className="text-brand-muted text-xs">{em.monitor.telefone}</p>
                  {em.valorPago && <p className="text-brand-accent text-xs mt-0.5">Pagamento: {formatCurrency(em.valorPago)}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => confirmMonitor(em)}
                    className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors', em.confirmado ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-brand-surface border-brand-border text-brand-muted hover:border-green-500/30')}
                  >
                    {em.confirmado ? <><Check className="size-3" /> Confirmado</> : 'Confirmar'}
                  </button>
                  <button onClick={() => removeMonitor(em.id)} className="p-1 text-brand-muted hover:text-red-500 transition-colors">
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ))}

            {addingMonitor ? (
              <div className="bg-brand-surface-2 border border-brand-border rounded-xl p-3 space-y-2">
                <select value={newMonitorId} onChange={e => setNewMonitorId(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent">
                  <option value="">Selecione um monitor</option>
                  {monitoresDisponiveis
                    .filter(m => !monitores.some(em => em.monitorId === m.id))
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.nome} {m.valorDia ? `(R$ ${m.valorDia}/dia)` : ''}</option>
                    ))
                  }
                </select>
                <input type="number" step="0.01" value={newMonitorValor} onChange={e => setNewMonitorValor(e.target.value)}
                  placeholder="Valor a pagar (R$)"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent" />
                <div className="flex gap-2">
                  <button onClick={addMonitor} className="bg-brand-accent hover:bg-brand-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Adicionar</button>
                  <button onClick={() => setAddingMonitor(false)} className="text-brand-muted text-sm px-3 py-2 hover:bg-brand-surface rounded-lg transition-colors">Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingMonitor(true)}
                className="flex items-center gap-2 text-brand-accent text-sm hover:text-brand-accent-hover transition-colors">
                <Plus className="size-4" />
                Adicionar monitor
              </button>
            )}
          </div>
        )}

        {/* TAB: Checklist */}
        {tab === 'checklist' && (
          <ChecklistTab eventoId={evento.id} checklistMontagem={evento.checklistMontagem as CheckItem[]} />
        )}
      </div>
    </div>
  )
}

// ─── EventoForm ───────────────────────────────────────────────────────────────

interface EventoFormData {
  nomeCliente: string
  telefoneCliente: string
  emailCliente: string
  dataEvento: string
  horarioInicio: string
  horarioFim: string
  enderecoCompleto: string
  regiaoEvento: string
  valorTotal: string
  valorEntrada: string
  formaPagamento: string
  statusPagamento: string
  status: string
  custoTransporte: string
  custosExtras: string
  observacoes: string
}

const emptyForm: EventoFormData = {
  nomeCliente: '', telefoneCliente: '', emailCliente: '',
  dataEvento: '', horarioInicio: '', horarioFim: '',
  enderecoCompleto: '', regiaoEvento: '',
  valorTotal: '', valorEntrada: '',
  formaPagamento: 'pix', statusPagamento: 'pendente',
  status: 'confirmado',
  custoTransporte: '', custosExtras: '',
  observacoes: '',
}

// ─── ClienteSelector ─────────────────────────────────────────────────────────

function ClienteSelector({ onSelect, disabled }: {
  onSelect: (c: ClienteResult | null) => void
  disabled?: boolean
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClienteResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selected, setSelected] = useState<ClienteResult | null>(null)
  const [modoNovo, setModoNovo] = useState(false)
  const [novoForm, setNovoForm] = useState({ nome: '', telefone: '', email: '', cidade: '' })
  const [criando, setCriando] = useState(false)
  const [descontoCashback, setDescontoCashback] = useState(0)
  const dropRef = useRef<HTMLDivElement>(null)

  const buscar = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setShowDropdown(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/clientes?search=${encodeURIComponent(q)}`)
      const data: ClienteResult[] = await res.json()
      setResults(data.slice(0, 6))
      setShowDropdown(true)
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [])

  // Debounce busca
  useEffect(() => {
    const t = setTimeout(() => buscar(query), 280)
    return () => clearTimeout(t)
  }, [query, buscar])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selecionar = (c: ClienteResult) => {
    setSelected(c)
    setDescontoCashback(0)
    setQuery('')
    setShowDropdown(false)
    setModoNovo(false)
    onSelect(c)
  }

  const limpar = () => {
    setSelected(null)
    setDescontoCashback(0)
    setQuery('')
    setModoNovo(false)
    onSelect(null)
  }

  const criarNovo = async () => {
    if (!novoForm.nome || !novoForm.telefone) { toast.error('Nome e telefone obrigatórios'); return }
    setCriando(true)
    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoForm),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro')
      const novo: ClienteResult = await res.json()
      toast.success('Cliente cadastrado!')
      selecionar({ ...novo, totalEventos: 0, cashbackSaldo: '0' })
      setModoNovo(false)
      setNovoForm({ nome: '', telefone: '', email: '', cidade: '' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar')
    } finally { setCriando(false) }
  }

  const aplicarDesconto = () => {
    if (!selected) return
    const saldo = parseFloat(selected.cashbackSaldo ?? '0')
    setDescontoCashback(saldo)
    onSelect({ ...selected, _descontoCashback: saldo } as ClienteResult & { _descontoCashback: number })
  }

  const removerDesconto = () => {
    setDescontoCashback(0)
    if (selected) onSelect(selected)
  }

  // ── Painel quando cliente selecionado ──────────────────────────────────────
  if (selected) {
    const saldo = parseFloat(selected.cashbackSaldo ?? '0')
    const tier = getLoyaltyTier(selected.totalEventos)
    const TierIcon = tier?.icon

    return (
      <div className="space-y-3">
        {/* Card do cliente selecionado */}
        <div className="flex items-center gap-3 bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-3">
          <div className="w-9 h-9 rounded-xl bg-brand-accent/15 flex items-center justify-center text-brand-accent font-bold text-sm shrink-0">
            {selected.nome.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-brand-text font-semibold text-sm truncate">{selected.nome}</p>
            <p className="text-brand-muted text-xs">{selected.telefone}
              {selected.totalEventos > 0 && <span className="ml-2">· {selected.totalEventos} festa{selected.totalEventos !== 1 ? 's' : ''}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {tier && TierIcon && (
              <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border', tier.bg, tier.color)}>
                <TierIcon className="size-3" /> {tier.label}
              </span>
            )}
            {!disabled && (
              <button onClick={limpar} className="p-1 text-brand-muted hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cashback */}
        {saldo > 0 && (
          <div className={cn('rounded-xl p-3 border', descontoCashback > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/5 border-emerald-500/20')}>
            {descontoCashback > 0 ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="size-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-amber-300 text-xs font-semibold">Desconto de cashback aplicado</p>
                    <p className="text-amber-400 font-bold tabular-nums">- R$ {descontoCashback.toFixed(2)}</p>
                  </div>
                </div>
                <button onClick={removerDesconto} className="text-brand-muted hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">
                  Remover
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="size-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-emerald-300 text-xs font-medium">Cashback disponível</p>
                    <p className="text-emerald-400 font-bold tabular-nums">R$ {saldo.toFixed(2)}</p>
                  </div>
                </div>
                <button
                  onClick={aplicarDesconto}
                  className="flex items-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Coins className="size-3" /> Usar como desconto
                </button>
              </div>
            )}
          </div>
        )}

        {/* Próximo tier */}
        {selected.totalEventos > 0 && tier && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex gap-1">
              {[1,2,3,4,5,6,7,8].map(n => (
                <div key={n} className={cn('h-1.5 w-5 rounded-full', n <= selected.totalEventos ? 'bg-brand-accent' : 'bg-brand-border')} />
              ))}
            </div>
            <p className="text-brand-muted text-[10px]">{selected.totalEventos} festa{selected.totalEventos !== 1 ? 's' : ''} · {tier.label}</p>
          </div>
        )}
      </div>
    )
  }

  // ── Modo cadastro rápido ───────────────────────────────────────────────────
  if (modoNovo) {
    return (
      <div className="border border-brand-border rounded-xl p-4 space-y-3 bg-brand-surface-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-text flex items-center gap-2"><UserPlus className="size-4 text-brand-accent" /> Novo cliente</p>
          <button onClick={() => setModoNovo(false)} className="text-brand-muted hover:text-brand-text"><X className="size-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input value={novoForm.nome} onChange={e => setNovoForm(f => ({ ...f, nome: e.target.value }))}
            placeholder="Nome completo *" className={inp} />
          <input value={novoForm.telefone} onChange={e => setNovoForm(f => ({ ...f, telefone: e.target.value }))}
            placeholder="Telefone *" className={inp} />
          <input value={novoForm.email} onChange={e => setNovoForm(f => ({ ...f, email: e.target.value }))}
            type="email" placeholder="E-mail" className={inp} />
          <input value={novoForm.cidade} onChange={e => setNovoForm(f => ({ ...f, cidade: e.target.value }))}
            placeholder="Cidade" className={inp} />
        </div>
        <button onClick={criarNovo} disabled={criando}
          className="w-full flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
          <UserPlus className="size-4" />
          {criando ? 'Cadastrando...' : 'Cadastrar e selecionar'}
        </button>
      </div>
    )
  }

  // ── Busca ─────────────────────────────────────────────────────────────────
  return (
    <div ref={dropRef} className="relative space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-brand-muted pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder="Buscar cliente por nome ou telefone..."
          className={cn(inp, 'pl-9 pr-9')}
        />
        {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 size-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />}
      </div>

      {/* Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-brand-surface border border-brand-border rounded-xl shadow-2xl overflow-hidden">
          {results.map(c => {
            const saldo = parseFloat(c.cashbackSaldo ?? '0')
            const tier = getLoyaltyTier(c.totalEventos)
            const TierIcon = tier?.icon
            return (
              <button
                key={c.id}
                onClick={() => selecionar(c)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-surface-2 transition-colors text-left border-b border-brand-border/50 last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold text-xs shrink-0">
                  {c.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-brand-text text-sm font-medium truncate">{c.nome}</p>
                  <p className="text-brand-muted text-xs">{c.telefone} · {c.totalEventos} festa{c.totalEventos !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {saldo > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      💰 R$ {saldo.toFixed(2)}
                    </span>
                  )}
                  {tier && TierIcon && (
                    <span className={cn('flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border', tier.bg, tier.color)}>
                      <TierIcon className="size-2.5" /> {tier.label}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {showDropdown && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-brand-surface border border-brand-border rounded-xl shadow-2xl p-4 text-center">
          <p className="text-brand-muted text-sm mb-3">Nenhum cliente encontrado para &ldquo;{query}&rdquo;</p>
          <button onClick={() => { setModoNovo(true); setNovoForm(n => ({ ...n, nome: query })); setShowDropdown(false) }}
            className="flex items-center justify-center gap-2 w-full bg-brand-accent/10 hover:bg-brand-accent/20 border border-brand-accent/25 text-brand-accent text-sm font-semibold py-2 rounded-xl transition-colors">
            <UserPlus className="size-4" /> Cadastrar &ldquo;{query}&rdquo; como novo cliente
          </button>
        </div>
      )}

      <button
        onClick={() => { setModoNovo(true); setShowDropdown(false) }}
        className="flex items-center gap-2 text-brand-muted hover:text-brand-accent text-xs transition-colors"
      >
        <UserPlus className="size-3.5" /> Cadastrar novo cliente
      </button>
    </div>
  )
}

const inp = 'w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors'

function EventoForm({ evento, onSave, onCancel }: {
  evento: Evento | null
  onSave: (e: Evento) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<EventoFormData>(evento ? {
    nomeCliente: evento.nomeCliente,
    telefoneCliente: evento.telefoneCliente,
    emailCliente: evento.emailCliente ?? '',
    dataEvento: evento.dataEvento,
    horarioInicio: evento.horarioInicio,
    horarioFim: evento.horarioFim ?? '',
    enderecoCompleto: evento.enderecoCompleto,
    regiaoEvento: evento.regiaoEvento ?? '',
    valorTotal: evento.valorTotal ?? '',
    valorEntrada: evento.valorEntrada ?? '',
    formaPagamento: evento.formaPagamento ?? 'pix',
    statusPagamento: evento.statusPagamento,
    status: evento.status,
    custoTransporte: evento.custoTransporte ?? '',
    custosExtras: evento.custosExtras ?? '',
    observacoes: evento.observacoes ?? '',
  } : emptyForm)

  const [loading, setLoading] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<(ClienteResult & { _descontoCashback?: number }) | null>(null)

  const set = (k: keyof EventoFormData, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleClienteSelect = (c: (ClienteResult & { _descontoCashback?: number }) | null) => {
    setClienteSelecionado(c)
    if (c) {
      setForm(f => ({
        ...f,
        nomeCliente: c.nome,
        telefoneCliente: c.telefone,
        emailCliente: c.email ?? f.emailCliente,
      }))
    }
  }

  // Valor total com desconto aplicado
  const valorComDesconto = (() => {
    const vt = parseFloat(form.valorTotal || '0')
    const desc = clienteSelecionado?._descontoCashback ?? 0
    if (!vt || !desc) return null
    return Math.max(0, vt - desc)
  })()

  const submit = async () => {
    if (!form.nomeCliente || !form.telefoneCliente || !form.dataEvento || !form.horarioInicio || !form.enderecoCompleto) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    setLoading(true)
    try {
      const desconto = clienteSelecionado?._descontoCashback ?? 0
      const valorFinal = desconto && form.valorTotal
        ? String(Math.max(0, parseFloat(form.valorTotal) - desconto))
        : form.valorTotal

      const payload = {
        ...form,
        valorTotal: valorFinal || null,
        valorEntrada: form.valorEntrada || null,
        valorRestante: valorFinal && form.valorEntrada
          ? String(Number(valorFinal) - Number(form.valorEntrada))
          : null,
        emailCliente: form.emailCliente || null,
        horarioFim: form.horarioFim || null,
        regiaoEvento: form.regiaoEvento || null,
        custoTransporte: form.custoTransporte || null,
        custosExtras: form.custosExtras || null,
        observacoes: form.observacoes || null,
      }

      const url = evento ? `/api/admin/eventos/${evento.id}` : '/api/admin/eventos'
      const method = evento ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const saved = await res.json()

      // Registrar resgate de cashback se aplicado
      if (!evento && desconto > 0 && clienteSelecionado) {
        await fetch(`/api/admin/clientes/${clienteSelecionado.id}/resgate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            valor: desconto,
            eventoId: saved.id,
            descricao: `Desconto aplicado na festa de ${form.dataEvento}`,
          }),
        }).catch(() => {/* non-blocking */})
      }

      onSave(saved)
      toast.success(evento ? 'Evento atualizado' : 'Evento criado!')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-brand-surface border border-brand-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92dvh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-brand-border shrink-0">
          <h2 className="font-bold text-brand-text text-lg">{evento ? 'Editar Evento' : 'Novo Evento'}</h2>
          <button onClick={onCancel} className="p-1.5 text-brand-muted hover:text-brand-text rounded-lg hover:bg-brand-surface-2 transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Seletor de cliente (apenas em novo evento) */}
          {!evento ? (
            <>
              <SectionTitle>Cliente</SectionTitle>
              <ClienteSelector onSelect={handleClienteSelect} />
              {/* Campos manuais se não tiver cliente selecionado */}
              {!clienteSelecionado && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field label="Nome do cliente *" value={form.nomeCliente} onChange={v => set('nomeCliente', v)} placeholder="Nome completo" />
                  <Field label="Telefone *" value={form.telefoneCliente} onChange={v => set('telefoneCliente', v)} placeholder="(12) 99999-0000" />
                  <Field label="Email" value={form.emailCliente} onChange={v => set('emailCliente', v)} placeholder="email@exemplo.com" type="email" className="sm:col-span-2" />
                </div>
              )}
            </>
          ) : (
            <>
              <SectionTitle>Cliente</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nome do cliente *" value={form.nomeCliente} onChange={v => set('nomeCliente', v)} placeholder="Nome completo" />
                <Field label="Telefone *" value={form.telefoneCliente} onChange={v => set('telefoneCliente', v)} placeholder="(12) 99999-0000" />
                <Field label="Email" value={form.emailCliente} onChange={v => set('emailCliente', v)} placeholder="email@exemplo.com" type="email" className="sm:col-span-2" />
              </div>
            </>
          )}

          <SectionTitle>Evento</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Data *" value={form.dataEvento} onChange={v => set('dataEvento', v)} type="date" />
            <Field label="Horário início *" value={form.horarioInicio} onChange={v => set('horarioInicio', v)} type="time" />
            <Field label="Horário fim" value={form.horarioFim} onChange={v => set('horarioFim', v)} type="time" />
            <Field label="Endereço *" value={form.enderecoCompleto} onChange={v => set('enderecoCompleto', v)} placeholder="Rua, número, bairro" className="sm:col-span-2" />
            <Field label="Região" value={form.regiaoEvento} onChange={v => set('regiaoEvento', v)} placeholder="SJC, Jacareí..." />
          </div>

          <SectionTitle>Financeiro</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Field label="Valor total (R$)" value={form.valorTotal} onChange={v => set('valorTotal', v)} type="number" step="0.01" placeholder="0.00" />
              {valorComDesconto !== null && (
                <p className="text-xs text-amber-400 mt-1 font-semibold tabular-nums">
                  Com desconto: R$ {valorComDesconto.toFixed(2)} <span className="text-brand-muted font-normal">(- R$ {(clienteSelecionado?._descontoCashback ?? 0).toFixed(2)} cashback)</span>
                </p>
              )}
            </div>
            <Field label="Entrada paga (R$)" value={form.valorEntrada} onChange={v => set('valorEntrada', v)} type="number" step="0.01" placeholder="0.00" />
            <div>
              <label className="text-brand-muted text-xs mb-1 block">Forma de pagamento</label>
              <select value={form.formaPagamento} onChange={e => set('formaPagamento', e.target.value)}
                className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent">
                {FORMAS_PAG.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-brand-muted text-xs mb-1 block">Status pagamento</label>
              <select value={form.statusPagamento} onChange={e => set('statusPagamento', e.target.value)}
                className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent">
                {STATUS_PAG.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <Field label="Custo transporte (R$)" value={form.custoTransporte} onChange={v => set('custoTransporte', v)} type="number" step="0.01" placeholder="0.00" />
            <Field label="Custos extras (R$)" value={form.custosExtras} onChange={v => set('custosExtras', v)} type="number" step="0.01" placeholder="0.00" />
          </div>

          <SectionTitle>Status do Evento</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {STATUS_EVENTO.map(s => (
              <button key={s.value} onClick={() => set('status', s.value)}
                className={cn('text-xs px-3 py-1.5 rounded-full border transition-all font-medium', form.status === s.value ? s.color + ' font-bold' : 'bg-brand-surface-2 border-brand-border text-brand-muted hover:border-brand-accent/50')}>
                {s.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-brand-muted text-xs mb-1 block">Observações</label>
            <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
              rows={2} placeholder="Informações extras..."
              className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent resize-none" />
          </div>
        </div>

        <div className="p-4 border-t border-brand-border shrink-0 flex gap-3">
          <button onClick={submit} disabled={loading}
            className="flex-1 bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? 'Salvando...' : evento ? 'Salvar alterações' : (
              clienteSelecionado ? <><UserCheck className="size-4" /> Criar evento para {clienteSelecionado.nome.split(' ')[0]}</> : 'Criar evento'
            )}
          </button>
          <button onClick={onCancel} className="px-4 py-3 text-brand-muted hover:text-brand-text hover:bg-brand-surface-2 rounded-xl transition-colors text-sm">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Checklist Tab ────────────────────────────────────────────────────────────

function ChecklistTab({ eventoId, checklistMontagem }: { eventoId: string; checklistMontagem: CheckItem[] }) {
  const [items, setItems] = useState<CheckItem[]>(checklistMontagem ?? [])
  const [saving, setSaving] = useState(false)

  const toggle = async (idx: number) => {
    const updated = items.map((item, i) => i === idx ? { ...item, concluido: !item.concluido } : item)
    setItems(updated)
    setSaving(true)
    await fetch(`/api/admin/eventos/${eventoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistMontagem: updated }),
    })
    setSaving(false)
  }

  const done = items.filter(i => i.concluido).length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-brand-muted text-sm">Montagem: {done}/{items.length} concluídos</p>
        {saving && <span className="text-brand-muted text-xs">Salvando...</span>}
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <button key={item.id} onClick={() => toggle(idx)}
            className={cn('w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors', item.concluido ? 'bg-green-500/10 border-green-500/20' : 'bg-brand-surface-2 border-brand-border hover:border-brand-accent/30')}>
            <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors', item.concluido ? 'bg-green-500 border-green-500' : 'border-brand-border')}>
              {item.concluido && <Check className="size-3 text-white" />}
            </div>
            <span className={cn('text-sm', item.concluido ? 'text-green-400 line-through' : 'text-brand-text')}>{item.texto}</span>
          </button>
        ))}
        {items.length === 0 && <p className="text-brand-muted text-sm">Nenhum item no checklist.</p>}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value, className }: { label: string; value: string | null; className?: string }) {
  if (!value) return null
  return (
    <div className={className}>
      <p className="text-brand-muted text-xs">{label}</p>
      <p className="text-brand-text">{value}</p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-brand-accent text-xs font-semibold uppercase tracking-wide mt-2">{children}</p>
}

function Field({ label, value, onChange, placeholder, type = 'text', step, className }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; step?: string; className?: string
}) {
  return (
    <div className={className}>
      <label className="text-brand-muted text-xs mb-1 block">{label}</label>
      <input type={type} step={step} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors" />
    </div>
  )
}

function formatDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
