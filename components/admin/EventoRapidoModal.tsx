'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, CalendarCheck, Loader2 } from 'lucide-react'
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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
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
        brinquedosContratados: lead.brinquedosInteresse ?? [],
        valorTotal:   data.valorTotal?.trim() || null,
        valorEntrada: data.valorEntrada?.trim() || null,
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
          {/* Brinquedos do lead */}
          {(lead.brinquedosInteresse?.length ?? 0) > 0 && (
            <div className="rounded-xl border p-3 flex flex-wrap gap-1.5" style={{ borderColor: 'var(--brand-border)', backgroundColor: 'var(--brand-surface-2)' }}>
              <span className="text-xs text-brand-muted w-full mb-1">Brinquedos do interesse:</span>
              {lead.brinquedosInteresse!.map(b => (
                <span key={b} className="px-2 py-0.5 rounded-md text-xs font-medium bg-brand-accent/15 text-brand-accent border border-brand-accent/25">
                  {b}
                </span>
              ))}
            </div>
          )}

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
