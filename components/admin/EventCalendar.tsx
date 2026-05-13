'use client'

import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Evento } from '@/types'

interface Props {
  eventos: Evento[]
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function EventCalendar({ eventos }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Padding days before month start (Sunday = 0)
  const startPadding = getDay(monthStart)
  const paddingDays = Array.from({ length: startPadding }, (_, i) => i)

  function getEventosForDay(day: Date): Evento[] {
    return eventos.filter((e) => {
      const [year, month, d] = e.dataEvento.split('-').map(Number)
      const eventDate = new Date(year, month - 1, d)
      return isSameDay(eventDate, day)
    })
  }

  const selectedDayEventos = selectedDay ? getEventosForDay(selectedDay) : []

  return (
    <div className="flex flex-col gap-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="text-zinc-400 hover:text-white"
        >
          <ChevronLeft size={18} />
        </Button>

        <h2 className="text-lg font-semibold text-white capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="text-zinc-400 hover:text-white"
        >
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Calendar grid */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--brand-border)', backgroundColor: 'var(--brand-surface)' }}
      >
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--brand-border)' }}>
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-zinc-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Padding */}
          {paddingDays.map((i) => (
            <div
              key={`pad-${i}`}
              className="h-12 border-b border-r"
              style={{ borderColor: 'var(--brand-border)' }}
            />
          ))}

          {/* Actual days */}
          {days.map((day, idx) => {
            const dayEventos = getEventosForDay(day)
            const hasEvents = dayEventos.length > 0
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
            const isToday = isSameDay(day, new Date())
            const isLastRow = idx >= days.length - 7
            const colPos = (startPadding + idx) % 7
            const isLastCol = colPos === 6

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(-1)) ? null : day)}
                className={cn(
                  'h-12 flex flex-col items-center justify-center gap-0.5 transition-colors relative',
                  !isLastRow && 'border-b',
                  !isLastCol && 'border-r',
                  isSelected ? 'bg-orange-500/20' : 'hover:bg-white/5',
                )}
                style={{ borderColor: 'var(--brand-border)' }}
              >
                <span
                  className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    isToday && !isSelected
                      ? 'border border-orange-500 text-orange-400'
                      : isSelected
                        ? 'bg-orange-500 text-white'
                        : 'text-zinc-300',
                  )}
                >
                  {format(day, 'd')}
                </span>

                {hasEvents && (
                  <div className="flex gap-0.5">
                    {dayEventos.slice(0, 3).map((_, i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: 'var(--brand-accent)' }}
                      />
                    ))}
                    {dayEventos.length > 3 && (
                      <span className="text-[8px] text-orange-400 leading-none">+</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-400">
            {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h3>

          {selectedDayEventos.length === 0 ? (
            <p className="text-sm text-zinc-600">Nenhum evento neste dia.</p>
          ) : (
            selectedDayEventos.map((evento) => (
              <div
                key={evento.id}
                className="rounded-xl border p-4 flex flex-col gap-2"
                style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)', borderLeft: '3px solid var(--brand-accent)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-white">{evento.nomeCliente}</span>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      evento.status === 'confirmado'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : evento.status === 'realizado'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-zinc-700 text-zinc-300',
                    )}
                  >
                    {evento.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Clock size={12} />
                  {evento.horarioInicio}
                  {evento.horarioFim && ` – ${evento.horarioFim}`}
                </div>

                <div className="flex items-start gap-1.5 text-xs text-zinc-400">
                  <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{evento.enderecoCompleto}</span>
                </div>

                {evento.brinquedosContratados && evento.brinquedosContratados.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {evento.brinquedosContratados.map((b) => (
                      <span key={b} className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
