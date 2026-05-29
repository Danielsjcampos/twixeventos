'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, CalendarCheck, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Lead } from '@/types'

const schema = z.object({
  nomeCliente:      z.string().min(2, 'Nome obrigatório'),
  telefoneCliente:  z.string().min(10, 'Telefone inválido'),
  emailCliente:     z.string().optional().nullable(),
  dataEvento:       z.string().min(1, 'Data obrigatória'),
  horarioInicio:    z.string().min(1, 'Horário obrigatório'),
  horarioFim:       z.string().optional().nullable(),
  enderecoCompleto: z.string().min(5, 'Endereço obrigatório'),
  valorTotal:       z.string().optional().nullable(),
  valorEntrada:     z.string().optional().nullable(),
  formaPagamento:   z.string().min(1),
  observacoes:      z.string().optional().nullable(),
})
type FormData = z.infer<typeof schema>

interface Props {
  lead: Lead
  onSuccess: () => void
  onCancel: () => void
}

const FORMAS_PAG = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão Crédito' },
  { value: 'cartao_debito', label: 'Cartão Débito' },
  { value: 'transferencia', label: 'Transferência' },
]

export function EventoRapidoModal({ lead, onSuccess, onCancel }: Props) {
  const [saving, setSaving] = useState(false)
  const [todosBrinquedos, setTodosBrinquedos] = useState<{ id: string; nome: string; precoReferencia: string | null }[]>([])
  const [brinquedosContratados, setBrinquedosContratados] = useState<string[]>([])
  const [valoresExtras, setValoresExtras] = useState<{ id: string; descricao: string; valor: string }[]>([])
  const [extraDesc, setExtraDesc] = useState('')
  const [extraVal, setExtraVal] = useState('')

  useEffect(() => {
    fetch('/api/admin/brinquedos')
      .then(res => res.json())
      .then(data => setTodosBrinquedos(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (todosBrinquedos.length > 0 && lead.brinquedosInteresse) {
      const mapped = lead.brinquedosInteresse
        .map(name => todosBrinquedos.find(b => b.nome.toLowerCase() === name.toLowerCase())?.id)
        .filter(Boolean) as string[]
      setBrinquedosContratados(mapped)
    }
  }, [todosBrinquedos, lead.brinquedosInteresse])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeCliente:      lead.nome,
      telefoneCliente:  lead.telefone,
      emailCliente:     lead.email ?? '',
      dataEvento:       lead.dataEvento ?? '',
      horarioInicio:    lead.horarioEvento ?? '',
      horarioFim:       '',
      enderecoCompleto: lead.enderecoEvento ?? '',
      valorTotal:       lead.valorProposto ?? '',
      valorEntrada:     lead.valorSinal ?? '',
      formaPagamento:   'pix',
      observacoes:      lead.mensagem ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload = {
        ...data,
        leadId: lead.id,
        brinquedosContratados,
        valoresExtras,
        valorTotal:   data.valorTotal?.trim() || null,
        valorEntrada: data.valorEntrada?.trim() || null,
        valorRestante: data.valorTotal && data.valorEntrada
          ? String(Number(data.valorTotal) - Number(data.valorEntrada))
          : null,
        horarioFim:   data.horarioFim?.trim() || null,
        emailCliente: data.emailCliente?.trim() || null,
        observacoes:  data.observacoes?.trim() || null,
        status: 'confirmado',
        statusPagamento: data.valorEntrada?.trim() ? 'parcial' : 'pendente',
      }

      const res = await fetch('/api/admin/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Erro ao criar evento')

      // Atualiza status do lead para confirmado
      await fetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmado', statusAnterior: lead.status }),
      })

      toast.success('Evento criado e lead confirmado!')
      onSuccess()
    } catch {
      toast.error('Erro ao criar evento')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <CalendarCheck size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-text">Criar Evento — {lead.nome}</h2>
              <p className="text-xs text-brand-muted">Dados pré-preenchidos do lead. Complete e confirme.</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {/* Brinquedos Contratados */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Brinquedos Contratados</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {brinquedosContratados.map(toyId => {
                const toy = todosBrinquedos.find(t => t.id === toyId)
                if (!toy) return null
                return (
                  <div key={toyId} className="flex items-center gap-2 bg-brand-surface-2 border border-brand-border rounded-xl px-3 py-1.5 text-sm text-brand-text">
                    <span className="font-semibold">{toy.nome}</span>
                    {toy.precoReferencia && <span className="text-xs text-brand-accent">(R$ {parseFloat(toy.precoReferencia).toFixed(2)})</span>}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = brinquedosContratados.filter(id => id !== toyId)
                        setBrinquedosContratados(updated)
                        if (toy.precoReferencia) {
                          const currentTotal = parseFloat(watch('valorTotal') || '0')
                          const toyPrice = parseFloat(toy.precoReferencia)
                          setValue('valorTotal', Math.max(0, currentTotal - toyPrice).toFixed(2))
                        }
                      }}
                      className="text-brand-muted hover:text-red-400 transition-colors ml-1"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )
              })}
              {brinquedosContratados.length === 0 && (
                <p className="text-xs text-brand-muted italic">Nenhum brinquedo selecionado.</p>
              )}
            </div>
            <select
              value=""
              onChange={e => {
                const val = e.target.value
                if (val && !brinquedosContratados.includes(val)) {
                  const updated = [...brinquedosContratados, val]
                  setBrinquedosContratados(updated)
                  const toy = todosBrinquedos.find(t => t.id === val)
                  if (toy?.precoReferencia) {
                    const currentTotal = parseFloat(watch('valorTotal') || '0')
                    const toyPrice = parseFloat(toy.precoReferencia)
                    setValue('valorTotal', (currentTotal + toyPrice).toFixed(2))
                  }
                }
              }}
              className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent"
            >
              <option value="">+ Adicionar brinquedo...</option>
              {todosBrinquedos
                .filter(t => !brinquedosContratados.includes(t.id))
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nome} {t.precoReferencia ? `(R$ ${parseFloat(t.precoReferencia).toFixed(2)})` : ''}
                  </option>
                ))
              }
            </select>
          </div>

          {/* Valores Extras Avulsos */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Valores Extras Avulsos</label>
            <div className="space-y-2 mb-2">
              {valoresExtras.map(ext => (
                <div key={ext.id} className="flex items-center justify-between bg-brand-surface-2 border border-brand-border rounded-xl p-3 text-sm">
                  <span className="text-brand-text font-medium truncate">{ext.descricao}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-brand-text">R$ {parseFloat(ext.valor).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = valoresExtras.filter(item => item.id !== ext.id)
                        setValoresExtras(updated)
                        const currentTotal = parseFloat(watch('valorTotal') || '0')
                        const extValue = parseFloat(ext.valor)
                        setValue('valorTotal', Math.max(0, currentTotal - extValue).toFixed(2))
                      }}
                      className="text-brand-muted hover:text-red-500 transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
              {valoresExtras.length === 0 && (
                <p className="text-xs text-brand-muted italic">Nenhum valor extra adicionado.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Descrição do extra"
                value={extraDesc}
                onChange={e => setExtraDesc(e.target.value)}
                className="flex-1 bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Valor"
                value={extraVal}
                onChange={e => setExtraVal(e.target.value)}
                className="w-24 bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-accent"
              />
              <button
                type="button"
                onClick={() => {
                  if (!extraDesc.trim() || !extraVal.trim()) {
                    toast.error('Preencha a descrição e valor')
                    return
                  }
                  const newExtra = {
                    id: Math.random().toString(36).slice(2, 9),
                    descricao: extraDesc.trim(),
                    valor: parseFloat(extraVal).toFixed(2)
                  }
                  const updated = [...valoresExtras, newExtra]
                  setValoresExtras(updated)
                  
                  const currentTotal = parseFloat(watch('valorTotal') || '0')
                  const extValue = parseFloat(newExtra.valor)
                  setValue('valorTotal', (currentTotal + extValue).toFixed(2))

                  setExtraDesc('')
                  setExtraVal('')
                }}
                className="bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="size-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Cliente */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome do cliente *" error={errors.nomeCliente?.message}>
              <input {...register('nomeCliente')} className={input} />
            </Field>
            <Field label="Telefone *" error={errors.telefoneCliente?.message}>
              <input {...register('telefoneCliente')} className={input} />
            </Field>
          </div>
          <Field label="E-mail">
            <input {...register('emailCliente')} type="email" className={input} placeholder="opcional" />
          </Field>

          {/* Data e horário */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Data do evento *" error={errors.dataEvento?.message}>
              <input {...register('dataEvento')} type="date" className={input} />
            </Field>
            <Field label="Início *" error={errors.horarioInicio?.message}>
              <input {...register('horarioInicio')} type="time" className={input} />
            </Field>
            <Field label="Término">
              <input {...register('horarioFim')} type="time" className={input} />
            </Field>
          </div>

          {/* Endereço */}
          <Field label="Endereço completo *" error={errors.enderecoCompleto?.message}>
            <input {...register('enderecoCompleto')} className={input} placeholder="Rua, número, bairro, cidade" />
          </Field>

          {/* Financeiro */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Valor total">
              <input {...register('valorTotal')} type="number" step="0.01" placeholder="0.00" className={input} />
            </Field>
            <Field label="Entrada">
              <input {...register('valorEntrada')} type="number" step="0.01" placeholder="0.00" className={input} />
            </Field>
            <Field label="Forma de pagamento">
              <select {...register('formaPagamento')} className={input}>
                {FORMAS_PAG.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Observações */}
          <Field label="Observações">
            <textarea {...register('observacoes')} rows={3} className={`${input} resize-none`} placeholder="Detalhes extras, instruções de montagem..." />
          </Field>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-brand-border text-brand-muted">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 gap-2 text-white font-semibold bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Criando...</> : <><CalendarCheck size={16} /> Confirmar e criar evento</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const input = 'w-full rounded-lg border px-3 py-2 text-sm text-brand-text bg-brand-surface-2 border-brand-border focus:outline-none focus:border-brand-accent'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-brand-muted">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
