'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { slugify, CATEGORIAS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ImageUpload } from './ImageUpload'
import type { Brinquedo } from '@/types'

interface Props {
  brinquedo?: Brinquedo
  onSuccess?: () => void
}

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  slug: z.string().min(2, 'Slug obrigatório'),
  categoria: z.string().min(1, 'Categoria obrigatória'),
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
})

type FormData = z.infer<typeof schema>

const CATEGORIAS_FORM = CATEGORIAS.filter((c) => c.value !== 'todos')

// Shared input/select class using brand CSS variables
const field = 'w-full rounded-xl border px-3 py-2.5 text-sm text-brand-text bg-brand-surface-2 border-brand-border placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 transition-all'

export function ToyForm({ brinquedo, onSuccess }: Props) {
  const isEditing = !!brinquedo

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: brinquedo?.nome ?? '',
      slug: brinquedo?.slug ?? '',
      categoria: brinquedo?.categoria ?? '',
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
    },
  })

  // Auto-generate slug from nome
  const nomeValue = watch('nome')
  useEffect(() => {
    if (!isEditing) {
      setValue('slug', slugify(nomeValue), { shouldValidate: false })
    }
  }, [nomeValue, isEditing, setValue])

  const onSubmit = async (data: FormData) => {
    const url = isEditing
      ? `/api/admin/brinquedos/${brinquedo.id}`
      : '/api/admin/brinquedos'
    const method = isEditing ? 'PATCH' : 'POST'

    const payload = {
      ...data,
      precoReferencia: data.precoReferencia?.trim() || null,
      energia: data.energia?.trim() || null,
      descricao: data.descricao?.trim() || null,
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoria *" error={errors.categoria?.message}>
            <select {...register('categoria')} className={field}>
              <option value="">Selecione...</option>
              {CATEGORIAS_FORM.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Faixa Etária *" error={errors.faixaEtaria?.message}>
            <input {...register('faixaEtaria')} placeholder="3 a 12 anos" className={field} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Capacidade *" error={errors.capacidade?.message}>
            <input {...register('capacidade')} placeholder="Até 10 crianças" className={field} />
          </Field>
          <Field label="Dimensões *" error={errors.dimensoes?.message}>
            <input {...register('dimensoes')} placeholder="4m x 4m x 3m" className={field} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Energia">
            <input {...register('energia')} placeholder="Tomada 110V / não necessária" className={field} />
          </Field>
          <Field label="Preço de Referência (R$)">
            <input
              {...register('precoReferencia')}
              placeholder="350,00"
              type="number"
              step="0.01"
              className={field}
            />
          </Field>
        </div>
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

      {/* Seção: Visibilidade */}
      <Section title="Visibilidade">
        <div className="flex flex-col gap-4">
          {/* Status — 3 radio buttons */}
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

          {/* Destaque toggle */}
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
      <label className="text-xs font-semibold text-brand-muted">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-brand-muted/60">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
