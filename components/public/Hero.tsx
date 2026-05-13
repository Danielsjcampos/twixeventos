'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { whatsappLink, WHATSAPP_NUMBER } from '@/lib/utils'
import type { HeroSlide } from '@/types'

type Direction = 'next' | 'prev'

/* ─── Fallback hardcoded (sem slides cadastrados) ─── */
function HeroFallback() {
  const waLink = whatsappLink(WHATSAPP_NUMBER, 'Olá! Gostaria de reservar um brinquedo para meu evento.')
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#020617] pt-20">
      <div className="absolute inset-0 pointer-events-none opacity-[0.15]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 right-1/4 w-[30rem] h-[30rem] bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-600 rounded-full mix-blend-screen filter blur-[100px]" />
      </div>
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2.5 bg-white/5 border border-white/10 backdrop-blur-md text-blue-300 text-xs font-medium uppercase tracking-widest px-5 py-2.5 rounded-full mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          Locação de Brinquedos em SJC
        </div>
        <h1 className="font-[family-name:var(--font-display)] font-black text-white leading-[0.9] tracking-tighter mb-8" style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)' }}>
          DIVERSÃO <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">INESQUECÍVEL</span>
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl leading-relaxed max-w-2xl mb-12 font-light">
          Transforme seu evento com a melhor seleção de brinquedos infláveis e eletrônicos. Montagem profissional, segurança garantida e alegria sem limites.
        </p>
        <div className="flex flex-col sm:flex-row gap-5">
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="group relative inline-flex items-center justify-center gap-3 bg-white text-slate-950 font-semibold px-8 py-4 rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95">
            Reservar Agora <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <Link href="/brinquedos" className="group inline-flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 font-medium px-8 py-4 rounded-full transition-all hover:scale-105">
            Ver Catálogo
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Package className="size-3" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─── Slide background with Ken Burns on images ─── */
function SlideBackground({ slide, active }: { slide: HeroSlide; active: boolean }) {
  const overlayOpacity = slide.overlay / 100

  if (slide.tipo === 'imagem' && slide.fundoUrl) {
    return (
      <>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${slide.fundoUrl})`,
            // Ken Burns: slow zoom only when this slide is active
            transform: active ? 'scale(1.08)' : 'scale(1)',
            transition: active ? 'transform 6s ease-out' : 'none',
            transformOrigin: '50% 60%',
          }}
        />
        <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />
      </>
    )
  }

  if (slide.tipo === 'video' && slide.fundoUrl) {
    return (
      <>
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={slide.fundoUrl}
        />
        <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />
      </>
    )
  }

  if (slide.tipo === 'gradiente' && slide.fundoCor) {
    return <div className="absolute inset-0" style={{ background: slide.fundoCor }} />
  }

  if (slide.tipo === 'cor' && slide.fundoCor) {
    return <div className="absolute inset-0" style={{ backgroundColor: slide.fundoCor }} />
  }

  return <div className="absolute inset-0 bg-[#020617]" />
}

/* ─── Slide content (text + CTAs) ─── */
function SlideContent({ slide, animKey }: { slide: HeroSlide; animKey: number }) {
  const waLink = whatsappLink(WHATSAPP_NUMBER, 'Olá! Gostaria de reservar um brinquedo para meu evento.')
  const cta1Link = slide.ctaLink || waLink
  const cta2Link = slide.ctaLink2 || '/brinquedos'
  const isExternalCta1 = cta1Link.startsWith('http')

  return (
    // animKey forces a re-mount on each slide change → CSS animation restarts
    <div key={animKey} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center text-center hero-slide-content">
      {/* Badge */}
      {slide.badge && (
        <div className="hero-item hero-delay-1 inline-flex items-center gap-2.5 bg-white/5 border border-white/10 backdrop-blur-md text-blue-300 text-xs font-medium uppercase tracking-widest px-5 py-2.5 rounded-full mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          {slide.badge}
        </div>
      )}

      {/* Headline */}
      {(slide.titulo || slide.tituloDestaque) && (
        <h1
          className="hero-item hero-delay-2 font-[family-name:var(--font-display)] font-black text-white leading-[0.9] tracking-tighter mb-8"
          style={{ fontSize: 'clamp(3rem, 7vw, 6.5rem)' }}
        >
          {slide.titulo && <>{slide.titulo}<br /></>}
          {slide.tituloDestaque && (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
              {slide.tituloDestaque}
            </span>
          )}
        </h1>
      )}

      {/* Subtitle */}
      {slide.subtitulo && (
        <p className="hero-item hero-delay-3 text-slate-300 text-lg sm:text-xl leading-relaxed max-w-2xl mb-12 font-light">
          {slide.subtitulo}
        </p>
      )}

      {/* CTAs */}
      {(slide.ctaTexto || slide.ctaTexto2) && (
        <div className="hero-item hero-delay-4 flex flex-col sm:flex-row gap-5">
          {slide.ctaTexto && (
            isExternalCta1 ? (
              <a href={cta1Link} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center justify-center gap-3 bg-white text-slate-950 font-semibold px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95">
                {slide.ctaTexto} <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </a>
            ) : (
              <Link href={cta1Link} className="group inline-flex items-center justify-center gap-3 bg-white text-slate-950 font-semibold px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95">
                {slide.ctaTexto} <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )
          )}
          {slide.ctaTexto2 && (
            <Link href={cta2Link} className="group inline-flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 font-medium px-8 py-4 rounded-full transition-all hover:scale-105">
              {slide.ctaTexto2}
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Package className="size-3" />
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Carousel ─── */
function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [direction, setDirection] = useState<Direction>('next')
  const [transitioning, setTransitioning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [contentKey, setContentKey] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const DURATION = 700 // ms

  const go = useCallback((idx: number, dir: Direction = 'next') => {
    if (transitioning) return
    const next = (idx + slides.length) % slides.length
    if (next === current) return
    setDirection(dir)
    setPrev(current)
    setCurrent(next)
    setContentKey(k => k + 1)
    setTransitioning(true)
    setTimeout(() => { setPrev(null); setTransitioning(false) }, DURATION + 50)
  }, [current, slides.length, transitioning])

  useEffect(() => {
    if (slides.length <= 1 || paused) return
    intervalRef.current = setInterval(() => go(current + 1, 'next'), 5500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [current, paused, go, slides.length])

  // Classes for slide transitions
  const slideIn = direction === 'next' ? 'hero-slide-in-right' : 'hero-slide-in-left'
  const slideOut = direction === 'next' ? 'hero-slide-out-left' : 'hero-slide-out-right'

  return (
    <section
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-20"
      style={{ isolation: 'isolate' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Backgrounds with direction-aware slide + crossfade */}
      {slides.map((slide, i) => {
        const isActive = i === current
        const isPrev = i === prev
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 ${
              isActive ? slideIn :
              isPrev ? slideOut :
              'opacity-0 pointer-events-none'
            }`}
            style={{ zIndex: isActive ? 2 : isPrev ? 1 : 0 }}
            aria-hidden={!isActive}
          >
            <SlideBackground slide={slide} active={isActive} />
          </div>
        )
      })}

      {/* Content: re-mounts on each slide for animation restart */}
      <div className="relative w-full" style={{ zIndex: slides.length + 2 }}>
        <SlideContent key={contentKey} slide={slides[current]} animKey={contentKey} />
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => { go(current - 1, 'prev'); setPaused(true) }}
            disabled={transitioning}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110 disabled:opacity-50"
            aria-label="Slide anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => { go(current + 1, 'next'); setPaused(true) }}
            disabled={transitioning}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110 disabled:opacity-50"
            aria-label="Próximo slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { go(i, i > current ? 'next' : 'prev'); setPaused(true) }}
                className="transition-all duration-300"
                style={{
                  width: i === current ? 28 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === current ? 'white' : 'rgba(255,255,255,0.35)',
                }}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Progress bar */}
          {!paused && (
            <div className="absolute bottom-0 left-0 right-0 z-30 h-0.5 bg-white/10">
              <div
                key={current}
                className="h-full bg-white/60"
                style={{ animation: 'hero-progress 5.5s linear forwards' }}
              />
            </div>
          )}
        </>
      )}

      <style>{`
        /* ── Progress bar ── */
        @keyframes hero-progress {
          from { width: 0% }
          to   { width: 100% }
        }

        /* ── Background slide transitions ── */
        @keyframes slideInFromRight {
          from { transform: translateX(6%) scale(1.04); opacity: 0; }
          to   { transform: translateX(0)   scale(1);    opacity: 1; }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-6%) scale(1.04); opacity: 0; }
          to   { transform: translateX(0)   scale(1);    opacity: 1; }
        }
        @keyframes slideOutToLeft {
          from { transform: translateX(0)    scale(1);    opacity: 1; }
          to   { transform: translateX(-6%)  scale(0.97); opacity: 0; }
        }
        @keyframes slideOutToRight {
          from { transform: translateX(0)   scale(1);    opacity: 1; }
          to   { transform: translateX(6%)  scale(0.97); opacity: 0; }
        }

        .hero-slide-in-right {
          animation: slideInFromRight ${DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .hero-slide-in-left {
          animation: slideInFromLeft ${DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .hero-slide-out-left {
          animation: slideOutToLeft ${DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .hero-slide-out-right {
          animation: slideOutToRight ${DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        /* ── Content entrance animations ── */
        @keyframes heroItemUp {
          from { opacity: 0; transform: translateY(28px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }

        .hero-slide-content .hero-item {
          opacity: 0;
          animation: heroItemUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .hero-slide-content .hero-delay-1 { animation-delay: 0.15s; }
        .hero-slide-content .hero-delay-2 { animation-delay: 0.30s; }
        .hero-slide-content .hero-delay-3 { animation-delay: 0.45s; }
        .hero-slide-content .hero-delay-4 { animation-delay: 0.60s; }
      `}</style>
    </section>
  )
}

/* ─── Main export ─── */
export function Hero({ slides = [] }: { slides?: HeroSlide[] }) {
  const activeSlides = slides.filter(s => s.ativo)
  if (activeSlides.length === 0) return <HeroFallback />
  return <HeroCarousel slides={activeSlides} />
}
