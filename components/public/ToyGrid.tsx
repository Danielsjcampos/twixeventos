'use client'

import { useState, useMemo } from 'react'
import { type Brinquedo } from '@/types'
import { CategoryFilter } from './CategoryFilter'
import { ToyCard } from './ToyCard'

interface Props {
  brinquedos: Brinquedo[]
}

export function ToyGrid({ brinquedos }: Props) {
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos')

  const filtered = useMemo(() => {
    if (categoriaAtiva === 'todos') return brinquedos
    return brinquedos.filter((b) => b.categoria === categoriaAtiva)
  }, [brinquedos, categoriaAtiva])

  return (
    <div className="flex flex-col gap-8">
      <CategoryFilter onFilter={setCategoriaAtiva} categoriaAtiva={categoriaAtiva} />

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-brand-muted">
          Nenhum brinquedo encontrado para esta categoria.
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300"
          key={categoriaAtiva}
        >
          {filtered.map((brinquedo) => (
            <div key={brinquedo.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ToyCard brinquedo={brinquedo} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
