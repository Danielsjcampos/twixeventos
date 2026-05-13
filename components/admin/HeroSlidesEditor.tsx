'use client'

import { useState } from 'react'
import {
  Plus, Trash2, ChevronUp, ChevronDown, ChevronDown as Expand,
  Image as ImageIcon, Video, Palette, Droplets,
  Eye, EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SingleImageUpload } from './SingleImageUpload'
import type { HeroSlide } from '@/types'

const GRADIENTES = [
  { label: 'Noite Azul',    value: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e3a5f 100%)' },
  { label: 'Pôr do Sol',    value: 'linear-gradient(135deg, #1a0533 0%, #3b0764 50%, #c2410c 100%)' },
  { label: 'Floresta',      value: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)' },
  { label: 'Carvão',        value: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)' },
  { label: 'Oceano',        value: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)' },
  { label: 'Aurora',        value: 'linear-gradient(135deg, #0d0221 0%, #190d3a 40%, #0d3b5e 70%, #0a6b5d 100%)' },
  { label: 'Laranja Escuro',value: 'linear-gradient(135deg, #431407 0%, #7c2d12 50%, #ea580c 100%)' },
  { label: 'Roxo Profundo', value: 'linear-gradient(135deg, #0f0320 0%, #2e1065 50%, #4c1d95 100%)' },
]

function newSlide(): HeroSlide {
  return {
    id: crypto.randomUUID(),
    tipo: 'gradiente',
    fundoUrl: '',
    fundoCor: GRADIENTES[0].value,
    overlay: 40,
    titulo: 'DIVERSÃO',
    tituloDestaque: 'INESQUECÍVEL',
    subtitulo: 'Transforme seu evento com a melhor seleção de brinquedos infláveis e eletrônicos.',
    badge: 'Locação de Brinquedos em SJC',
    ctaTexto: 'Reservar Agora',
    ctaLink: '',
    ctaTexto2: 'Ver Catálogo',
    ctaLink2: '/brinquedos',
    ativo: true,
  }
}

const TIPO_ICONS = {
  imagem:    { icon: ImageIcon, label: 'Imagem',    color: '#3B82F6' },
  video:     { icon: Video,     label: 'Vídeo',     color: '#8B5CF6' },
  gradiente: { icon: Palette,   label: 'Gradiente', color: '#10B981' },
  cor:       { icon: Droplets,  label: 'Cor sólida',color: '#F59E0B' },
}

interface Props {
  initialSlidesJson: string
  onChange: (json: string) => void
}

export function HeroSlidesEditor({ initialSlidesJson, onChange }: Props) {
  const [slides, setSlides] = useState<HeroSlide[]>(() => {
    try { return JSON.parse(initialSlidesJson || '[]') } catch { return [] }
  })
  const [expanded, setExpanded] = useState<string | null>(null)

  const mutate = (fn: (prev: HeroSlide[]) => HeroSlide[]) => {
    setSlides(prev => {
      const next = fn(prev)
      onChange(JSON.stringify(next))
      return next
    })
  }

  const update = (id: string, patch: Partial<HeroSlide>) =>
    mutate(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))

  const add = () => {
    const s = newSlide()
    mutate(prev => [...prev, s])
    setExpanded(s.id)
  }

  const remove = (id: string) => {
    mutate(prev => prev.filter(s => s.id !== id))
    if (expanded === id) setExpanded(null)
  }

  const move = (id: string, dir: -1 | 1) => {
    mutate(prev => {
      const i = prev.findIndex(s => s.id === id)
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-brand-muted">{slides.length} slide{slides.length !== 1 ? 's' : ''} · {slides.filter(s => s.ativo).length} ativo{slides.filter(s => s.ativo).length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={add}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors"
        >
          <Plus size={15} /> Adicionar Slide
        </button>
      </div>

      {slides.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-brand-border py-16 flex flex-col items-center gap-3 text-brand-muted">
          <Palette size={32} className="opacity-30" />
          <p className="text-sm font-medium">Nenhum slide criado</p>
          <p className="text-xs opacity-60">Clique em &ldquo;Adicionar Slide&rdquo; para começar</p>
        </div>
      )}

      {slides.map((slide, i) => {
        const tipoInfo = TIPO_ICONS[slide.tipo]
        const isOpen = expanded === slide.id
        const preview = slide.tipo === 'imagem' && slide.fundoUrl
          ? slide.fundoUrl
          : slide.tipo === 'video' && slide.fundoUrl
          ? null
          : null

        return (
          <div
            key={slide.id}
            className={cn(
              'rounded-xl border transition-colors duration-150 overflow-hidden',
              isOpen ? 'border-brand-accent/50' : 'border-brand-border',
              !slide.ativo && 'opacity-60'
            )}
            style={{ backgroundColor: 'var(--brand-surface)' }}
          >
            {/* Slide header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
              onClick={() => setExpanded(isOpen ? null : slide.id)}
            >
              {/* Color/image preview */}
              <div
                className="w-14 h-9 rounded-lg flex-shrink-0 flex items-center justify-center border border-white/10 overflow-hidden text-xs font-bold text-white/60"
                style={{
                  background: slide.tipo === 'imagem' && slide.fundoUrl
                    ? `url(${slide.fundoUrl}) center/cover`
                    : slide.tipo === 'cor' && slide.fundoCor
                    ? slide.fundoCor
                    : slide.tipo === 'gradiente' && slide.fundoCor
                    ? slide.fundoCor
                    : '#1e293b',
                }}
              >
                {slide.tipo === 'video' && <Video size={14} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-text truncate">
                    {slide.titulo}{slide.tituloDestaque ? ` ${slide.tituloDestaque}` : ''}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
                    style={{ backgroundColor: `${tipoInfo.color}20`, color: tipoInfo.color }}
                  >
                    {tipoInfo.label}
                  </span>
                </div>
                <p className="text-xs text-brand-muted mt-0.5">Slide {i + 1}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => update(slide.id, { ativo: !slide.ativo })}
                  className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-colors', slide.ativo ? 'text-brand-accent hover:bg-brand-accent/10' : 'text-brand-muted hover:bg-brand-surface-2')}
                  title={slide.ativo ? 'Desativar' : 'Ativar'}
                >
                  {slide.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => move(slide.id, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-surface-2 disabled:opacity-30 transition-colors">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => move(slide.id, 1)} disabled={i === slides.length - 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-surface-2 disabled:opacity-30 transition-colors">
                  <ChevronDown size={14} />
                </button>
                <button onClick={() => remove(slide.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={14} />
                </button>
                <Expand size={14} className={cn('ml-1 text-brand-muted transition-transform duration-200', isOpen && 'rotate-180')} />
              </div>
            </div>

            {/* Expanded editor */}
            {isOpen && (
              <div className="border-t border-brand-border px-4 py-5 flex flex-col gap-6" style={{ backgroundColor: 'var(--brand-surface-2)' }}>
                {/* Tipo */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Tipo de fundo</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(TIPO_ICONS) as [HeroSlide['tipo'], typeof TIPO_ICONS[keyof typeof TIPO_ICONS]][]).map(([tipo, info]) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => update(slide.id, { tipo })}
                        className={cn(
                          'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all',
                          slide.tipo === tipo
                            ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                            : 'border-brand-border text-brand-muted hover:border-brand-border hover:bg-brand-surface hover:text-brand-text'
                        )}
                      >
                        <info.icon size={18} />
                        {info.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fundo — imagem */}
                {slide.tipo === 'imagem' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Imagem de fundo</label>
                    <SingleImageUpload
                      value={slide.fundoUrl}
                      onChange={url => update(slide.id, { fundoUrl: url })}
                      onRemove={() => update(slide.id, { fundoUrl: '' })}
                      label="Upload da imagem de fundo (ideal: 1920×1080 px)"
                    />
                  </div>
                )}

                {/* Fundo — video */}
                {slide.tipo === 'video' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">URL do vídeo de fundo</label>
                    <input
                      type="url"
                      value={slide.fundoUrl}
                      onChange={e => update(slide.id, { fundoUrl: e.target.value })}
                      placeholder="https://... (MP4, WebM ou Cloudinary)"
                      className={inputCls}
                    />
                    <p className="text-xs text-brand-muted">Cole uma URL de vídeo MP4 ou WebM. Recomendado: vídeo curto, sem som, 10–30s.</p>
                  </div>
                )}

                {/* Fundo — gradiente */}
                {slide.tipo === 'gradiente' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Gradiente de fundo</label>
                    <div className="grid grid-cols-4 gap-2">
                      {GRADIENTES.map(g => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => update(slide.id, { fundoCor: g.value })}
                          className={cn(
                            'h-12 rounded-lg border-2 transition-all text-[10px] font-semibold text-white/70 flex items-end justify-start p-1.5',
                            slide.fundoCor === g.value ? 'border-white' : 'border-transparent hover:border-white/40'
                          )}
                          style={{ background: g.value }}
                          title={g.label}
                        >
                          {slide.fundoCor === g.value && g.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1.5 mt-1">
                      <label className="text-xs text-brand-muted">CSS customizado</label>
                      <input
                        type="text"
                        value={slide.fundoCor}
                        onChange={e => update(slide.id, { fundoCor: e.target.value })}
                        placeholder="linear-gradient(135deg, #020617, #1e3a5f)"
                        className={cn(inputCls, 'font-mono text-xs')}
                      />
                    </div>
                  </div>
                )}

                {/* Fundo — cor sólida */}
                {slide.tipo === 'cor' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Cor de fundo</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={slide.fundoCor || '#020617'}
                        onChange={e => update(slide.id, { fundoCor: e.target.value })}
                        className="w-12 h-10 rounded-lg border border-brand-border cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={slide.fundoCor}
                        onChange={e => update(slide.id, { fundoCor: e.target.value })}
                        placeholder="#020617"
                        className={cn(inputCls, 'font-mono flex-1')}
                      />
                    </div>
                  </div>
                )}

                {/* Overlay */}
                {(slide.tipo === 'imagem' || slide.tipo === 'video') && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                      Escurecimento do fundo — {slide.overlay}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={85}
                      value={slide.overlay}
                      onChange={e => update(slide.id, { overlay: Number(e.target.value) })}
                      className="w-full accent-brand-accent"
                    />
                  </div>
                )}

                <hr className="border-brand-border" />

                {/* Textos */}
                <div className="flex flex-col gap-4">
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Textos</label>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-brand-muted">Badge / etiqueta (opcional)</label>
                    <input type="text" value={slide.badge} onChange={e => update(slide.id, { badge: e.target.value })} placeholder="Locação de Brinquedos em SJC" className={inputCls} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-brand-muted">Título</label>
                      <input type="text" value={slide.titulo} onChange={e => update(slide.id, { titulo: e.target.value })} placeholder="DIVERSÃO" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-brand-muted">Destaque (cor/gradiente)</label>
                      <input type="text" value={slide.tituloDestaque} onChange={e => update(slide.id, { tituloDestaque: e.target.value })} placeholder="INESQUECÍVEL" className={inputCls} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-brand-muted">Subtítulo (opcional)</label>
                    <textarea value={slide.subtitulo} onChange={e => update(slide.id, { subtitulo: e.target.value })} rows={2} placeholder="Transforme seu evento..." className={cn(inputCls, 'resize-none')} />
                  </div>
                </div>

                <hr className="border-brand-border" />

                {/* CTAs */}
                <div className="flex flex-col gap-4">
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Botões de ação</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-brand-muted">Botão 1 — texto</label>
                      <input type="text" value={slide.ctaTexto} onChange={e => update(slide.id, { ctaTexto: e.target.value })} placeholder="Reservar Agora" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-brand-muted">Botão 1 — link</label>
                      <input type="text" value={slide.ctaLink} onChange={e => update(slide.id, { ctaLink: e.target.value })} placeholder="https://wa.me/..." className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-brand-muted">Botão 2 — texto</label>
                      <input type="text" value={slide.ctaTexto2} onChange={e => update(slide.id, { ctaTexto2: e.target.value })} placeholder="Ver Catálogo" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-brand-muted">Botão 2 — link</label>
                      <input type="text" value={slide.ctaLink2} onChange={e => update(slide.id, { ctaLink2: e.target.value })} placeholder="/brinquedos" className={inputCls} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {slides.length > 0 && (
        <p className="text-xs text-brand-muted text-right pt-2">
          Clique em <strong>Salvar alterações</strong> abaixo para persistir os slides.
        </p>
      )}
    </div>
  )
}

const inputCls = 'w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-brand-text placeholder:text-brand-muted text-sm focus:outline-none focus:border-brand-accent transition-colors'
