import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

export function formatCurrency(value: string | number | null | undefined) {
  if (!value) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5512996498725'

export const CATEGORIAS = [
  { value: 'todos',     label: 'Todos' },
  { value: 'inflaveis', label: 'Infláveis' },
  { value: 'toboshark', label: 'Toboshark' },
  { value: 'radicais',  label: 'Radicais' },
  { value: 'batalhas',  label: 'Batalhas' },
  { value: 'tematicos', label: 'Temáticos' },
  { value: 'aquaticos', label: 'Aquáticos' },
]

export const STATUS_KANBAN = [
  { id: 'novo',               label: 'Novo',               cor: '#3B82F6' },
  { id: 'contato',            label: 'Em Contato',         cor: '#F59E0B' },
  { id: 'proposta',           label: 'Proposta Enviada',   cor: '#F97316' },
  { id: 'aguardando_entrada', label: 'Aguardando Entrada', cor: '#8B5CF6' },
  { id: 'confirmado',         label: 'Confirmado',         cor: '#10B981' },
  { id: 'realizado',          label: 'Realizado',          cor: '#059669' },
  { id: 'perdido',            label: 'Perdido',            cor: '#6B7280' },
]
