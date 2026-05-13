'use client'

import { Draggable } from '@hello-pangea/dnd'
import { formatDistanceToNow, differenceInHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle, Calendar, Clock } from 'lucide-react'
import { cn, whatsappLink, STATUS_KANBAN, formatPhone } from '@/lib/utils'
import type { Lead } from '@/types'

interface Props {
  lead: Lead
  index: number
  onClick: (lead: Lead) => void
}

const ORIGEM_LABEL: Record<string, string> = {
  site: 'Site',
  bio: 'Bio',
  indicacao: 'Indicação',
  instagram: 'Instagram',
  outro: 'Outro',
}

const ORIGEM_COLOR: Record<string, string> = {
  site: '#3B82F6',
  bio: '#8B5CF6',
  indicacao: '#10B981',
  instagram: '#F97316',
  outro: '#71717A',
}

export function KanbanCard({ lead, index, onClick }: Props) {
  const statusConfig = STATUS_KANBAN.find((s) => s.id === lead.status)
  const borderColor = statusConfig?.cor ?? '#2A2A2A'

  const semInteracao = differenceInHours(new Date(), new Date(lead.ultimaInteracao)) > 48

  const brinquedos = lead.brinquedosInteresse ?? []
  const brinquedosVisiveis = brinquedos.slice(0, 2)
  const brinquedosExtras = brinquedos.length - 2

  const origemLabel = ORIGEM_LABEL[lead.origem] ?? lead.origem
  const origemColor = ORIGEM_COLOR[lead.origem] ?? ORIGEM_COLOR['outro']

  const waLink = whatsappLink(
    lead.telefone,
    `Olá ${lead.nome}, tudo bem? Aqui é da Twix Eventos! 🎪`,
  )

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(lead)}
          className={cn(
            'relative rounded-lg border cursor-pointer transition-shadow select-none',
            snapshot.isDragging ? 'shadow-2xl rotate-1 opacity-90' : 'hover:shadow-lg',
          )}
          style={{
            backgroundColor: 'var(--brand-surface)',
            borderColor: 'var(--brand-border)',
            borderLeftWidth: 3,
            borderLeftColor: borderColor,
            ...provided.draggableProps.style,
          }}
        >
          <div className="p-3 flex flex-col gap-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {semInteracao && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                      style={{ backgroundColor: '#EF4444' }}
                      title="Sem interação há mais de 48h"
                    />
                  )}
                  <p className="font-semibold text-sm text-brand-text truncate">{lead.nome}</p>
                </div>
                <a
                  href={`tel:${lead.telefone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-brand-muted hover:text-brand-accent transition-colors"
                >
                  {formatPhone(lead.telefone)}
                </a>
              </div>

              {/* WhatsApp button */}
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-green-500/20"
                title="Abrir WhatsApp"
              >
                <MessageCircle size={16} className="text-green-500" />
              </a>
            </div>

            {/* Data do evento */}
            <div className="flex items-center gap-1.5 text-xs text-brand-muted">
              <Calendar size={12} className="flex-shrink-0" />
              {lead.dataEvento ? (
                <span>{lead.dataEvento}</span>
              ) : (
                <span className="text-brand-muted/50">Sem data definida</span>
              )}
            </div>

            {/* Brinquedos */}
            {brinquedos.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {brinquedosVisiveis.map((b) => (
                  <span
                    key={b}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-surface-2 text-brand-muted truncate max-w-[100px]"
                  >
                    {b}
                  </span>
                ))}
                {brinquedosExtras > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-surface-2 text-brand-muted">
                    +{brinquedosExtras} mais
                  </span>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-brand-border">
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ backgroundColor: `${origemColor}20`, color: origemColor }}
              >
                {origemLabel}
              </span>

              <div className="flex items-center gap-1 text-[10px] text-brand-muted">
                <Clock size={10} />
                {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: ptBR })}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
