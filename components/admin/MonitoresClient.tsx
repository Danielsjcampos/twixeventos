'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Phone, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Monitor {
  id: string
  nome: string
  telefone: string
  cpf: string | null
  pix: string | null
  ativo: boolean
  valorDia: string | null
  observacoes: string | null
}

const empty: Omit<Monitor, 'id'> = {
  nome: '', telefone: '', cpf: '', pix: '', ativo: true, valorDia: '', observacoes: '',
}

export function MonitoresClient({ monitores: initial }: { monitores: Monitor[] }) {
  const [monitores, setMonitores] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Monitor | null>(null)
  const [form, setForm] = useState<Omit<Monitor, 'id'>>(empty)
  const [loading, setLoading] = useState(false)

  const openNew = () => { setEditing(null); setForm(empty); setShowForm(true) }
  const openEdit = (m: Monitor) => { setEditing(m); setForm({ nome: m.nome, telefone: m.telefone, cpf: m.cpf ?? '', pix: m.pix ?? '', ativo: m.ativo, valorDia: m.valorDia ?? '', observacoes: m.observacoes ?? '' }); setShowForm(true) }
  const cancel = () => { setShowForm(false); setEditing(null); setForm(empty) }

  const save = async () => {
    if (!form.nome || !form.telefone) { toast.error('Nome e telefone obrigatórios'); return }
    setLoading(true)
    try {
      if (editing) {
        const res = await fetch(`/api/admin/monitores/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const updated = await res.json()
        setMonitores(ms => ms.map(m => m.id === editing.id ? { ...m, ...updated } : m))
        toast.success('Monitor atualizado')
      } else {
        const res = await fetch('/api/admin/monitores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const created = await res.json()
        setMonitores(ms => [...ms, created])
        toast.success('Monitor cadastrado')
      }
      cancel()
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const toggleAtivo = async (m: Monitor) => {
    const res = await fetch(`/api/admin/monitores/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !m.ativo }),
    })
    const updated = await res.json()
    setMonitores(ms => ms.map(x => x.id === m.id ? { ...x, ...updated } : x))
    toast.success(updated.ativo ? 'Monitor ativado' : 'Monitor desativado')
  }

  const del = async (id: string) => {
    if (!confirm('Remover este monitor?')) return
    await fetch(`/api/admin/monitores/${id}`, { method: 'DELETE' })
    setMonitores(ms => ms.filter(m => m.id !== id))
    toast.success('Monitor removido')
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-brand-text uppercase">Monitores</h1>
          <p className="text-brand-muted text-sm mt-1">{monitores.length} cadastrado(s)</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="size-4" />
          Novo Monitor
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 mb-6">
          <h2 className="text-brand-text font-semibold mb-4">{editing ? 'Editar Monitor' : 'Novo Monitor'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-brand-muted text-xs mb-1 block">Nome *</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome completo"
                className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent" />
            </div>
            <div>
              <label className="text-brand-muted text-xs mb-1 block">Telefone / WhatsApp *</label>
              <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                placeholder="(12) 99999-0000"
                className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent" />
            </div>
            <div>
              <label className="text-brand-muted text-xs mb-1 block">CPF</label>
              <input value={form.cpf ?? ''} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
                placeholder="000.000.000-00"
                className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent" />
            </div>
            <div>
              <label className="text-brand-muted text-xs mb-1 block">PIX</label>
              <input value={form.pix ?? ''} onChange={e => setForm(f => ({ ...f, pix: e.target.value }))}
                placeholder="CPF, email ou chave aleatória"
                className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent" />
            </div>
            <div>
              <label className="text-brand-muted text-xs mb-1 block">Valor por dia (R$)</label>
              <input value={form.valorDia ?? ''} onChange={e => setForm(f => ({ ...f, valorDia: e.target.value }))}
                type="number" step="0.01" placeholder="150.00"
                className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent" />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} className="w-4 h-4 accent-brand-accent" />
                <span className="text-brand-text text-sm">Ativo</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="text-brand-muted text-xs mb-1 block">Observações</label>
              <textarea value={form.observacoes ?? ''} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                rows={2} placeholder="Observações opcionais..."
                className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent resize-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={loading}
              className="bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={cancel} className="text-brand-muted hover:text-brand-text text-sm px-4 py-2 rounded-lg hover:bg-brand-surface-2 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {monitores.length === 0 && (
          <div className="bg-brand-surface border border-brand-border rounded-xl p-10 text-center text-brand-muted">
            Nenhum monitor cadastrado.
          </div>
        )}
        {monitores.map(m => (
          <div key={m.id} className={cn('bg-brand-surface border rounded-xl p-4 flex items-start gap-4', m.ativo ? 'border-brand-border' : 'border-brand-border opacity-60')}>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-brand-text font-semibold">{m.nome}</span>
                {m.ativo
                  ? <span className="text-green-500 text-xs flex items-center gap-1"><CheckCircle className="size-3" /> Ativo</span>
                  : <span className="text-brand-muted text-xs flex items-center gap-1"><XCircle className="size-3" /> Inativo</span>
                }
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span className="text-brand-muted text-sm flex items-center gap-1"><Phone className="size-3" />{m.telefone}</span>
                {m.pix && <span className="text-brand-muted text-sm">PIX: {m.pix}</span>}
                {m.valorDia && <span className="text-brand-muted text-sm">R$ {m.valorDia}/dia</span>}
              </div>
              {m.observacoes && <p className="text-brand-muted text-xs mt-1 italic">{m.observacoes}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => toggleAtivo(m)} className={cn('p-1.5 rounded-lg transition-colors text-sm', m.ativo ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-green-500 hover:bg-green-500/10')} title={m.ativo ? 'Desativar' : 'Ativar'}>
                {m.ativo ? <XCircle className="size-4" /> : <CheckCircle className="size-4" />}
              </button>
              <button onClick={() => openEdit(m)} className="p-1.5 text-brand-muted hover:text-brand-accent rounded-lg hover:bg-brand-surface-2 transition-colors">
                <Pencil className="size-4" />
              </button>
              <button onClick={() => del(m.id)} className="p-1.5 text-brand-muted hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
