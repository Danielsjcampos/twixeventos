import { getBrinquedosDestaque } from '@/lib/db/queries/brinquedos'
import { getConfig } from '@/lib/db/queries/configuracoes'
import { Header } from '@/components/public/Header'
import { Hero } from '@/components/public/Hero'
import { AuthorityBar } from '@/components/public/AuthorityBar'
import { FeaturedCard3D } from '@/components/public/FeaturedCard3D'
import { HowItWorks } from '@/components/public/HowItWorks'
import { FAQAccordion } from '@/components/public/FAQAccordion'
import { ContactForm } from '@/components/public/ContactForm'
import { Footer } from '@/components/public/Footer'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { VideoSection } from '@/components/public/VideoSection'
import { CinematicHero } from '@/components/ui/cinematic-hero'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Twix Eventos | Locação de Brinquedos Infláveis em São José dos Campos',
  description: 'Aluguel de brinquedos infláveis e eletrônicos para festas e eventos em São José dos Campos. +455 avaliações 5 estrelas. Tobogã, touro mecânico, canhão de espuma e muito mais!',
}

export const dynamic = 'force-dynamic'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Twix Eventos',
  description: 'Locação de brinquedos infláveis e eletrônicos para eventos em São José dos Campos',
  url: 'https://twixeventos.com',
  telephone: '+55-12-99649-8725',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'R. Prof. Roberval Fróes, 390 – 143C',
    addressLocality: 'São José dos Campos',
    addressRegion: 'SP',
    postalCode: '12242-460',
    addressCountry: 'BR',
  },
  openingHours: 'Mo-Su 08:00-22:00',
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '5.0', reviewCount: '455' },
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

export default async function HomePage() {
  const [allDestaques, videoUrl, heroSlidesRaw] = await Promise.all([
    getBrinquedosDestaque(),
    getConfig('video_apresentacao'),
    getConfig('hero_slides'),
  ])
  const destaques = pickRandom(allDestaques, 4)
  const heroSlides = (() => { try { return JSON.parse(heroSlidesRaw ?? '[]') } catch { return [] } })()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <Hero slides={heroSlides} />
        <AuthorityBar />

        {/* Brinquedos em Destaque */}
        <section id="brinquedos" className="py-20 bg-brand-bg relative overflow-hidden">
          {/* Subtle background glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-[0.06] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, #3B82F6 0%, transparent 70%)' }}
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-5">
                Seleção especial
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-bold text-brand-text uppercase">
                MAIS <span className="text-brand-accent">ALUGADOS</span>
              </h2>
              <p className="text-brand-muted mt-3 max-w-xl mx-auto">
                Os favoritos dos nossos clientes para fazer qualquer festa inesquecível
              </p>
            </div>

            {destaques.length === 0 ? (
              <div className="text-center text-brand-muted py-12">
                Nenhum brinquedo em destaque no momento.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {destaques.map((brinquedo, i) => (
                  <FeaturedCard3D key={brinquedo.id} brinquedo={brinquedo} index={i} />
                ))}
              </div>
            )}

            {/* CTA para catálogo completo */}
            <div className="mt-12 text-center">
              <Link
                href="/brinquedos"
                className="group inline-flex items-center gap-3 glass hover:border-blue-500/40 hover:bg-blue-500/5 text-brand-text hover:text-blue-400 font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-base"
              >
                Ver catálogo completo
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
              <p className="text-brand-muted text-sm mt-3">
                24+ brinquedos disponíveis no catálogo
              </p>
            </div>
          </div>
        </section>

        <VideoSection videoUrl={videoUrl} />
        <HowItWorks />
        <CinematicHero 
          brandName="Twix Eventos"
          metricValue={455}
          tagline1="Mais de 455 clientes"
          tagline2="nos deram 5 estrelas."
          cardHeading="Excelência Comprovada"
          cardDescription="A Twix Eventos é referência em diversão e segurança. Nossas avaliações no Google refletem o compromisso que temos com cada detalhe do seu evento."
          ctaHeading="Sua festa merece o melhor."
          ctaDescription="Garanta agora os melhores brinquedos com quem entende de diversão em São José dos Campos."
        />
        <FAQAccordion />

        {/* Contato */}
        <section id="contato" className="py-20 bg-brand-surface border-t border-brand-border">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-bold text-brand-text uppercase">
                FAÇA SUA <span className="text-brand-accent">RESERVA</span>
              </h2>
              <p className="text-brand-muted mt-3">
                Preencha o formulário e entraremos em contato pelo WhatsApp
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
