'use client'

import { useState, useMemo } from 'react'
import { Plus, X, Loader2, DollarSign, TrendingDown, TrendingUp, ArrowDownLeft, Trash2, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

type Lancamento = {
  id: string; tipo: string; descricao: string; valor: string
  forma: string | null; status: string; data: string
  categoria: string | null; observacoes: string | null
  eventoId: string | null; monitorId: string | null
  nomeEvento: string | null; nomeMonitor: string | null
  criadoPor: string | null; createdAt: string
}

interface Props {
  lancamentos: Lancamento[]
  mes: number
  ano: number
  onRefresh: (mes: number, ano: number) => void
}

const TIPO_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  receita:          { label: 'Receita',          icon: TrendingUp,    color: '#10B981', bg: '#10B98115' },
  despesa:          { label: 'Despesa',           icon: TrendingDown,  color: '#EF4444', bg: '#EF444415' },
  retirada_socio:   { label: 'Retirada Sócio',   icon: ArrowDownLeft, color: '#F59E0B', bg: '#F59E0B15' },
  pagamento_monitor:{ label: 'Pgto Monitor',     icon: DollarSign,    color: '#8B5CF6', bg: '#8B5CF615' },
}

const CATEGORIAS = [
  'combustivel', 'alimentacao', 'material', 'manutencao',
  'marketing', 'aluguel', 'folha', 'impostos', 'outros',
]

const FORMAS = ['pix', 'dinheiro', 'transferencia', 'cartao_debito', 'cartao_credito']

export function LancamentosClient({ lancamentos: inicial, mes, ano, onRefresh }: Props) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(inicial)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [form, setForm] = useState({
    tipo: 'despesa', descricao: '', valor: '',
    forma: 'pix', status: 'pago',
    data: new Date().toISOString().slice(0, 10),
    categoria: '', observacoes: '',
    eventoId: '', monitorId: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const filtered = useMemo(() =>
    filtroTipo ? lancamentos.filter(l => l.tipo === filtroTipo) : lancamentos,
  [lancamentos, filtroTipo])

  // Totais por tipo
  const totais = useMemo(() => {
    const map: Record<string, number> = {}
    for (const l of lancamentos) {
      if (l.status === 'pago') map[l.tipo] = (map[l.tipo] ?? 0) + Number(l.valor)
    }
    return map
  }, [lancamentos])

  const saldo = (totais['receita'] ?? 0) - (totais['despesa'] ?? 0) - (totais['retirada_socio'] ?? 0) - (totais['pagamento_monitor'] ?? 0)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.descricao || !form.valor || !form.data) { toast.error('Preencha os campos obrigatórios'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/lancamentos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valor: form.valor,
          eventoId: form.eventoId || null,
          monitorId: form.monitorId || null,
          categoria: form.categoria || null,
          observacoes: form.observacoes || null,
        }),
      })
      if (!res.ok) throw new Error()
      const l = await res.json()
      setLancamentos(prev => [{ ...l, nomeEvento: null, nomeMonitor: null }, ...prev])
      setShowModal(false)
      setForm({ tipo: 'despesa', descricao: '', valor: '', forma: 'pix', status: 'pago', data: new Date().toISOString().slice(0, 10), categoria: '', observacoes: '', eventoId: '', monitorId: '' })
      toast.success('Lançamento criado!')
    } catch { toast.error('Erro ao criar lançamento') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return
    try {
      await fetch(`/api/admin/lancamentos/${id}`, { method: 'DELETE' })
      setLancamentos(prev => prev.filter(l => l.id !== id))
      toast.success('Lançamento excluído')
    } catch { toast.error('Erro ao excluir') }
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(TIPO_CONFIG).map(([tipo, cfg]) => (
          <div key={tipo} className="bg-brand-surface border border-brand-border rounded-2xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
              <cfg.icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-brand-muted">{cfg.label}</p>
              <p className="font-bold text-brand-text text-sm">{formatCurrency(totais[tipo] ?? 0)}</p>
            </div>
          </div>
        ))}
        <div className="bg-brand-surface border rounded-2xl p-3 flex items-center gap-3" style={{ borderColor: saldo >= 0 ? '#10B98140' : '#EF444440' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: saldo >= 0 ? '#10B98115' : '#EF444415', color: saldo >= 0 ? '#10B981' : '#EF4444' }}>
            <DollarSign size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-brand-muted">Saldo</p>
            <p className="font-bold text-sm" style={{ color: saldo >= 0 ? '#10B981' : '#EF4444' }}>{formatCurrency(saldo)}</p>
          </div>
        </div>
      </div>

      {/* Header + filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto">
          <button onClick={() => setFiltroTipo('')} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!filtroTipo ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-brand-surface-2 border-brand-border text-brand-muted'}`}>
            Todos
          </button>
          {Object.entries(TIPO_CONFIG).map(([tipo, cfg]) => (
            <button key={tipo} onClick={() => setFiltroTipo(tipo === filtroTipo ? '' : tipo)} style={filtroTipo === tipo ? { backgroundColor: cfg.bg, borderColor: cfg.color + '60', color: cfg.color } : {}}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filtroTipo === tipo ? '' : 'bg-brand-surface-2 border-brand-border text-brand-muted'}`}>
              {cfg.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)} className="ml-auto flex-shrink-0 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={14} /> Novo lançamento
        </button>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-brand-muted">
          <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
          <p>Nenhum lançamento neste mês</p>
        </div>
      ) : (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted">Descrição</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted">Categoria</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-muted">Forma</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-brand-muted">Valor</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-brand-muted">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const cfg = TIPO_CONFIG[l.tipo] ?? { label: l.tipo, color: '#6B7280', bg: '#6B728015' }
                  const isReceita = l.tipo === 'receita'
                  return (
                    <tr key={l.id} className={`border-b border-brand-border/50 hover:bg-brand-surface-2/30 transition-colors ${i % 2 === 0 ? '' : 'bg-brand-surface-2/10'}`}>
                      <td className="px-4 py-3 text-brand-muted text-xs whitespace-nowrap">
                        {new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-brand-text max-w-[200px]">
                        <p className="truncate">{l.descricao}</p>
                        {l.nomeEvento && <p className="text-xs text-brand-muted truncate">Evento: {l.nomeEvento}</p>}
                        {l.nomeMonitor && <p className="text-xs text-brand-muted truncate">Monitor: {l.nomeMonitor}</p>}
                      </td>
                      <td className="px-4 py-3 text-brand-muted text-xs capitalize">{l.categoria ?? '—'}</td>
                      <td className="px-4 py-3 text-brand-muted text-xs capitalize whitespace-nowrap">{l.forma ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap" style={{ color: isReceita ? '#10B981' : '#EF4444' }}>
                        {isReceita ? '+' : '-'}{formatCurrency(Number(l.valor))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.status === 'pago' ? 'bg-green-500/10 text-green-400' : l.status === 'pendente' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(l.id)} className="w-7 h-7 rounded-lg text-brand-muted hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-brand-surface border border-brand-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-brand-border sticky top-0 bg-brand-surface z-10">
              <h2 className="font-semibold text-brand-text flex items-center gap-2"><Plus size={16} className="text-blue-400" /> Novo Lançamento</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-brand-surface-2 text-brand-muted hover:text-red-400 flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">Tipo *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TIPO_CONFIG).map(([tipo, cfg]) => (
                    <button key={tipo} type="button" onClick={() => setForm(f => ({ ...f, tipo }))}
                      className="py-2 rounded-xl text-xs font-medium border transition-colors text-center"
                      style={form.tipo === tipo ? { backgroundColor: cfg.bg, borderColor: cfg.color + '60', color: cfg.color } : { backgroundColor: 'var(--brand-surface-2)', borderColor: 'var(--brand-border)', color: 'var(--brand-muted)' }}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">Descrição *</label>
                <input value={form.descricao} onChange={set('descricao')} required placeholder="Descrição do lançamento"
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Valor + Data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">Valor (R$) *</label>
                  <input type="number" min="0" step="0.01" value={form.valor} onChange={set('valor')} required placeholder="0,00"
                    className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">Data *</label>
                  <input type="date" value={form.data} onChange={set('data')} required
                    className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              {/* Forma + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">Forma de pagamento</label>
                  <select value={form.forma} onChange={set('forma')} className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none">
                    {FORMAS.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">Status</label>
                  <select value={form.status} onChange={set('status')} className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none">
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">Categoria</label>
                <select value={form.categoria} onChange={set('categoria')} className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none">
                  <option value="">Sem categoria</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">Observações</label>
                <textarea value={form.observacoes} onChange={set('observacoes')} rows={2} placeholder="Detalhes adicionais..."
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:bg-brand-surface-2 text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
