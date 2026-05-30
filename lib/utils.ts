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
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
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

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const cleaned = url.trim()

  // 1. Check if it's already just an 11-character video ID
  if (/^[A-Za-z0-9_-]{11}$/.test(cleaned)) {
    return cleaned
  }

  // 2. Parse different YouTube URL formats
  try {
    const parsed = new URL(cleaned)
    const hostname = parsed.hostname.toLowerCase()

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      // 2a. YouTube Shorts (e.g., youtube.com/shorts/ID)
      const shortsMatch = parsed.pathname.match(/\/shorts\/([^?&/]+)/)
      if (shortsMatch) return shortsMatch[1]

      // 2b. YouTube Embed (e.g., youtube.com/embed/ID)
      const embedMatch = parsed.pathname.match(/\/embed\/([^?&/]+)/)
      if (embedMatch) return embedMatch[1]

      // 2c. Shortened youtu.be link (e.g., youtu.be/ID)
      if (hostname.includes('youtu.be')) {
        const id = parsed.pathname.slice(1).split('/')[0]
        if (id) return id
      }

      // 2d. Standard watch link (e.g., youtube.com/watch?v=ID)
      const v = parsed.searchParams.get('v')
      if (v) return v
    }
  } catch {
    // If URL parsing fails, fallback to direct regex matching
  }

  // 3. Fallback regexes for robustness
  // Shorts pattern: /shorts/ID
  const shortsRegex = /\/shorts\/([A-Za-z0-9_-]{11})/i
  const sMatch = cleaned.match(shortsRegex)
  if (sMatch) return sMatch[1]

  // youtu.be/ID pattern
  const shortRegex = /youtu\.be\/([A-Za-z0-9_-]{11})/i
  const shMatch = cleaned.match(shortRegex)
  if (shMatch) return shMatch[1]

  // watch?v=ID or /embed/ID pattern
  const longRegex = /(?:v=|\/embed\/)([A-Za-z0-9_-]{11})/i
  const lMatch = cleaned.match(longRegex)
  if (lMatch) return lMatch[1]

  return null
}

