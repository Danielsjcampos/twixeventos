'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, Send, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import { useCart } from '@/lib/store/cart'
import { cn } from '@/lib/utils'

const REGIOES = [
  'São José dos Campos - Centro',
  'São José dos Campos - Zona Norte',
  'São José dos Campos - Zona Sul',
  'São José dos Campos - Zona Leste',
  'São José dos Campos - Zona Oeste',
  'Jacareí',
  'Caçapava',
  'Taubaté',
  'Tremembé',
  'Pindamonhangaba',
  'Guaratinguetá',
  'Lorena',
  'Outra cidade',
]

export function ReservationDrawer() {
  const { items, isOpen, close, remove, clear, has } = useCart()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<'cart' | 'form' | 'success'>('cart')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    dataEvento: '',
    regiaoEvento: '',
    mensagem: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    useCart.persist.rehydrate()
    setMounted(true) // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  // Reset to cart step when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        if (step === 'success') {
          setStep('cart')
          setForm({ nome: '', telefone: '', dataEvento: '', regiaoEvento: '', mensagem: '' })
        }
      }, 300)
    }
  }, [isOpen, step])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!mounted) return null

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nome.trim() || form.nome.length < 2) e.nome = 'Nome obrigatório'
    if (!form.telefone.trim() || form.telefone.replace(/\D/g, '').length < 10) e.telefone = 'Telefone inválido'
    return e
  }

  const handlePhoneChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 10) {
      formatted = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
    } else if (digits.length > 6) {
      formatted = `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
    } else if (digits.length > 2) {
      formatted = `(${digits.slice(0,2)}) ${digits.slice(2)}`
    }
    setForm(f => ({ ...f, telefone: formatted }))
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          telefone: form.telefone,
          dataEvento: form.dataEvento || undefined,
          regiaoEvento: form.regiaoEvento || undefined,
          mensagem: form.mensagem || undefined,
          brinquedosInteresse: items.map(i => i.nome),
          origem: 'carrinho',
        }),
      })
      setStep('success')
      clear()
    } catch {
      // silently fail — show success anyway to not lose lead
      setStep('success')
      clear()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={close}
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Drawer — mobile: bottom sheet / desktop: floating right panel */}
      <div
        className={cn(
          'fixed z-50 bg-brand-surface flex flex-col transition-transform duration-300 ease-out',
          // Mobile layout (bottom sheet)
          'bottom-0 left-0 right-0 max-h-[90dvh] border-t border-brand-border rounded-t-2xl',
          // Desktop layout (floating right panel)
          'md:bottom-4 md:top-4 md:right-4 md:left-auto md:w-[420px] md:max-h-full md:border md:rounded-2xl md:shadow-2xl',
          // Open/closed animation
          isOpen
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-[calc(100%+1.5rem)]'
        )}
      >
        {/* Handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-brand-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
          <h2 className="font-bold text-brand-text text-lg">
            {step === 'cart' && `Orçamento (${items.length})`}
            {step === 'form' && 'Seus dados'}
            {step === 'success' && 'Pedido enviado!'}
          </h2>
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-brand-surface-2 text-brand-muted hover:text-brand-text transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Step: Cart */}
          {step === 'cart' && (
            <div className="p-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-brand-muted">
                  <ShoppingCartEmpty />
                  <p className="mt-3 text-sm">Nenhum brinquedo no orçamento</p>
                  <button onClick={close} className="mt-4 text-brand-accent text-sm underline">
                    Ver catálogo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-brand-surface-2 rounded-xl p-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-brand-bg shrink-0">
                        {item.fotoDestaque ? (
                          <Image src={item.fotoDestaque} alt={item.nome} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-muted text-xs">TX</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-brand-text font-semibold text-sm truncate">{item.nome}</p>
                        <p className="text-brand-muted text-xs capitalize">{item.categoria}</p>
                      </div>
                      <button
                        onClick={() => remove(item.id)}
                        className="p-1.5 text-brand-muted hover:text-red-500 transition-colors"
                        aria-label="Remover"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Form */}
          {step === 'form' && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-brand-text text-sm font-medium mb-1.5">
                  Nome completo <span className="text-brand-accent">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Seu nome"
                  className={cn(
                    'w-full bg-brand-surface-2 border rounded-xl px-4 py-3 text-brand-text placeholder:text-brand-muted text-sm focus:outline-none focus:border-brand-accent transition-colors',
                    errors.nome ? 'border-red-500' : 'border-brand-border'
                  )}
                />
                {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome}</p>}
              </div>

              <div>
                <label className="block text-brand-text text-sm font-medium mb-1.5">
                  WhatsApp / Telefone <span className="text-brand-accent">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.telefone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="(12) 99999-0000"
                  className={cn(
                    'w-full bg-brand-surface-2 border rounded-xl px-4 py-3 text-brand-text placeholder:text-brand-muted text-sm focus:outline-none focus:border-brand-accent transition-colors',
                    errors.telefone ? 'border-red-500' : 'border-brand-border'
                  )}
                />
                {errors.telefone && <p className="text-red-400 text-xs mt-1">{errors.telefone}</p>}
              </div>

              <div>
                <label className="block text-brand-text text-sm font-medium mb-1.5">Data do evento</label>
                <input
                  type="date"
                  value={form.dataEvento}
                  onChange={e => setForm(f => ({ ...f, dataEvento: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-4 py-3 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-brand-text text-sm font-medium mb-1.5">Região do evento</label>
                <select
                  value={form.regiaoEvento}
                  onChange={e => setForm(f => ({ ...f, regiaoEvento: e.target.value }))}
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-4 py-3 text-brand-text text-sm focus:outline-none focus:border-brand-accent transition-colors"
                >
                  <option value="">Selecione a região</option>
                  {REGIOES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-brand-text text-sm font-medium mb-1.5">Observações (opcional)</label>
                <textarea
                  value={form.mensagem}
                  onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
                  placeholder="Alguma dúvida ou informação extra?"
                  rows={3}
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder:text-brand-muted text-sm focus:outline-none focus:border-brand-accent transition-colors resize-none"
                />
              </div>

              {/* Brinquedos resumo */}
              <div className="bg-brand-surface-2 rounded-xl p-3">
                <p className="text-brand-muted text-xs font-medium mb-2">Brinquedos no orçamento:</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map(i => (
                    <span key={i.id} className="bg-brand-accent/20 text-brand-accent text-xs px-2.5 py-1 rounded-full border border-brand-accent/30">
                      {i.nome}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="size-10 text-green-500" />
              </div>
              <h3 className="text-brand-text font-bold text-xl mb-2">Recebemos seu pedido!</h3>
              <p className="text-brand-muted text-sm leading-relaxed">
                Nossa equipe vai entrar em contato pelo WhatsApp em breve para confirmar os detalhes do seu evento.
              </p>
              <div className="mt-6 bg-brand-surface-2 rounded-xl p-4 text-left space-y-2">
                <p className="text-brand-muted text-xs font-medium uppercase tracking-wide">Próximos passos</p>
                <p className="text-brand-text text-sm">✅ Aguarde nosso contato</p>
                <p className="text-brand-text text-sm">📅 Confirme data e endereço</p>
                <p className="text-brand-text text-sm">💰 Entrada de apenas 10% para reservar</p>
              </div>
              <button
                onClick={close}
                className="mt-6 w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step === 'cart' && items.length > 0 && (
          <div className="p-4 border-t border-brand-border space-y-2 safe-bottom">
            <button
              onClick={() => setStep('form')}
              className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Send className="size-5" />
              Solicitar orçamento
            </button>
            <button onClick={clear} className="w-full text-brand-muted text-sm py-2 hover:text-red-400 transition-colors">
              Limpar lista
            </button>
          </div>
        )}

        {step === 'form' && (
          <div className="p-4 border-t border-brand-border space-y-2 safe-bottom">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin size-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className="size-5" />
                  Enviar pedido
                </>
              )}
            </button>
            <button onClick={() => setStep('cart')} className="w-full text-brand-muted text-sm py-2 hover:text-brand-text transition-colors">
              ← Voltar ao orçamento
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function ShoppingCartEmpty() {
  return (
    <svg className="w-16 h-16 mx-auto text-brand-border" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 8h4l6 32h28l4-20H20" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="50" r="3" />
      <circle cx="44" cy="50" r="3" />
    </svg>
  )
}
