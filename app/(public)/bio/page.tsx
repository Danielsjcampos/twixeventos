import { getBrinquedosDestaque } from '@/lib/db/queries/brinquedos'
import Image from 'next/image'
import { whatsappLink, WHATSAPP_NUMBER } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Twix Eventos — Link na Bio',
  description: 'Brinquedos infláveis e eletrônicos para festas em São José dos Campos. Reserve via WhatsApp!',
}

export const dynamic = 'force-dynamic'

const links = [
  { label: '📦 Ver Catálogo Completo',        href: '/brinquedos' },
  { label: '💬 Reservar via WhatsApp',         href: `https://wa.me/${WHATSAPP_NUMBER}?text=Olá! Vi o perfil do Instagram e gostaria de fazer uma reserva!` },
  { label: '⭐ +455 Avaliações no Google',     href: 'https://g.co/kgs/twix-eventos', external: true },
  { label: '🎉 Descontos de Segunda a Quinta', href: '/brinquedos' },
  { label: '📍 Nossa Localização',             href: 'https://maps.google.com/?q=R.+Prof.+Roberval+Fróes,+390,+São+José+dos+Campos', external: true },
]

export default async function BioPage() {
  const destaques = await getBrinquedosDestaque()

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-brand-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="font-[family-name:var(--font-display)] text-white text-2xl font-bold">TX</span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-brand-text uppercase">
          TWIX EVENTOS
        </h1>
        <p className="text-brand-muted text-sm mt-1">Locação de Brinquedos • SJC • Desde 2015</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          {[1,2,3,4,5].map(i => (
            <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          ))}
          <span className="text-brand-muted text-xs ml-1">+455 avaliações</span>
        </div>
      </div>

      {/* Links */}
      <div className="w-full max-w-sm space-y-3 mb-10">
        {links.map(({ label, href, external }) => (
          <a
            key={label}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="flex items-center justify-center w-full bg-brand-surface border border-brand-border hover:border-brand-accent hover:bg-brand-accent/10 text-brand-text font-semibold py-4 px-6 rounded-xl transition-all text-center text-sm"
          >
            {label}
          </a>
        ))}
      </div>

      {/* Destaques */}
      {destaques.length > 0 && (
        <div className="w-full max-w-sm">
          <p className="text-brand-muted text-xs uppercase tracking-wide text-center mb-4">Mais populares</p>
          <div className="grid grid-cols-3 gap-2">
            {destaques.slice(0, 6).map(b => (
              <a key={b.id} href={`/brinquedos/${b.slug}`} className="block">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-brand-surface border border-brand-border hover:border-brand-accent transition-colors">
                  {b.fotoDestaque ? (
                    <Image src={b.fotoDestaque} alt={b.nome} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-muted text-xs p-2 text-center">
                      {b.nome}
                    </div>
                  )}
                </div>
                <p className="text-brand-muted text-[10px] text-center mt-1 truncate">{b.nome}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer bio */}
      <div className="mt-10 text-center">
        <p className="text-brand-muted text-xs">
          📱 (12) 99649-8725 · SJC e Vale do Paraíba
        </p>
        <p className="text-brand-muted/50 text-[10px] mt-1">© 2025 Twix Eventos</p>
      </div>
    </div>
  )
}
