import FlowArt, { FlowSection } from '@/components/ui/story-scroll'

const steps = [
  {
    num: '01',
    label: 'Explore',
    title: 'ESCOLHA\nSEU\nBRINQUEDO',
    body: 'Navegue pelo nosso catálogo com mais de 24 brinquedos infláveis e eletrônicos. Filtre por categoria, capacidade e faixa etária para encontrar o perfeito para o seu evento.',
    bg: '#FFFFFF',
    color: '#0F172A',
    divider: 'rgba(15,23,42,0.15)',
  },
  {
    num: '02',
    label: 'Reserve',
    title: 'FAÇA SUA\nRESERVA',
    body: 'Entre em contato via WhatsApp ou formulário. Confirmamos disponibilidade na hora e você garante sua reserva com apenas 10% de entrada. Rápido, sem burocracia.',
    extra: [
      { titulo: 'Resposta rápida', texto: 'Atendemos de segunda a domingo, das 8h às 22h. Retorno em até 1 hora.' },
      { titulo: 'Reserva segura', texto: '10% de entrada garante sua data. Saldo pago no dia do evento.' },
      { titulo: 'Orçamento grátis', texto: 'Sem surpresas. Preço fechado antes de confirmar, tudo incluso.' },
    ],
    bg: '#0F172A',
    color: '#FFFFFF',
    divider: 'rgba(255,255,255,0.15)',
  },
  {
    num: '03',
    label: 'Agenda',
    title: 'CONFIRMAMOS\nOS\nDETALHES',
    body: 'Nossa equipe entra em contato para confirmar endereço, horário de montagem e todas as necessidades do seu evento. Chegamos 2 horas antes para garantir tudo certo.',
    extra: [
      { titulo: 'Montagem inclusa', texto: 'Cuidamos de tudo — transporte, montagem e desmontagem.' },
      { titulo: 'Equipe treinada', texto: 'Monitores qualificados acompanham o evento para máxima segurança.' },
    ],
    bg: '#2563EB',
    color: '#FFFFFF',
    divider: 'rgba(255,255,255,0.2)',
  },
  {
    num: '04',
    label: 'Celebre',
    title: 'DIVERSÃO\nGARANTIDA',
    body: 'Relaxe e curta o evento. Nossos monitores cuidam da operação dos brinquedos do início ao fim. Depois, desmontamos tudo sem deixar rastro. Simples assim.',
    bg: '#F5F0E8',
    color: '#0F172A',
    divider: 'rgba(15,23,42,0.15)',
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona">
      <FlowArt aria-label="Como funciona a locação na Twix Eventos">
        {steps.map((step, i) => (
          <FlowSection
            key={step.num}
            aria-label={`Passo ${step.num}: ${step.label}`}
            style={{ backgroundColor: step.bg, color: step.color }}
          >
            {/* Número + label */}
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ opacity: 0.6 }}
            >
              {step.num} — {step.label}
            </p>

            {/* Divisor */}
            <hr
              className="border-none border-t"
              style={{ borderTopColor: step.divider, marginTop: '2vw', marginBottom: '2vw' }}
            />

            {/* Heading grande */}
            <div>
              <h2
                className="font-[family-name:var(--font-display)] font-black leading-[0.85] uppercase tracking-tight"
                style={{ fontSize: 'clamp(3.5rem, 12vw, 11rem)' }}
              >
                {step.title.split('\n').map((line, j) => (
                  <span key={j} className="block">{line}</span>
                ))}
              </h2>
            </div>

            {/* Divisor */}
            <hr
              className="border-none border-t"
              style={{ borderTopColor: step.divider, marginTop: '2vw', marginBottom: '2vw' }}
            />

            {/* Descrição */}
            <p
              className="max-w-[50ch] font-normal leading-relaxed"
              style={{ fontSize: 'clamp(1rem, 2.5vw, 1.75rem)' }}
            >
              {step.body}
            </p>

            {/* Cards extras (passo 2 e 3) */}
            {step.extra && (
              <>
                <hr
                  className="border-none border-t"
                  style={{ borderTopColor: step.divider, marginTop: '2vw', marginBottom: '2vw' }}
                />
                <div className="flex flex-wrap gap-[3vw]">
                  {step.extra.map((item) => (
                    <div key={item.titulo} className="min-w-[180px] flex-1">
                      <p
                        className="mb-2 text-sm font-bold uppercase tracking-wider"
                      >
                        {item.titulo}
                      </p>
                      <p
                        className="leading-relaxed"
                        style={{ fontSize: 'clamp(0.85rem, 1.3vw, 1.05rem)', opacity: 0.7 }}
                      >
                        {item.texto}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </FlowSection>
        ))}
      </FlowArt>
    </section>
  )
}
