'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  DollarSign,
  Package,
  MessageCircle,
  CalendarCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, whatsappLink, STATUS_KANBAN, formatCurrency, formatPhone } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { InteractionTimeline } from './InteractionTimeline'
import type { LeadComInteracoes } from '@/types'

interface Props {
  lead: LeadComInteracoes | null
  onClose: () => void
  onUpdate: () => void
}

const TIPO_INTERACAO = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'ligacao', label: 'Ligação' },
  { value: 'email', label: 'E-mail' },
  { value: 'nota', label: 'Nota interna' },
]

export function LeadModal({ lead, onClose, onUpdate }: Props) {
  const [novoTipo, setNovoTipo] = useState('whatsapp')
  const [novoConteudo, setNovoConteudo] = useState('')
  const [sending, setSending] = useState(false)
  const [convertendo, setConvertendo] = useState(false)

  if (!lead) return null

  const statusConfig = STATUS_KANBAN.find((s) => s.id === lead.status)

  const waLink = whatsappLink(
    lead.telefone,
    `Olá ${lead.nome}, tudo bem? Aqui é da Twix Eventos! 🎪`,
  )

  const handleEnviarInteracao = async () => {
    if (!novoConteudo.trim()) {
      toast.error('Informe o conteúdo da interação')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/admin/interacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, tipo: novoTipo, conteudo: novoConteudo }),
      })

      if (!res.ok) throw new Error()

      toast.success('Interação registrada com sucesso')
      setNovoConteudo('')
      onUpdate()
    } catch {
      toast.error('Erro ao registrar interação')
    } finally {
      setSending(false)
    }
  }

  const handleConverterEvento = async () => {
    setConvertendo(true)
    try {
      const res = await fetch('/api/admin/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      })

      if (!res.ok) throw new Error()

      toast.success('Lead convertido em evento com sucesso!')
      onUpdate()
      onClose()
    } catch {
      toast.error('Erro ao converter em evento')
    } finally {
      setConvertendo(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div
        className="w-full max-w-xl flex flex-col h-full overflow-hidden shadow-2xl"
        style={{ backgroundColor: 'var(--brand-bg)', borderLeft: '1px solid var(--brand-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-5 border-b"
          style={{ borderColor: 'var(--brand-border)' }}
        >
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold text-white">{lead.nome}</h2>
            {statusConfig && (
              <span
                className="self-start px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${statusConfig.cor}20`,
                  color: statusConfig.cor,
                  border: `1px solid ${statusConfig.cor}40`,
                }}
              >
                {statusConfig.label}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {/* Action buttons */}
          <div className="flex gap-2">
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle size={16} />
                Enviar WhatsApp
              </Button>
            </a>
            <Button
              onClick={handleConverterEvento}
              disabled={convertendo}
              variant="outline"
              className="flex-1 gap-2 border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
            >
              <CalendarCheck size={16} />
              {convertendo ? 'Convertendo...' : 'Converter em Evento'}
            </Button>
          </div>

          {/* Lead data */}
          <div
            className="rounded-xl border p-4 flex flex-col gap-3"
            style={{ borderColor: 'var(--brand-border)' }}
          >
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dados do Lead</h3>

            <InfoRow icon={<Phone size={14} />} label="Telefone">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline"
              >
                {formatPhone(lead.telefone)}
              </a>
            </InfoRow>

            {lead.email && (
              <InfoRow icon={<Mail size={14} />} label="E-mail">
                <a href={`mailto:${lead.email}`} className="text-blue-400 hover:underline">
                  {lead.email}
                </a>
              </InfoRow>
            )}

            {lead.dataEvento && (
              <InfoRow icon={<Calendar size={14} />} label="Data do Evento">
                <span className="text-zinc-200">{lead.dataEvento}</span>
                {lead.horarioEvento && (
                  <span className="text-zinc-500 ml-1">às {lead.horarioEvento}</span>
                )}
              </InfoRow>
            )}

            {lead.enderecoEvento && (
              <InfoRow icon={<MapPin size={14} />} label="Endereço">
                <span className="text-zinc-200">{lead.enderecoEvento}</span>
              </InfoRow>
            )}

            <InfoRow icon={<Tag size={14} />} label="Origem">
              <span className="text-zinc-200 capitalize">{lead.origem}</span>
            </InfoRow>

            {lead.valorProposto && (
              <InfoRow icon={<DollarSign size={14} />} label="Valor Proposto">
                <span className="text-emerald-400 font-semibold">
                  {formatCurrency(lead.valorProposto)}
                </span>
              </InfoRow>
            )}

            {lead.valorSinal && (
              <InfoRow icon={<DollarSign size={14} />} label="Sinal">
                <span className="text-zinc-200">{formatCurrency(lead.valorSinal)}</span>
              </InfoRow>
            )}

            {lead.brinquedosInteresse && lead.brinquedosInteresse.length > 0 && (
              <div className="flex gap-2 items-start">
                <span className="text-zinc-500 mt-0.5">
                  <Package size={14} />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-zinc-500">Brinquedos</span>
                  <div className="flex flex-wrap gap-1">
                    {lead.brinquedosInteresse.map((b) => (
                      <span
                        key={b}
                        className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-xs"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {lead.mensagem && (
              <div className="mt-1 p-3 rounded-lg bg-zinc-900 text-sm text-zinc-300 leading-relaxed border border-zinc-800">
                &ldquo;{lead.mensagem}&rdquo;
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Histórico de Interações
            </h3>
            <InteractionTimeline interacoes={lead.interacoes} />
          </div>

          {/* New interaction form */}
          <div
            className="rounded-xl border p-4 flex flex-col gap-3"
            style={{ borderColor: 'var(--brand-border)' }}
          >
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Nova Interação
            </h3>

            <select
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm text-white bg-zinc-900 border-zinc-700 focus:outline-none focus:border-orange-500"
            >
              {TIPO_INTERACAO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm text-white bg-zinc-900 border-zinc-700 focus:outline-none focus:border-orange-500 resize-none"
              rows={3}
              placeholder="Descreva o que aconteceu nessa interação..."
              value={novoConteudo}
              onChange={(e) => setNovoConteudo(e.target.value)}
            />

            <Button
              onClick={handleEnviarInteracao}
              disabled={sending}
              className="self-end"
              style={{ backgroundColor: 'var(--brand-accent)' }}
            >
              {sending ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-zinc-500 mt-0.5">{icon}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-zinc-500">{label}</span>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  )
}
