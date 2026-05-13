'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Users, Baby, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/store/cart'
import { useEffect, useState } from 'react'

interface ToyCardProps {
  brinquedo: {
    id: string
    nome: string
    slug: string
    categoria: string
    faixaEtaria: string
    capacidade: string
    fotos: string[] | null
    fotoDestaque: string | null
    destaque: boolean
    dimensoes: string
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  inflaveis: 'Inflável',
  toboshark: 'Toboshark',
  radicais: 'Radical',
  batalhas: 'Batalha',
  tematicos: 'Temático',
  aquaticos: 'Aquático',
}

export function ToyCard({ brinquedo }: ToyCardProps) {
  const { id, nome, slug, categoria, faixaEtaria, capacidade, fotos, fotoDestaque, destaque } = brinquedo
  const { add, remove, has, open } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    useCart.persist.rehydrate()
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  const inCart = mounted && has(id)
  const imageSrc = fotoDestaque ?? (fotos && fotos.length > 0 ? fotos[0] : null)
  const categoryLabel = CATEGORY_LABELS[categoria] ?? categoria

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (inCart) {
      remove(id)
    } else {
      add({ id, nome, slug, fotoDestaque: imageSrc, categoria })
    }
  }

  const card = (
    <div
      className={cn(
        'bg-brand-surface rounded-xl overflow-hidden flex flex-col transition-all duration-200 group',
        destaque ? 'border-0' : 'border border-brand-border hover:border-brand-accent',
        inCart && 'ring-2 ring-brand-accent/50'
      )}
    >
      {/* Imagem */}
      <Link href={`/brinquedos/${slug}`} className="relative aspect-[4/3] bg-brand-surface-2 overflow-hidden block">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={nome}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-brand-muted text-sm">Sem foto</span>
          </div>
        )}

        <div className="absolute top-3 left-3 z-10">
          <span className="bg-brand-bg/80 backdrop-blur-sm text-brand-muted text-xs font-medium px-2.5 py-1 rounded-full border border-brand-border">
            {categoryLabel}
          </span>
        </div>

        {destaque && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-brand-accent text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
              DESTAQUE
            </span>
          </div>
        )}

        {inCart && (
          <div className="absolute inset-0 bg-brand-accent/10 flex items-center justify-center">
            <div className="bg-brand-accent text-white rounded-full p-2">
              <Check className="size-6" />
            </div>
          </div>
        )}
      </Link>

      {/* Conteúdo */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        <Link href={`/brinquedos/${slug}`}>
          <h3 className="text-brand-text font-bold text-base leading-snug group-hover:text-brand-accent transition-colors">
            {nome}
          </h3>
        </Link>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-brand-muted text-sm">
            <Baby className="size-3.5 shrink-0" />
            <span>Faixa etária: {faixaEtaria}</span>
          </div>
          <div className="flex items-center gap-2 text-brand-muted text-sm">
            <Users className="size-3.5 shrink-0" />
            <span>Capacidade: {capacidade}</span>
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          <Link
            href={`/brinquedos/${slug}`}
            className="flex-1 inline-flex items-center justify-center border border-brand-border text-brand-text hover:border-brand-accent hover:text-brand-accent font-semibold text-sm px-3 py-2.5 rounded-lg transition-colors"
          >
            Ver detalhes
          </Link>
          <button
            onClick={handleCart}
            className={cn(
              'inline-flex items-center justify-center gap-1 font-semibold text-sm px-3 py-2.5 rounded-lg transition-colors',
              inCart
                ? 'bg-brand-accent text-white hover:bg-red-500'
                : 'bg-brand-accent hover:bg-brand-accent-hover text-white'
            )}
            aria-label={inCart ? 'Remover do orçamento' : 'Adicionar ao orçamento'}
          >
            {inCart ? <Check className="size-4" /> : <Plus className="size-4" />}
            <span className="hidden sm:inline">{inCart ? 'Adicionado' : 'Orçar'}</span>
          </button>
        </div>
      </div>
    </div>
  )

  if (destaque) {
    return (
      <div className="p-[2px] rounded-[13px] shimmer-border-gradient">
        {card}
      </div>
    )
  }

  return card
}
