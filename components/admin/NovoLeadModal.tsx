'use client'

import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Lead } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (lead: Lead) => void
}

const ORIGENS = [
  { value: 'manual', label: 'Manual (admin)' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'site', label: 'Site' },
  { value: 'bio', label: 'Bio link' },
  { value: 'whatsapp', label: 'WhatsApp direto' },
  { value: 'outro', label: 'Outro' },
]

const PRIORIDADES = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
]

export function NovoLeadModal({ open, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '', telefone: '', email: '',
    dataEvento: '', horarioEvento: '',
    enderecoEvento: '', regiaoEvento: '',
    mensagem: '', origem: 'manual',
    valorProposto: '', prioridade: 'normal',
    status: 'novo',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome || !form.telefone) {
      toast.error('Nome e telefone são obrigatórios')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valorProposto: form.valorProposto ? form.valorProposto : null,
        }),
      })
      if (!res.ok) throw new Error()
      const lead = await res.json()
      toast.success('Lead criado com sucesso!')
      onCreated(lead)
      onClose()
      setForm({ nome: '', telefone: '', email: '', dataEvento: '', horarioEvento: '', enderecoEvento: '', regiaoEvento: '', mensagem: '', origem: 'manual', valorProposto: '', prioridade: 'normal', status: 'novo' })
    } catch {
      toast.error('Erro ao criar lead')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-brand-surface border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-border sticky top-0 bg-brand-surface z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Plus className="size-4 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-brand-text text-base">Novo Lead</h2>
              <p className="text-brand-muted text-xs">Cadastro manual de lead</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-brand-surface-2 hover:bg-red-500/10 hover:text-red-400 text-brand-muted flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nome + Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-brand-muted mb-1.5">Nome *</label>
              <input
                value={form.nome} onChange={set('nome')} required
                placeholder="Nome do cliente"
                className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-brand-muted mb-1.5">Telefone *</label>
              <input
                value={form.telefone} onChange={set('telefone')} required
                placeholder="(12) 99999-9999"
                className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">E-mail</label>
            <input
              type="email" value={form.email} onChange={set('email')}
              placeholder="email@exemplo.com"
              className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Data + Horário */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">Data do evento</label>
              <input
                type="date" value={form.dataEvento} onChange={set('dataEvento')}
                className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">Horário</label>
              <input
                type="time" value={form.horarioEvento} onChange={set('horarioEvento')}
                className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">Endereço do evento</label>
            <input
              value={form.enderecoEvento} onChange={set('enderecoEvento')}
              placeholder="Rua, número, bairro"
              className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Origem + Prioridade + Valor */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">Origem</label>
              <select value={form.origem} onChange={set('origem')} className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-blue-500/50 transition-colors">
                {ORIGENS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">Prioridade</label>
              <select value={form.prioridade} onChange={set('prioridade')} className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-blue-500/50 transition-colors">
                {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">Valor (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.valorProposto} onChange={set('valorProposto')}
                placeholder="0,00"
                className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Status inicial */}
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">Status inicial</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { v: 'novo', l: 'Novo' },
                { v: 'contato', l: 'Em contato' },
                { v: 'proposta', l: 'Proposta enviada' },
                { v: 'negociacao', l: 'Negociação' },
              ].map(s => (
                <button
                  key={s.v} type="button"
                  onClick={() => setForm(f => ({ ...f, status: s.v }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.status === s.v ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-brand-surface-2 border-brand-border text-brand-muted hover:border-brand-border/80'}`}
                >
                  {s.l}
                </button>
              ))}
            </div>
          </div>

          {/* Mensagem */}
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">Observações</label>
            <textarea
              value={form.mensagem} onChange={set('mensagem')} rows={3}
              placeholder="Detalhes do interesse, observações..."
              className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:bg-brand-surface-2 text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Criar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
