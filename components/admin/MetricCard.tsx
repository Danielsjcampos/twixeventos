import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  titulo: string
  valor: string | number
  subtitulo?: string
  icone: React.ReactNode
  corIcone?: string
  tendencia?: 'up' | 'down' | 'neutral'
}

export function MetricCard({ titulo, valor, subtitulo, icone, corIcone, tendencia }: Props) {
  const accent = corIcone ?? '#E85D24'

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-brand-muted">{titulo}</span>
        <span
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ color: accent, backgroundColor: `${accent}18` }}
        >
          {icone}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-brand-text leading-none">{valor}</span>
        {tendencia && tendencia !== 'neutral' && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium mb-0.5',
              tendencia === 'up' ? 'text-emerald-500' : 'text-red-500',
            )}
          >
            {tendencia === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          </span>
        )}
        {tendencia === 'neutral' && (
          <span className="flex items-center mb-0.5 text-brand-muted">
            <Minus size={14} />
          </span>
        )}
      </div>

      {subtitulo && <p className="text-xs text-brand-muted">{subtitulo}</p>}
    </div>
  )
}
