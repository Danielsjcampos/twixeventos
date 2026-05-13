import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { ContactForm } from '@/components/public/ContactForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contato — Twix Eventos',
  description: 'Entre em contato com a Twix Eventos para reservar brinquedos infláveis em São José dos Campos. WhatsApp, email ou formulário.',
}

export default function ContatoPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-brand-bg py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold text-brand-text uppercase">
              FALE <span className="text-brand-accent">CONOSCO</span>
            </h1>
            <p className="text-brand-muted mt-3">
              Envie sua mensagem e entraremos em contato em breve pelo WhatsApp
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <ContactForm />
            </div>

            <div className="space-y-6">
              <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
                <h2 className="text-brand-text font-bold mb-3">Contato Direto</h2>
                <div className="space-y-2 text-brand-muted text-sm">
                  <p>📱 (12) 99649-8725</p>
                  <p>📧 contato@twixeventos.com</p>
                  <p>🕐 Atendimento 24h, 7 dias por semana</p>
                </div>
              </div>

              <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
                <h2 className="text-brand-text font-bold mb-3">Como Reservar</h2>
                <ol className="space-y-2 text-brand-muted text-sm">
                  <li>1. Escolha o(s) brinquedo(s) do catálogo</li>
                  <li>2. Entre em contato via WhatsApp</li>
                  <li>3. Confirme a data e endereço</li>
                  <li>4. Pague apenas 10% de entrada para garantir</li>
                  <li>5. No dia, chegamos 2h antes para montar!</li>
                </ol>
              </div>

              <div className="bg-brand-surface border border-brand-accent/30 rounded-xl p-6">
                <p className="text-brand-accent font-semibold text-sm mb-1">🎉 Descontos especiais</p>
                <p className="text-brand-muted text-sm">Eventos de segunda a quinta têm condições especiais. Pergunte-nos!</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
