'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Users, Baby, Plus, Check, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/store/cart'
import { useEffect, useState, useRef, useCallback } from 'react'

const CATEGORY_LABELS: Record<string, string> = {
  inflaveis: 'Inflável',
  toboshark: 'Toboshark',
  radicais: 'Radical',
  batalhas: 'Batalha',
  tematicos: 'Temático',
  aquaticos: 'Aquático',
}

interface FeaturedCard3DProps {
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
  index: number
}

export function FeaturedCard3D({ brinquedo, index }: FeaturedCard3DProps) {
  const { id, nome, slug, categoria, faixaEtaria, capacidade, fotos, fotoDestaque } = brinquedo
  const { add, remove, has, open } = useCart()
  const [mounted, setMounted] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [gloss, setGloss] = useState({ x: 50, y: 50 })
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    useCart.persist.rehydrate()
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  const inCart = mounted && has(id)
  const imageSrc = fotoDestaque ?? (fotos && fotos.length > 0 ? fotos[0] : null)
  const categoryLabel = CATEGORY_LABELS[categoria] ?? categoria

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapperRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTilt({ x: (y - 0.5) * -18, y: (x - 0.5) * 18 })
    setGloss({ x: x * 100, y: y * 100 })
  }, [])

  const handleMouseEnter = useCallback(() => setHovered(true), [])

  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    setTilt({ x: 0, y: 0 })
    setGloss({ x: 50, y: 50 })
  }, [])

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (inCart) remove(id)
    else add({ id, nome, slug, fotoDestaque: imageSrc, categoria })
  }

  return (
    /* Shimmer border wrapper */
    <div
      className="p-[2px] rounded-[17px] shimmer-border-gradient animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms`, perspective: '900px' }}
    >
      {/* 3D tilt wrapper */}
      <div
        ref={wrapperRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: hovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.04, 1.04, 1.04)`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: hovered
            ? 'transform 80ms linear'
            : 'transform 500ms cubic-bezier(0.03, 0.98, 0.52, 0.99)',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          borderRadius: '15px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: hovered
            ? `${tilt.y * -1.5}px ${tilt.x * 1.5}px 40px rgba(37,99,235,0.35), 0 20px 60px rgba(0,0,0,0.2)`
            : '0 4px 24px rgba(37,99,235,0.08)',
        }}
      >
        {/* Card surface */}
        <div className="bg-brand-surface flex flex-col h-full">

          {/* Image */}
          <Link href={`/brinquedos/${slug}`} className="relative aspect-[4/3] bg-brand-surface-2 overflow-hidden block">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={nome}
                fill
                className="object-cover"
                style={{
                  transform: hovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 500ms cubic-bezier(0.03, 0.98, 0.52, 0.99)',
                }}
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-brand-muted text-sm">Sem foto</span>
              </div>
            )}

            {/* Category badge */}
            <div className="absolute top-2.5 left-2.5 z-10" style={{ transform: 'translateZ(20px)' }}>
              <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {categoryLabel}
              </span>
            </div>

            {/* DESTAQUE badge */}
            <div className="absolute top-2.5 right-2.5 z-10" style={{ transform: 'translateZ(25px)' }}>
              <span className="flex items-center gap-1 bg-brand-accent text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                <Star className="size-2.5 fill-white" />
                Top
              </span>
            </div>

            {/* In-cart overlay */}
            {inCart && (
              <div className="absolute inset-0 bg-brand-accent/15 flex items-center justify-center z-20">
                <div className="bg-brand-accent text-white rounded-full p-2.5 shadow-lg">
                  <Check className="size-5" />
                </div>
              </div>
            )}
          </Link>

          {/* Content */}
          <div className="flex flex-col gap-3 p-4 flex-1">
            <Link href={`/brinquedos/${slug}`}>
              <h3
                className="text-brand-text font-bold text-sm sm:text-base leading-snug"
                style={{
                  transform: hovered ? 'translateZ(12px)' : 'translateZ(0)',
                  transition: 'transform 300ms ease',
                  display: 'block',
                }}
              >
                {nome}
              </h3>
            </Link>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-brand-muted text-xs">
                <Baby className="size-3 shrink-0" />
                <span>{faixaEtaria}</span>
              </div>
              <div className="flex items-center gap-1.5 text-brand-muted text-xs">
                <Users className="size-3 shrink-0" />
                <span>{capacidade}</span>
              </div>
            </div>

            <div className="mt-auto flex gap-2">
              <Link
                href={`/brinquedos/${slug}`}
                className="flex-1 inline-flex items-center justify-center border border-brand-border text-brand-text hover:border-brand-accent hover:text-brand-accent font-semibold text-xs px-2 py-2 rounded-lg transition-colors"
              >
                Ver detalhes
              </Link>
              <button
                onClick={handleCart}
                className={cn(
                  'inline-flex items-center justify-center gap-1 font-semibold text-xs px-3 py-2 rounded-lg transition-colors',
                  inCart
                    ? 'bg-brand-accent text-white hover:bg-red-500'
                    : 'bg-brand-accent hover:bg-brand-accent-hover text-white'
                )}
                aria-label={inCart ? 'Remover do orçamento' : 'Adicionar ao orçamento'}
              >
                {inCart ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                <span className="hidden sm:inline">{inCart ? 'Adicionado' : 'Orçar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gloss overlay — follows cursor */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[15px]"
          style={{
            background: `radial-gradient(circle at ${gloss.x}% ${gloss.y}%, rgba(255,255,255,0.18) 0%, transparent 65%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 300ms ease',
          }}
        />
      </div>
    </div>
  )
}
