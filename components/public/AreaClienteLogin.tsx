'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Ticket, ArrowRight, Sparkles, ShieldCheck, Gift, History } from 'lucide-react'
import { AuroraBackground } from '@/components/ui/AuroraBackground'

export function AreaClienteLogin() {
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleInput = (v: string) => {
    // Formatar automaticamente: TWXA3K74B2 → TWX-A3K74B2
    let raw = v.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (raw.startsWith('TWX')) raw = raw.slice(3)
    if (raw.length > 8) raw = raw.slice(0, 8)
    const formatted = raw.length > 0 ? `TWX-${raw}` : ''
    setCodigo(formatted)
    setErro('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const codigoLimpo = codigo.trim().toUpperCase()
    if (codigoLimpo.length < 8) {
      setErro('Código inválido. Formato: TWX-XXXXXXXX')
      return
    }
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/cliente/acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoLimpo }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErro(data.error ?? 'Código não encontrado.')
        return
      }
      router.push(`/minha-area/${codigoLimpo}`)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuroraBackground className="flex-1">


      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">

        {/* Logo / marca */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-brand-accent flex items-center justify-center shadow-lg shadow-brand-accent/30">
            <Ticket className="size-6 text-white" />
          </div>
          <div>
            <p className="text-brand-text font-extrabold text-xl leading-none tracking-tight">Twix Eventos</p>
            <p className="text-brand-muted text-xs mt-0.5">Área do Cliente</p>
          </div>
        </div>

        {/* Card principal */}
        <div className="w-full max-w-md">
          <div className="bg-white/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Linha luminosa no topo */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-accent/60 to-transparent" />

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <Sparkles className="size-3" />
                Acesso exclusivo
              </div>
              <h1 className="text-brand-text text-2xl font-extrabold">
                Bem-vindo de volta!
              </h1>
              <p className="text-brand-muted text-sm mt-2">
                Digite o código que enviamos para o seu WhatsApp
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-brand-text text-sm font-semibold mb-2">
                  Código de acesso
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={codigo}
                  onChange={e => handleInput(e.target.value)}
                  placeholder="TWX-A3K7..."
                  maxLength={12}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-2xl px-4 py-4 text-brand-text text-center text-2xl font-mono font-bold tracking-widest placeholder:text-brand-muted/40 placeholder:text-base placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                />
                {erro && (
                  <p className="text-red-400 text-xs mt-2 text-center">{erro}</p>
                )}
                <p className="text-brand-muted text-xs text-center mt-2">
                  Formato: <span className="font-mono text-brand-text">TWX-A3K74B2X</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || codigo.length < 8}
                className="w-full flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-brand-accent/30 hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Acessar minha área
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-brand-muted text-xs mt-6">
              Não tem seu código?{' '}
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5512996498725'}?text=${encodeURIComponent('Olá! Preciso do meu código de acesso à Área do Cliente.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent hover:underline"
              >
                Solicite via WhatsApp
              </a>
            </p>
          </div>

          {/* Benefícios abaixo do card */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { icon: History,    label: 'Histórico de festas' },
              { icon: Gift,       label: 'Cashback em cada evento' },
              { icon: ShieldCheck,label: 'Dados seguros' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 p-3 bg-brand-surface border border-brand-border rounded-2xl text-center">
                <div className="w-8 h-8 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                  <Icon className="size-4 text-brand-accent" />
                </div>
                <p className="text-brand-muted text-[10px] font-medium leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuroraBackground>
  )
}
