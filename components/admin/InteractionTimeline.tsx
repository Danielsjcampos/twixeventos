'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle, Phone, Mail, StickyNote, Bot, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Interacao } from '@/types'

interface Props {
  interacoes: Interacao[]
}

const TIPO_CONFIG: Record<string, { label: string; cor: string; bg: string; icon: React.ElementType }> = {
  whatsapp: { label: 'WhatsApp', cor: '#22C55E', bg: '#22C55E18', icon: MessageCircle },
  ligacao: { label: 'Ligação', cor: '#3B82F6', bg: '#3B82F618', icon: Phone },
  email: { label: 'E-mail', cor: '#EAB308', bg: '#EAB30818', icon: Mail },
  nota: { label: 'Nota', cor: '#71717A', bg: '#71717A18', icon: StickyNote },
  sistema: { label: 'Sistema', cor: '#8B5CF6', bg: '#8B5CF618', icon: Bot },
}

function getTipoConfig(tipo: string) {
  return TIPO_CONFIG[tipo] ?? TIPO_CONFIG['nota']
}

export function InteractionTimeline({ interacoes }: Props) {
  if (interacoes.length === 0) {
    return (
      <p className="text-sm text-zinc-500 text-center py-6">Nenhuma interação registrada ainda.</p>
    )
  }

  const sorted = [...interacoes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <div className="relative flex flex-col gap-0">
      {sorted.map((interacao, idx) => {
        const config = getTipoConfig(interacao.tipo)
        const Icon = config.icon
        const isLast = idx === sorted.length - 1

        return (
          <div key={interacao.id} className="relative flex gap-3">
            {/* Vertical line */}
            {!isLast && (
              <div
                className="absolute left-[15px] top-8 bottom-0 w-px"
                style={{ backgroundColor: 'var(--brand-border)' }}
              />
            )}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 mt-1',
              )}
              style={{ backgroundColor: config.bg, color: config.cor }}
            >
              <Icon size={15} />
            </div>

            {/* Content */}
            <div className={cn('flex-1 pb-5', isLast ? 'pb-0' : '')}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold" style={{ color: config.cor }}>
                  {config.label}
                </span>
                <span className="text-xs text-zinc-500">
                  {format(new Date(interacao.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              {/* Status change */}
              {interacao.statusAnterior && interacao.statusNovo && (
                <div className="flex items-center gap-1.5 mb-1.5 text-xs text-zinc-400">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {interacao.statusAnterior}
                  </span>
                  <ArrowRight size={12} className="text-zinc-600" />
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {interacao.statusNovo}
                  </span>
                </div>
              )}

              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {interacao.conteudo}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
