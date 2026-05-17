'use client'

import { useState, useRef, useEffect } from 'react'
import { whatsappLink, WHATSAPP_NUMBER } from '@/lib/utils'
import { X, ArrowRight, Loader2 } from 'lucide-react'

const DEFAULT_MSG = 'Olá! Estou no site da Twix Eventos e gostaria de mais informações 🎪'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? 'size-7 fill-white'}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function WhatsAppButton() {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const nomeRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Foco no nome quando abre
  useEffect(() => {
    if (open) setTimeout(() => nomeRef.current?.focus(), 120)
  }, [open])

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const formatTel = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nomeClean = nome.trim()
    const telClean = telefone.replace(/\D/g, '')
    if (nomeClean.length < 2) { setErro('Informe seu nome'); return }
    if (telClean.length < 10) { setErro('Telefone inválido'); return }
    setErro('')
    setLoading(true)

    // Salva lead no CRM (não bloqueia a abertura do WhatsApp em caso de falha)
    fetch('/api/admin/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: nomeClean,
        telefone: telClean,
        origem: 'site',
        status: 'novo',
        mensagem: 'Contato via botão WhatsApp do site',
      }),
    }).catch(() => { /* silently */ })

    // Redireciona para o WhatsApp com nome personalizado
    const msg = `Olá! Sou ${nomeClean} e gostaria de mais informações sobre locação de brinquedos 🎪`
    window.open(whatsappLink(WHATSAPP_NUMBER, msg), '_blank', 'noopener,noreferrer')

    // Reset
    setLoading(false)
    setOpen(false)
    setNome('')
    setTelefone('')
  }

  return (
    <>
      <style>{`
        @keyframes whatsapp-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(37,211,102,.55); }
          70%  { box-shadow: 0 0 0 14px rgba(37,211,102,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
        }
        .whatsapp-pulse { animation: whatsapp-pulse 2s ease-out infinite; }
        @keyframes wa-panel-in {
          from { opacity:0; transform: scale(.92) translateY(12px); }
          to   { opacity:1; transform: scale(1)  translateY(0); }
        }
        .wa-panel-in { animation: wa-panel-in .2s cubic-bezier(.34,1.56,.64,1) forwards; }
      `}</style>

      {/* Panel de captura */}
      {open && (
        <div
          ref={panelRef}
          className="wa-panel-in fixed bottom-24 right-4 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(37,211,102,.25)',
          }}
        >
          {/* Header verde */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#25D366' }}>
            <WhatsAppIcon className="size-5 fill-white flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold leading-none">Twix Eventos</p>
              <p className="text-white/80 text-[11px] mt-0.5">Resposta rápida no WhatsApp</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* Balão de mensagem simulada */}
          <div className="px-4 py-3">
            <div className="inline-block bg-white/10 rounded-xl rounded-tl-sm px-3 py-2 max-w-[90%]">
              <p className="text-white/90 text-xs leading-relaxed">
                Olá! 👋 Para te atender melhor, nos diga seu nome e telefone antes de continuar.
              </p>
              <p className="text-white/40 text-[10px] mt-1 text-right">agora</p>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="px-4 pb-4 flex flex-col gap-2.5">
            <input
              ref={nomeRef}
              type="text"
              value={nome}
              onChange={e => { setNome(e.target.value); setErro('') }}
              placeholder="Seu nome"
              autoComplete="name"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-[#25D366] focus:bg-white/15 transition-all"
            />
            <input
              type="tel"
              value={telefone}
              onChange={e => { setTelefone(formatTel(e.target.value)); setErro('') }}
              placeholder="(12) 99999-9999"
              autoComplete="tel"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-[#25D366] focus:bg-white/15 transition-all"
            />
            {erro && <p className="text-red-400 text-xs">{erro}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[.98] disabled:opacity-60"
              style={{ background: '#25D366' }}
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <>Falar no WhatsApp <ArrowRight size={15} /></>
              }
            </button>
            <p className="text-white/30 text-[10px] text-center">
              Seus dados não serão compartilhados com terceiros.
            </p>
          </form>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label="Falar no WhatsApp"
        className="whatsapp-pulse fixed bottom-6 right-6 z-50 flex items-center justify-center size-14 rounded-full bg-[#25D366] hover:bg-[#20BA5A] active:scale-95 transition-all shadow-lg"
      >
        {open
          ? <X className="size-6 text-white" />
          : <WhatsAppIcon />
        }
      </button>
    </>
  )
}
