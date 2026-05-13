'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import { toast } from 'sonner'
import { Search, Filter, TrendingUp, TrendingDown, Users, Package, X, Plus } from 'lucide-react'
import { STATUS_KANBAN, formatCurrency } from '@/lib/utils'
import { KanbanCard } from './KanbanCard'
import { LeadModal } from './LeadModal'
import { EventoRapidoModal } from './EventoRapidoModal'
import { NovoLeadModal } from './NovoLeadModal'
import { Button } from '@/components/ui/button'
import type { Lead, LeadComInteracoes, KanbanColumn } from '@/types'

interface CrmStats {
  total: number
  convertidos: number
  perdidos: number
  taxaConversao: number
  valorConvertido: number
  valorPerdido: number
  topBrinquedo: string | null
  origens: string[]
  todosBrinquedos: string[]
}

interface Props {
  initialLeads?: Lead[]
  stats: CrmStats
}

const ORIGEM_LABEL: Record<string, string> = {
  site: 'Site', bio: 'Bio', indicacao: 'Indicação', instagram: 'Instagram', outro: 'Outro',
}

const COLUNAS_VISIVEIS = STATUS_KANBAN.filter(s => s.id !== 'realizado' && s.id !== 'perdido')

function buildColumns(leads: Lead[]): KanbanColumn[] {
  return COLUNAS_VISIVEIS.map(status => ({
    ...status,
    leads: leads.filter(l => l.status === status.id),
  }))
}

export function KanbanBoard({ initialLeads, stats }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads ?? [])
  const [selectedLead, setSelectedLead] = useState<LeadComInteracoes | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [novoLeadOpen, setNovoLeadOpen] = useState(false)

  // Filtros
  const [search, setSearch] = useState('')
  const [origemFiltro, setOrigemFiltro] = useState('')
  const [brinquedoFiltro, setBrinquedoFiltro] = useState('')

  // Confirmado → evento modal
  const [confirmarLead, setConfirmarLead] = useState<Lead | null>(null)
  const [pendingConfirmar, setPendingConfirmar] = useState<{ leadId: string } | null>(null)

  // Perda dialog
  const [perdaDialogOpen, setPerdaDialogOpen] = useState(false)
  const [perdaLeadId, setPerdaLeadId] = useState<string | null>(null)
  const [perdaMotivo, setPerdaMotivo] = useState('')
  const [pendingDrop, setPendingDrop] = useState<{ leadId: string; novoStatus: string } | null>(null)
  const [pendingSourceStatus, setPendingSourceStatus] = useState<string>('')

  // Drag scroll no board
  const boardRef = useRef<HTMLDivElement>(null)
  const isDraggingScroll = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const onDown = (e: MouseEvent) => {
      // Só ativa drag-scroll se não for um card sendo arrastado
      if ((e.target as HTMLElement).closest('[data-rbd-draggable-id]')) return
      isDraggingScroll.current = true
      startX.current = e.pageX - el.offsetLeft
      scrollLeft.current = el.scrollLeft
      el.style.cursor = 'grabbing'
      el.style.userSelect = 'none'
    }
    const onUp = () => {
      isDraggingScroll.current = false
      el.style.cursor = ''
      el.style.userSelect = ''
    }
    const onMove = (e: MouseEvent) => {
      if (!isDraggingScroll.current) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      el.scrollLeft = scrollLeft.current - (x - startX.current)
    }
    el.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    el.addEventListener('mousemove', onMove)
    return () => {
      el.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      el.removeEventListener('mousemove', onMove)
    }
  }, [])

  // Leads filtrados
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = !search || l.nome.toLowerCase().includes(search.toLowerCase()) || l.telefone.includes(search)
      const matchOrigem = !origemFiltro || l.origem === origemFiltro
      const matchBrinquedo = !brinquedoFiltro || (l.brinquedosInteresse ?? []).includes(brinquedoFiltro)
      return matchSearch && matchOrigem && matchBrinquedo
    })
  }, [leads, search, origemFiltro, brinquedoFiltro])

  const columns = buildColumns(filteredLeads)
  const temFiltro = !!(search || origemFiltro || brinquedoFiltro)

  const patchLeadStatus = useCallback(async (leadId: string, novoStatus: string, motivo?: string) => {
    const body: Record<string, string> = { status: novoStatus }
    if (motivo) body.motivoPerda = motivo
    const res = await fetch(`/api/admin/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error()
  }, [])

  const applyStatusChange = useCallback((leadId: string, novoStatus: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: novoStatus } : l))
  }, [])

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const novoStatus = destination.droppableId

    if (novoStatus === 'perdido') {
      setPerdaLeadId(draggableId)
      setPendingDrop({ leadId: draggableId, novoStatus })
      setPendingSourceStatus(source.droppableId)
      setPerdaDialogOpen(true)
      return
    }

    if (novoStatus === 'confirmado') {
      const lead = leads.find(l => l.id === draggableId)
      if (lead) {
        setPendingConfirmar({ leadId: draggableId })
        setPendingSourceStatus(source.droppableId)
        setConfirmarLead(lead)
      }
      return
    }

    applyStatusChange(draggableId, novoStatus)
    try {
      await patchLeadStatus(draggableId, novoStatus)
      toast.success('Status atualizado')
    } catch {
      applyStatusChange(draggableId, source.droppableId)
      toast.error('Erro ao atualizar status')
    }
  }, [applyStatusChange, patchLeadStatus, leads])

  const confirmPerda = async () => {
    if (!pendingDrop) return
    const { leadId, novoStatus } = pendingDrop
    applyStatusChange(leadId, novoStatus)
    setPerdaDialogOpen(false)
    try {
      await patchLeadStatus(leadId, novoStatus, perdaMotivo)
      toast.success('Lead marcado como perdido')
    } catch {
      applyStatusChange(leadId, pendingSourceStatus)
      toast.error('Erro ao atualizar status')
    } finally {
      setPerdaLeadId(null); setPerdaMotivo(''); setPendingDrop(null)
    }
  }

  const cancelPerda = () => {
    setPerdaDialogOpen(false); setPerdaLeadId(null); setPerdaMotivo(''); setPendingDrop(null)
  }

  const handleEventoSuccess = async () => {
    if (!pendingConfirmar) return
    applyStatusChange(pendingConfirmar.leadId, 'confirmado')
    setConfirmarLead(null); setPendingConfirmar(null)
    // Refresh leads
    try {
      const res = await fetch('/api/admin/leads')
      if (res.ok) setLeads(await res.json())
    } catch { /* silently */ }
  }

  const handleEventoCancel = () => {
    setConfirmarLead(null); setPendingConfirmar(null)
  }

  const handleCardClick = async (lead: Lead) => {
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`)
      if (!res.ok) throw new Error()
      setSelectedLead(await res.json())
      setModalOpen(true)
    } catch { toast.error('Erro ao abrir lead') }
  }

  const handleModalUpdate = async () => {
    try {
      const res = await fetch('/api/admin/leads')
      if (res.ok) setLeads(await res.json())
    } catch { /* silently */ }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-brand-text">CRM — Leads</h1>
          <p className="text-xs text-brand-muted mt-0.5">{stats.total} leads no total</p>
        </div>
        <button
          onClick={() => setNovoLeadOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard
          label="Total de Leads"
          value={stats.total}
          sub={`${stats.total - stats.convertidos - stats.perdidos} em andamento`}
          icon={<Users size={16} />}
          color="#3B82F6"
        />
        <KpiCard
          label="Taxa de Conversão"
          value={`${stats.taxaConversao}%`}
          sub={`${stats.convertidos} convertidos`}
          icon={<TrendingUp size={16} />}
          color="#10B981"
        />
        <KpiCard
          label="Valor Convertido"
          value={formatCurrency(stats.valorConvertido)}
          sub={`${stats.convertidos} confirmados/realizados`}
          icon={<TrendingUp size={16} />}
          color="#8B5CF6"
        />
        <KpiCard
          label="Valor Perdido"
          value={formatCurrency(stats.valorPerdido)}
          sub={`${stats.perdidos} leads perdidos`}
          icon={<TrendingDown size={16} />}
          color="#EF4444"
        />
      </div>

      {stats.topBrinquedo && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm" style={{ borderColor: 'var(--brand-border)', backgroundColor: 'var(--brand-surface-2)' }}>
          <Package size={14} className="text-brand-accent flex-shrink-0" />
          <span className="text-brand-muted">Brinquedo que mais gera leads:</span>
          <span className="font-semibold text-brand-text">{stats.topBrinquedo}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm text-brand-text bg-brand-surface border-brand-border focus:outline-none focus:border-brand-accent"
          />
        </div>

        <select
          value={origemFiltro}
          onChange={e => setOrigemFiltro(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm text-brand-text bg-brand-surface border-brand-border focus:outline-none focus:border-brand-accent"
        >
          <option value="">Todas as origens</option>
          {stats.origens.map(o => <option key={o} value={o}>{ORIGEM_LABEL[o] ?? o}</option>)}
        </select>

        <select
          value={brinquedoFiltro}
          onChange={e => setBrinquedoFiltro(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm text-brand-text bg-brand-surface border-brand-border focus:outline-none focus:border-brand-accent"
        >
          <option value="">Todos os brinquedos</option>
          {stats.todosBrinquedos.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        {temFiltro && (
          <button
            onClick={() => { setSearch(''); setOrigemFiltro(''); setBrinquedoFiltro('') }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
          >
            <X size={13} /> Limpar
          </button>
        )}
      </div>

      {temFiltro && (
        <p className="text-xs text-brand-muted mb-3">
          <Filter size={11} className="inline mr-1" />
          {filteredLeads.length} lead(s) encontrado(s)
        </p>
      )}

      {/* Kanban Board */}
      <div
        ref={boardRef}
        className="overflow-x-auto pb-4 select-none"
        style={{ cursor: 'grab' }}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 min-w-max">
            {columns.map(col => {
              const valorCol = col.leads.reduce((s, l) => s + parseFloat(l.valorProposto ?? '0'), 0)
              return (
                <div key={col.id} className="flex flex-col w-[280px] flex-shrink-0">
                  {/* Column header */}
                  <div
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-2"
                    style={{ backgroundColor: `${col.cor}15`, border: `1px solid ${col.cor}30` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.cor }} />
                      <span className="text-sm font-semibold text-brand-text">{col.label}</span>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${col.cor}25`, color: col.cor }}
                    >
                      {col.leads.length}
                    </span>
                  </div>

                  {/* Column summary */}
                  {col.leads.length > 0 && (
                    <div className="px-2 py-1.5 mb-2 rounded-lg text-xs flex items-center justify-between" style={{ backgroundColor: 'var(--brand-surface-2)' }}>
                      <span className="text-brand-muted">{col.leads.length} lead{col.leads.length !== 1 ? 's' : ''}</span>
                      {valorCol > 0 && <span className="font-semibold" style={{ color: col.cor }}>{formatCurrency(valorCol)}</span>}
                    </div>
                  )}

                  {/* Droppable area */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 flex flex-col gap-2 min-h-[120px] p-1 rounded-xl transition-colors duration-150"
                        style={{ backgroundColor: snapshot.isDraggingOver ? `${col.cor}10` : 'transparent' }}
                      >
                        {col.leads.map((lead, index) => (
                          <KanbanCard key={lead.id} lead={lead} index={index} onClick={handleCardClick} />
                        ))}
                        {provided.placeholder}
                        {col.leads.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed text-xs transition-colors" style={{ borderColor: `${col.cor}25`, color: 'var(--brand-muted)' }}>
                            Arraste leads aqui
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Dialog perda */}
      {perdaDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl flex flex-col gap-4" style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}>
            <div>
              <h2 className="text-lg font-bold text-brand-text">Marcar como perdido</h2>
              <p className="text-sm text-brand-muted mt-1">Informe o motivo da perda para o histórico.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-brand-muted">Motivo (opcional)</label>
              <textarea
                className="w-full rounded-lg border px-3 py-2 text-sm text-brand-text bg-brand-surface-2 border-brand-border focus:outline-none focus:border-brand-accent resize-none"
                rows={3}
                placeholder="Ex: Preço fora do orçamento, escolheu outra empresa..."
                value={perdaMotivo}
                onChange={e => setPerdaMotivo(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={cancelPerda} className="text-brand-muted">Cancelar</Button>
              <Button onClick={confirmPerda} className="bg-red-600 hover:bg-red-700 text-white">Confirmar perda</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal evento rápido */}
      {confirmarLead && (
        <EventoRapidoModal
          lead={confirmarLead}
          onSuccess={handleEventoSuccess}
          onCancel={handleEventoCancel}
        />
      )}

      {/* Lead detail modal */}
      <LeadModal
        lead={selectedLead}
        onClose={() => { setModalOpen(false); setSelectedLead(null) }}
        onUpdate={handleModalUpdate}
      />

      {/* Novo Lead Modal */}
      <NovoLeadModal
        open={novoLeadOpen}
        onClose={() => setNovoLeadOpen(false)}
        onCreated={(lead) => setLeads(prev => [lead, ...prev])}
      />
    </>
  )
}

function KpiCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub: string; icon: React.ReactNode; color: string
}) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-2 hover:border-opacity-60 transition-colors"
      style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-brand-muted font-medium uppercase tracking-wider">{label}</span>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18`, color }}>
          {icon}
        </span>
      </div>
      <div className="text-xl font-bold text-brand-text" style={{ color }}>{value}</div>
      <div className="text-xs text-brand-muted">{sub}</div>
    </div>
  )
}
