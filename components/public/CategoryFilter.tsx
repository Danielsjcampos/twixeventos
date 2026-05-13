'use client'

import { cn } from '@/lib/utils'
import { CATEGORIAS } from '@/lib/utils'

interface Props {
  onFilter: (categoria: string) => void
  categoriaAtiva: string
}

export function CategoryFilter({ onFilter, categoriaAtiva }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIAS.map((cat) => {
        const isActive = cat.value === categoriaAtiva
        return (
          <button
            key={cat.value}
            onClick={() => onFilter(cat.value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 border',
              isActive
                ? 'bg-brand-accent text-white border-brand-accent'
                : 'bg-brand-surface-2 text-brand-muted border-brand-border hover:text-brand-accent hover:border-brand-accent',
            )}
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
