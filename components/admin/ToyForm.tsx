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
  ativo: z.boolean(),
  destaque: z.boolean(),
  fotos: z.array(z.string()),
  fotoDestaque: z.string().nullable(),
})

type FormData = z.infer<typeof schema>

const CATEGORIAS_FORM = CATEGORIAS.filter((c) => c.value !== 'todos')

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
      ativo: brinquedo?.ativo ?? true,
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

    // Limpa campos opcionais para evitar erro no banco
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
        throw new Error(body?.message ?? 'Erro ao salvar')
      }

      toast.success(isEditing ? 'Brinquedo atualizado!' : 'Brinquedo criado!')
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar brinquedo')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Nome + Slug */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Nome *</label>
          <input
            {...register('nome')}
            placeholder="Pula-Pula Profissional"
            className="rounded-lg border px-3 py-2 text-sm text-white bg-zinc-900 border-zinc-700 focus:outline-none focus:border-orange-500"
          />
          {errors.nome && <p className="text-xs text-red-400">{errors.nome.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Slug *</label>
          <input
            {...register('slug')}
            placeholder="pula-pula-profissional"
            className="rounded-lg border px-3 py-2 text-sm text-zinc-400 bg-zinc-900/50 border-zinc-700 focus:outline-none focus:border-orange-500"
          />
          {errors.slug && <p className="text-xs text-red-400">{errors.slug.message}</p>}
        </div>
      </div>

      {/* Categoria + Faixa Etária */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Categoria *</label>
          <select
            {...register('categoria')}
            className="rounded-lg border px-3 py-2 text-sm text-white bg-zinc-900 border-zinc-700 focus:outline-none focus:border-orange-500"
          >
            <option value="">Selecione...</option>
            {CATEGORIAS_FORM.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.categoria && <p className="text-xs text-red-400">{errors.categoria.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Faixa Etária *</label>
          <input
            {...register('faixaEtaria')}
            placeholder="3 a 12 anos"
            className="rounded-lg border px-3 py-2 text-sm text-white bg-zinc-900 border-zinc-700 focus:outline-none focus:border-orange-500"
          />
          {errors.faixaEtaria && <p className="text-xs text-red-400">{errors.faixaEtaria.message}</p>}
        </div>
      </div>

      {/* Capacidade + Dimensões */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Capacidade *</label>
          <input
            {...register('capacidade')}
            placeholder="Até 10 crianças"
            className="rounded-lg border px-3 py-2 text-sm text-white bg-zinc-900 border-zinc-700 focus:outline-none focus:border-orange-500"
          />
          {errors.capacidade && <p className="text-xs text-red-400">{errors.capacidade.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Dimensões *</label>
          <input
            {...register('dimensoes')}
            placeholder="4m x 4m x 3m"
            className="rounded-lg border px-3 py-2 text-sm text-white bg-zinc-900 border-zinc-700 focus:outline-none focus:border-orange-500"
          />
          {errors.dimensoes && <p className="text-xs text-red-400">{errors.dimensoes.message}</p>}
        </div>
      </div>

      {/* Energia + Preço */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Energia</label>
          <input
            {...register('energia')}
            placeholder="Tomada 110V / não necessária"
            className="rounded-lg border px-3 py-2 text-sm text-white bg-zinc-900 border-zinc-700 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Preço de Referência</label>
          <input
            {...register('precoReferencia')}
            placeholder="350.00"
            type="number"
            step="0.01"
            className="rounded-lg border px-3 py-2 text-sm text-white bg-zinc-900 border-zinc-700 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Descrição */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300">Descrição</label>
        <textarea
          {...register('descricao')}
          rows={4}
          placeholder="Descreva o brinquedo, suas características e diferenciais..."
          className="rounded-lg border px-3 py-2 text-sm text-white bg-zinc-900 border-zinc-700 focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Checkboxes */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            {...register('ativo')}
            type="checkbox"
            className="w-4 h-4 rounded accent-orange-500"
          />
          <span className="text-sm text-zinc-300">Ativo (visível no site)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            {...register('destaque')}
            type="checkbox"
            className="w-4 h-4 rounded accent-orange-500"
          />
          <span className="text-sm text-zinc-300">Em destaque</span>
        </label>
      </div>

      {/* Image Upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300">Fotos</label>
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
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 text-white font-semibold"
          style={{ backgroundColor: '#F97316' }}
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
