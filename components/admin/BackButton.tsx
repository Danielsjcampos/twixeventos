'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton({ href }: { href?: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => href ? router.push(href) : router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
    >
      <ArrowLeft className="size-4" />
      Voltar
    </button>
  )
}
