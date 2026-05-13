'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Check, ShoppingCart, X } from 'lucide-react'
import { whatsappLink, WHATSAPP_NUMBER, cn } from '@/lib/utils'
import { useCart } from '@/lib/store/cart'

interface Brinquedo {
  id: string
  nome: string
  slug: string
  descricao: string | null
  categoria: string
  faixaEtaria: string
  capacidade: string
  dimensoes: string
  energia: string | null
  fotos: string[] | null
  fotoDestaque: string | null
  destaque: boolean
}

export function BrinquedoDetail({ brinquedo }: { brinquedo: Brinquedo }) {
  const { add, remove, has, open } = useCart()
  const [mounted, setMounted] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    useCart.persist.rehydrate()
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  const inCart = mounted && has(brinquedo.id)

  const fotos = brinquedo.fotos?.length
    ? brinquedo.fotos
    : brinquedo.fotoDestaque
    ? [brinquedo.fotoDestaque]
    : []

  const waLink = whatsappLink(
    WHATSAPP_NUMBER,
    `Olá! Tenho interesse em alugar o *${brinquedo.nome}* para um evento. Poderia me passar mais informações?`
  )

  const specs = [
    { label: 'Faixa Etária', value: brinquedo.faixaEtaria },
    { label: 'Capacidade',   value: brinquedo.capacidade },
    { label: 'Dimensões',    value: brinquedo.dimensoes },
    { label: 'Energia',      value: brinquedo.energia ?? 'Não requer' },
    { label: 'Categoria',    value: brinquedo.categoria },
  ]

  const handleCart = () => {
    if (inCart) {
      remove(brinquedo.id)
    } else {
      add({
        id: brinquedo.id,
        nome: brinquedo.nome,
        slug: brinquedo.slug,
        fotoDestaque: brinquedo.fotoDestaque,
        categoria: brinquedo.categoria,
      })
    }
  }

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Galeria */}
        <div className="space-y-3">
          {/* Foto principal */}
          <div
            className="relative aspect-4/3 rounded-2xl overflow-hidden bg-brand-surface-2 cursor-zoom-in"
            onClick={() => fotos.length > 0 && setLightbox(true)}
          >
            {fotos[activePhoto] ? (
              <Image
                src={fotos[activePhoto]}
                alt={brinquedo.nome}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-muted">
                Sem foto disponível
              </div>
            )}
            {fotos.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                {activePhoto + 1} / {fotos.length}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {fotos.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {fotos.map((foto, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={cn(
                    'relative aspect-square rounded-lg overflow-hidden bg-brand-surface-2 transition-all',
                    i === activePhoto ? 'ring-2 ring-brand-accent' : 'opacity-60 hover:opacity-100'
                  )}
                >
                  <Image src={foto} alt={`${brinquedo.nome} ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalhes */}
        <div>
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className="bg-brand-accent text-white text-xs px-3 py-1 rounded-full uppercase font-semibold">
              {brinquedo.categoria}
            </span>
            {brinquedo.destaque && (
              <span className="bg-yellow-600/20 text-yellow-500 text-xs px-3 py-1 rounded-full border border-yellow-600/40">
                ⭐ Destaque
              </span>
            )}
            {inCart && (
              <span className="bg-green-600/20 text-green-400 text-xs px-3 py-1 rounded-full border border-green-600/40 flex items-center gap-1">
                <Check className="size-3" /> No orçamento
              </span>
            )}
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-bold text-brand-text uppercase mt-3">
            {brinquedo.nome}
          </h1>

          {brinquedo.descricao && (
            <p className="text-brand-muted mt-4 leading-relaxed">{brinquedo.descricao}</p>
          )}

          {/* Specs */}
          <div className="mt-6 bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
            {specs.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-brand-border last:border-0">
                <span className="text-brand-muted text-sm">{label}</span>
                <span className="text-brand-text text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-8 space-y-3">
            <button
              onClick={handleCart}
              className={cn(
                'flex items-center justify-center gap-2 w-full font-bold py-4 rounded-xl text-lg transition-colors',
                inCart
                  ? 'bg-green-600 hover:bg-red-600 text-white'
                  : 'bg-brand-surface border-2 border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-white'
              )}
            >
              {inCart ? (
                <><Check className="size-6" /> Adicionado ao orçamento</>
              ) : (
                <><ShoppingCart className="size-6" /> Adicionar ao orçamento</>
              )}
            </button>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-4 rounded-xl text-lg transition-colors"
            >
              <WhatsAppIcon />
              Reservar via WhatsApp
            </a>

            <Link
              href="/brinquedos"
              className="flex items-center justify-center w-full border border-brand-border text-brand-text hover:border-brand-accent hover:text-brand-accent font-semibold py-3 rounded-xl transition-colors"
            >
              Ver mais brinquedos
            </Link>
          </div>

          <p className="text-brand-muted text-xs mt-4 text-center">
            Entrada de apenas 10% para garantir a data · Montagem inclusa · Atendimento 24h
          </p>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && fotos.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setLightbox(false)}
          >
            <X className="size-8" />
          </button>
          <div className="relative max-w-4xl max-h-[90dvh] w-full h-full">
            <Image
              src={fotos[activePhoto]}
              alt={brinquedo.nome}
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {fotos.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
              {fotos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActivePhoto(i) }}
                  className={cn('w-2 h-2 rounded-full transition-all', i === activePhoto ? 'bg-white scale-125' : 'bg-white/40')}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
