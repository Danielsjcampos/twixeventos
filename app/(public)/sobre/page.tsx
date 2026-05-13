import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { whatsappLink, WHATSAPP_NUMBER } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre Nós — Twix Eventos',
  description: 'Conheça a Twix Eventos: empresa fundada em 2015, especializada em locação de brinquedos infláveis em São José dos Campos com +455 avaliações 5 estrelas.',
}

const diferenciais = [
  { icon: '⭐', titulo: '+455 Avaliações 5 Estrelas', desc: 'Somos a empresa mais bem avaliada do Vale do Paraíba no Google.' },
  { icon: '🎯', titulo: 'Desde 2015', desc: 'Mais de 10 anos de experiência em eventos corporativos, aniversários e festas escolares.' },
  { icon: '🔧', titulo: 'Montagem Profissional', desc: 'Chegamos 1 a 2 horas antes do evento para montar, testar e garantir tudo perfeito.' },
  { icon: '🛡️', titulo: 'Revisados e Higienizados', desc: 'Todos os brinquedos passam por revisão e higienização completa antes de cada locação.' },
  { icon: '👷', titulo: 'Monitor de Segurança', desc: 'A locação inclui profissional treinado para supervisionar durante todo o evento.' },
  { icon: '📱', titulo: 'Atendimento 24h', desc: 'WhatsApp, telefone ou email — estamos sempre disponíveis para você.' },
]

export default function SobrePage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-brand-bg">
        {/* Hero */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-[family-name:var(--font-display)] text-5xl lg:text-7xl font-bold text-brand-text uppercase">
              SOBRE A <span className="text-brand-accent">TWIX EVENTOS</span>
            </h1>
            <p className="text-brand-muted text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
              Fundada em 2015 em São José dos Campos, somos especialistas em transformar festas e eventos
              em momentos inesquecíveis com os melhores brinquedos infláveis e eletrônicos da região.
            </p>
          </div>
        </section>

        {/* Diferenciais */}
        <section className="py-16 px-4 bg-brand-surface border-y border-brand-border">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-brand-text uppercase text-center mb-12">
              POR QUE ESCOLHER A TWIX?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {diferenciais.map(d => (
                <div key={d.titulo} className="bg-brand-bg border border-brand-border rounded-xl p-6 hover:border-brand-accent transition-colors">
                  <div className="text-4xl mb-4">{d.icon}</div>
                  <h3 className="text-brand-text font-bold mb-2">{d.titulo}</h3>
                  <p className="text-brand-muted text-sm leading-relaxed">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Endereço e contato */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-brand-text uppercase mb-4">
                LOCALIZAÇÃO
              </h2>
              <p className="text-brand-muted">
                R. Prof. Roberval Fróes, 390 – 143C<br />
                Jardim Esplanada<br />
                São José dos Campos – SP<br />
                CEP 12242-460
              </p>
              <p className="text-brand-muted mt-4">Atendemos: SJC e Vale do Paraíba</p>
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-brand-text uppercase mb-4">
                CONTATO
              </h2>
              <div className="space-y-2 text-brand-muted">
                <p>📱 (12) 99649-8725</p>
                <p>📧 contato@twixeventos.com</p>
                <p>🕐 Atendimento 24h</p>
              </div>
              <a
                href={whatsappLink(WHATSAPP_NUMBER, 'Olá! Gostaria de saber mais sobre a Twix Eventos.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
