'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { slugify, CATEGORIAS, extractYouTubeId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ImageUpload } from './ImageUpload'
import { Plus, X, Sparkles, Loader2, Tag, ChevronDown, Video } from 'lucide-react'
import type { Brinquedo } from '@/types'

interface Props {
  brinquedo?: Brinquedo
  onSuccess?: () => void
}

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  slug: z.string().min(2, 'Slug obrigatório'),
  categoria: z.string().min(1, 'Categoria obrigatória'),
  tags: z.array(z.string()),
  faixaEtaria: z.string().min(1, 'Faixa etária obrigatória'),
  capacidade: z.string().min(1, 'Capacidade obrigatória'),
  dimensoes: z.string().min(1, 'Dimensões obrigatórias'),
  energia: z.string().optional(),
  descricao: z.string().optional(),
  precoReferencia: z.string().optional(),
  status: z.enum(['publicado', 'rascunho', 'invisivel']),
  destaque: z.boolean(),
  fotos: z.array(z.string()),
  fotoDestaque: z.string().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  seoKeywords: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

const CATEGORIAS_FORM = CATEGORIAS.filter((c) => c.value !== 'todos')

// Shared input/select class
const field =
  'w-full rounded-xl border px-3 py-2.5 text-sm text-brand-text bg-brand-surface-2 border-brand-border placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 transition-all'

// ---------------------------------------------------------------------------
// CategoryTagsInput — escolha categoria principal + tags extras
// ---------------------------------------------------------------------------
interface CategoryTagsProps {
  categoria: string
  tags: string[]
  onChange: (categoria: string, tags: string[]) => void
  error?: string
}

function CategoryTagsInput({ categoria, tags, onChange, error }: CategoryTagsProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [newTag, setNewTag] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allSelected = [categoria, ...tags].filter(Boolean)

  const selectPrimary = (value: string) => {
    // If it's already a tag, promote it to primary and push old primary to tags
    if (tags.includes(value)) {
      const newTags = tags.filter((t) => t !== value)
      if (categoria) newTags.unshift(categoria)
      onChange(value, newTags)
    } else {
      // New primary; if same as current, no-op
      if (value === categoria) return
      const newTags = categoria ? [...tags, categoria] : [...tags]
      onChange(value, newTags.filter((t) => t !== value))
    }
    setShowDropdown(false)
  }

  const removeTag = (tag: string) => {
    if (tag === categoria) {
      // Promote first tag to primary
      const [first, ...rest] = tags
      onChange(first ?? '', rest)
    } else {
      onChange(categoria, tags.filter((t) => t !== tag))
    }
  }

  const addCustomTag = () => {
    const val = newTag.trim().toLowerCase().replace(/\s+/g, '-')
    if (!val || allSelected.includes(val)) { setNewTag(''); return }
    if (!categoria) {
      onChange(val, tags)
    } else {
      onChange(categoria, [...tags, val])
    }
    setNewTag('')
  }

  const toggleExtraTag = (value: string) => {
    if (value === categoria) return // already primary
    if (tags.includes(value)) {
      onChange(categoria, tags.filter((t) => t !== value))
    } else {
      onChange(categoria, [...tags, value])
    }
  }

  const labelOf = (val: string) =>
    CATEGORIAS_FORM.find((c) => c.value === val)?.label ?? val

  return (
    <div className="flex flex-col gap-2">
      {/* Selected chips */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {allSelected.length === 0 && (
          <span className="text-xs text-brand-muted/50 self-center">Nenhuma categoria selecionada</span>
        )}
        {allSelected.map((val, i) => (
          <span
            key={val}
            className={[
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
              i === 0
                ? 'bg-brand-accent/15 border-brand-accent/50 text-brand-accent'
                : 'bg-brand-surface border-brand-border text-brand-muted',
            ].join(' ')}
          >
            {i === 0 && <Tag className="size-3 shrink-0" />}
            {labelOf(val)}
            <button
              type="button"
              onClick={() => removeTag(val)}
              className="ml-0.5 hover:text-red-400 transition-colors"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex gap-2">
        {/* Primary category dropdown */}
        <div className="relative flex-1" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown((v) => !v)}
            className={`${field} flex items-center justify-between`}
          >
            <span className={categoria ? 'text-brand-text' : 'text-brand-muted/50'}>
              {categoria ? labelOf(categoria) : 'Categoria principal...'}
            </span>
            <ChevronDown className="size-4 text-brand-muted shrink-0" />
          </button>

          {showDropdown && (
            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden">
              {CATEGORIAS_FORM.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => selectPrimary(c.value)}
                  className={[
                    'w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between',
                    c.value === categoria
                      ? 'bg-brand-accent/10 text-brand-accent font-semibold'
                      : 'text-brand-text hover:bg-brand-surface-2',
                  ].join(' ')}
                >
                  {c.label}
                  {c.value === categoria && <Tag className="size-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Custom tag input */}
        <div className="flex gap-1.5 flex-1">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addCustomTag() }
            }}
            placeholder="Nova tag..."
            className={field}
          />
          <button
            type="button"
            onClick={addCustomTag}
            disabled={!newTag.trim()}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-brand-border bg-brand-surface-2 text-brand-muted hover:border-brand-accent hover:text-brand-accent disabled:opacity-40 transition-colors text-xs font-semibold shrink-0"
          >
            <Plus className="size-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Quick-add extra categories */}
      <div className="flex flex-wrap gap-1">
        {CATEGORIAS_FORM.filter((c) => c.value !== categoria && !tags.includes(c.value)).map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => toggleExtraTag(c.value)}
            className="px-2 py-0.5 rounded-lg border border-brand-border text-xs text-brand-muted hover:border-brand-accent/50 hover:text-brand-accent transition-colors"
          >
            + {c.label}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Form
// ---------------------------------------------------------------------------
export function ToyForm({ brinquedo, onSuccess }: Props) {
  const isEditing = !!brinquedo
  const [isSuggestingAi, setIsSuggestingAi] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: brinquedo?.nome ?? '',
      slug: brinquedo?.slug ?? '',
      categoria: brinquedo?.categoria ?? '',
      tags: brinquedo?.tags ?? [],
      faixaEtaria: brinquedo?.faixaEtaria ?? '',
      capacidade: brinquedo?.capacidade ?? '',
      dimensoes: brinquedo?.dimensoes ?? '',
      energia: brinquedo?.energia ?? '',
      descricao: brinquedo?.descricao ?? '',
      precoReferencia: brinquedo?.precoReferencia ?? '',
      status: (brinquedo?.status as 'publicado' | 'rascunho' | 'invisivel') ?? 'publicado',
      destaque: brinquedo?.destaque ?? false,
      fotos: brinquedo?.fotos ?? [],
      fotoDestaque: brinquedo?.fotoDestaque ?? null,
      seoTitle: brinquedo?.seoTitle ?? '',
      seoDescription: brinquedo?.seoDescription ?? '',
      seoKeywords: brinquedo?.seoKeywords ?? '',
      videoUrl: brinquedo?.videoUrl ?? '',
    },
  })

  // Auto-generate slug from nome
  const nomeValue = watch('nome')
  useEffect(() => {
    if (!isEditing) {
      setValue('slug', slugify(nomeValue), { shouldValidate: false })
    }
  }, [nomeValue, isEditing, setValue])

  const handleSuggestSeo = async () => {
    const { nome, categoria, descricao, faixaEtaria, tags } = getValues()
    if (!nome || !categoria) {
      toast.error('Preencha nome e categoria antes de gerar sugestão de SEO')
      return
    }
    setIsSuggestingAi(true)
    try {
      const res = await fetch('/api/admin/brinquedos/seo-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, categoria, descricao, faixaEtaria, tags }),
      })
      if (!res.ok) throw new Error('Erro ao gerar sugestão')
      const data = await res.json()
      setValue('seoTitle', data.title ?? '')
      setValue('seoDescription', data.description ?? '')
      setValue('seoKeywords', data.keywords ?? '')
      toast.success('Sugestão de SEO gerada!')
    } catch {
      toast.error('Não foi possível gerar sugestão de SEO')
    } finally {
      setIsSuggestingAi(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    const url = isEditing
      ? `/api/admin/brinquedos/${brinquedo.id}`
      : '/api/admin/brinquedos'
    const method = isEditing ? 'PATCH' : 'POST'

    const payload = {
      ...data,
      slug: slugify(data.slug || data.nome),
      precoReferencia: data.precoReferencia?.trim() || null,
      energia: data.energia?.trim() || null,
      descricao: data.descricao?.trim() || null,
      seoTitle: data.seoTitle?.trim() || null,
      seoDescription: data.seoDescription?.trim() || null,
      seoKeywords: data.seoKeywords?.trim() || null,
      videoUrl: data.videoUrl?.trim() || null,
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = body?.message ?? 'Erro ao salvar'

        // Slug duplicado: tenta com sufixo numérico
        if (res.status === 409 && msg.includes('nome')) {
          const suffix = `-${Date.now().toString().slice(-4)}`
          const retryPayload = { ...payload, slug: `${payload.slug}${suffix}` }
          const retry = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retryPayload),
          })
          if (retry.ok) {
            toast.success(isEditing ? 'Brinquedo atualizado!' : 'Brinquedo criado!')
            onSuccess?.()
            return
          }
          const retryBody = await retry.json().catch(() => ({}))
          throw new Error(retryBody?.message ?? msg)
        }

        throw new Error(msg)
      }

      toast.success(isEditing ? 'Brinquedo atualizado!' : 'Brinquedo criado!')
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar brinquedo')
    }
  }

  const seoTitle = watch('seoTitle')
  const seoDescription = watch('seoDescription')
  const seoKeywords = watch('seoKeywords')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

      {/* Seção: Identificação */}
      <Section title="Identificação">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome *" error={errors.nome?.message}>
            <input {...register('nome')} placeholder="Pula-Pula Profissional" className={field} />
          </Field>
          <Field label="Slug (URL)" error={errors.slug?.message} hint="Gerado automaticamente">
            <input {...register('slug')} placeholder="pula-pula-profissional" className={`${field} opacity-70`} />
          </Field>
        </div>
      </Section>

      {/* Seção: Características */}
      <Section title="Características">
        {/* Categoria + Tags */}
        <Field label="Categoria *" error={errors.categoria?.message}>
          <Controller
            name="categoria"
            control={control}
            render={({ field: { value } }) => (
              <Controller
                name="tags"
                control={control}
                render={({ field: { value: tagsValue } }) => (
                  <CategoryTagsInput
                    categoria={value}
                    tags={tagsValue}
                    onChange={(cat, tgs) => {
                      setValue('categoria', cat, { shouldValidate: true })
                      setValue('tags', tgs)
                    }}
                    error={errors.categoria?.message}
                  />
                )}
              />
            )}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Faixa Etária *" error={errors.faixaEtaria?.message}>
            <input {...register('faixaEtaria')} placeholder="3 a 12 anos" className={field} />
          </Field>
          <Field label="Capacidade *" error={errors.capacidade?.message}>
            <input {...register('capacidade')} placeholder="Até 10 crianças" className={field} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Dimensões *" error={errors.dimensoes?.message}>
            <input {...register('dimensoes')} placeholder="4m x 4m x 3m" className={field} />
          </Field>
          <Field label="Energia">
            <input {...register('energia')} placeholder="Tomada 110V / não necessária" className={field} />
          </Field>
        </div>

        <Field label="Preço de Referência (R$)">
          <input
            {...register('precoReferencia')}
            placeholder="350,00"
            type="number"
            step="0.01"
            className={field}
          />
        </Field>
      </Section>

      {/* Seção: Descrição */}
      <Section title="Descrição">
        <Field label="Texto descritivo">
          <textarea
            {...register('descricao')}
            rows={4}
            placeholder="Descreva o brinquedo, suas características e diferenciais..."
            className={`${field} resize-none`}
          />
        </Field>
      </Section>

      {/* Seção: Vídeo */}
      <Section title="Vídeo">
        <Field
          label="URL do vídeo"
          hint="YouTube, Vimeo ou link direto"
          error={errors.videoUrl?.message}
        >
          <div className="relative">
            <Video className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-brand-muted pointer-events-none" />
            <input
              {...register('videoUrl')}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`${field} pl-9`}
            />
          </div>
        </Field>
        {watch('videoUrl') && (
          <VideoPreview url={watch('videoUrl') ?? ''} />
        )}
      </Section>

      {/* Seção: SEO */}
      <Section title="SEO & GEO">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-brand-muted">
            Otimize como este brinquedo aparece no Google e no AI Search.
          </p>
          <button
            type="button"
            onClick={handleSuggestSeo}
            disabled={isSuggestingAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-accent/50 bg-brand-accent/10 text-brand-accent text-xs font-semibold hover:bg-brand-accent/20 disabled:opacity-50 transition-colors"
          >
            {isSuggestingAi ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {isSuggestingAi ? 'Gerando...' : 'Sugerir com IA'}
          </button>
        </div>

        <Field
          label="Meta Title"
          hint={`${(seoTitle ?? '').length}/60 chars`}
          error={undefined}
        >
          <input
            {...register('seoTitle')}
            maxLength={70}
            placeholder="Pula-Pula para Alugar – São José dos Campos | Twix Eventos"
            className={field}
          />
        </Field>

        <Field
          label="Meta Description"
          hint={`${(seoDescription ?? '').length}/155 chars`}
          error={undefined}
        >
          <textarea
            {...register('seoDescription')}
            rows={2}
            maxLength={200}
            placeholder="Alugue nosso Pula-Pula para festas em São José dos Campos. Entrega e montagem incluídos. Solicite seu orçamento!"
            className={`${field} resize-none`}
          />
        </Field>

        <Field label="Keywords" hint="Separadas por vírgula">
          <input
            {...register('seoKeywords')}
            placeholder="pula-pula, aluguel pula-pula, pula-pula são josé dos campos, brinquedo para festa"
            className={field}
          />
        </Field>

        {/* Live preview */}
        {(seoTitle || seoDescription) && (
          <div className="rounded-xl border border-brand-border bg-brand-surface-2 p-3 flex flex-col gap-0.5">
            <p className="text-[11px] text-green-500 font-medium">twixeventos.com.br/brinquedos/{watch('slug') || '...'}</p>
            <p className="text-sm font-medium text-blue-400 line-clamp-1">{seoTitle || 'Sem título'}</p>
            <p className="text-xs text-brand-muted line-clamp-2">{seoDescription || 'Sem descrição'}</p>
          </div>
        )}
      </Section>

      {/* Seção: Visibilidade */}
      <Section title="Visibilidade">
        <div className="flex flex-col gap-4">
          <Field label="Status">
            <Controller
              name="status"
              control={control}
              render={({ field: { value, onChange } }) => (
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      { value: 'publicado',  label: 'Publicado',  color: 'bg-green-500' },
                      { value: 'rascunho',   label: 'Rascunho',   color: 'bg-gray-400' },
                      { value: 'invisivel',  label: 'Invisivel',  color: 'bg-amber-500' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChange(opt.value)}
                      className={[
                        'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all',
                        value === opt.value
                          ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                          : 'border-brand-border bg-brand-surface-2 text-brand-muted hover:border-brand-accent/50',
                      ].join(' ')}
                    >
                      <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </Field>

          <label className="flex items-center gap-2.5 cursor-pointer w-fit">
            <div className="relative">
              <input {...register('destaque')} type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 rounded-full border border-brand-border bg-brand-surface-2 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-brand-muted peer-checked:bg-white peer-checked:translate-x-4 transition-all" />
            </div>
            <span className="text-sm text-brand-text font-medium">Em destaque</span>
          </label>
        </div>
      </Section>

      {/* Seção: Fotos */}
      <Section title="Fotos do produto">
        <Controller
          name="fotos"
          control={control}
          render={({ field: { value } }) => (
            <ImageUpload
              fotos={value}
              fotoDestaque={watch('fotoDestaque')}
              onChange={(newFotos, newDestaque) => {
                setValue('fotos', newFotos)
                setValue('fotoDestaque', newDestaque)
              }}
            />
          )}
        />
      </Section>

      {/* Submit */}
      <div className="flex gap-3 pt-1 border-t border-brand-border">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 text-white font-semibold py-2.5 rounded-xl"
          style={{ backgroundColor: 'var(--brand-accent)' }}
        >
          {isSubmitting
            ? 'Salvando...'
            : isEditing
              ? 'Salvar alterações'
              : 'Criar brinquedo'}
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Helpers de vídeo
// ---------------------------------------------------------------------------
function toEmbedUrl(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    // YouTube
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id = extractYouTubeId(url)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    // Vimeo
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    // URL direta (mp4, etc.) — devolve como está
    return url
  } catch {
    const id = extractYouTubeId(url)
    if (id) return `https://www.youtube.com/embed/${id}`
    return null
  }
}

function VideoPreview({ url }: { url: string }) {
  const embed = toEmbedUrl(url)
  if (!embed) return null
  const isIframe = embed.includes('youtube.com/embed') || embed.includes('vimeo.com')
  return (
    <div className="rounded-xl overflow-hidden border border-brand-border aspect-video w-full">
      {isIframe ? (
        <iframe
          src={embed}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video src={embed} controls className="w-full h-full object-cover" />
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wider border-b border-brand-border pb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-brand-muted">{label}</label>
        {hint && !error && <span className="text-[11px] text-brand-muted/60">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
