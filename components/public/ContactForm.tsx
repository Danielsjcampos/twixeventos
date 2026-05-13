'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { cn, whatsappLink, WHATSAPP_NUMBER } from '@/lib/utils'

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido').max(15, 'Telefone inválido'),
  dataEvento: z.string().min(1, 'Informe a data do evento'),
  mensagem: z.string().min(10, 'Mensagem muito curta').max(1000, 'Mensagem muito longa'),
})

type FormData = z.infer<typeof schema>

function InputField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-brand-muted text-sm font-medium">{label}</label>
      {children}
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  )
}

const inputClass =
  'bg-brand-surface-2 border border-brand-border focus:border-brand-accent text-brand-text placeholder-brand-muted/60 rounded-lg px-4 py-3 text-sm outline-none transition-colors w-full'

export function ContactForm() {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          dataEvento: data.dataEvento,
          mensagem: data.mensagem,
          origem: 'site',
        }),
      })

      if (!res.ok) throw new Error('Erro ao enviar')

      toast.success('Mensagem enviada! Redirecionando para o WhatsApp...')
      reset()

      const message = `Olá! Acabei de preencher o formulário no site.
*Nome:* ${data.nome}
*E-mail:* ${data.email}
*Telefone:* ${data.telefone}
*Data do evento:* ${data.dataEvento}
*Mensagem:* ${data.mensagem}`

      setTimeout(() => {
        window.open(whatsappLink(WHATSAPP_NUMBER, message), '_blank')
      }, 1000)
    } catch {
      toast.error('Erro ao enviar. Tente novamente ou contate via WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField label="Nome completo" error={errors.nome?.message}>
          <input
            {...register('nome')}
            type="text"
            placeholder="Seu nome"
            className={cn(inputClass, errors.nome && 'border-red-500')}
          />
        </InputField>

        <InputField label="E-mail" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            placeholder="seu@email.com"
            className={cn(inputClass, errors.email && 'border-red-500')}
          />
        </InputField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField label="Telefone / WhatsApp" error={errors.telefone?.message}>
          <input
            {...register('telefone')}
            type="tel"
            placeholder="(12) 99999-9999"
            className={cn(inputClass, errors.telefone && 'border-red-500')}
          />
        </InputField>

        <InputField label="Data do evento" error={errors.dataEvento?.message}>
          <input
            {...register('dataEvento')}
            type="date"
            className={cn(inputClass, errors.dataEvento && 'border-red-500')}
          />
        </InputField>
      </div>

      <InputField label="Mensagem" error={errors.mensagem?.message}>
        <textarea
          {...register('mensagem')}
          rows={4}
          placeholder="Conte-nos sobre seu evento: local, número de crianças, horário..."
          className={cn(inputClass, 'resize-none', errors.mensagem && 'border-red-500')}
        />
      </InputField>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base px-6 py-3 rounded-lg transition-colors"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? 'Enviando...' : 'Enviar Mensagem'}
      </button>
    </form>
  )
}
