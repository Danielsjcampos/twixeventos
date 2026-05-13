'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    question: 'Qual é a área de atendimento da Twix Eventos?',
    answer:
      'Atendemos São José dos Campos e toda a região do Vale do Paraíba. Entre em contato via WhatsApp para confirmar a disponibilidade para a sua localização.',
  },
  {
    question: 'Qual é o prazo mínimo para reservar?',
    answer:
      'Recomendamos reservar com pelo menos 7 dias de antecedência, especialmente nos finais de semana. Porém, consulte nossa disponibilidade — às vezes conseguimos atender com menos prazo.',
  },
  {
    question: 'Como funciona o pagamento e a entrada?',
    answer:
      'Confirmamos a reserva com apenas 10% de entrada via PIX ou transferência. O restante é pago no dia do evento, antes da montagem dos brinquedos.',
  },
  {
    question: 'Os brinquedos são seguros para crianças?',
    answer:
      'Sim! Todos os nossos brinquedos passam por inspeção e manutenção regulares. A equipe chega 2 horas antes para montar tudo com segurança e sempre acompanha o evento quando necessário.',
  },
  {
    question: 'O que está incluído no aluguel?',
    answer:
      'O aluguel inclui entrega, montagem, desmontagem e retirada dos brinquedos. Também fornecemos os equipamentos de proteção quando aplicável.',
  },
  {
    question: 'E se chover no dia do evento?',
    answer:
      'Em caso de chuva, trabalhamos junto com o cliente para reagendar o evento para outra data disponível sem custo adicional. A sua satisfação é nossa prioridade.',
  },
  {
    question: 'Posso alugar mais de um brinquedo ao mesmo tempo?',
    answer:
      'Claro! Você pode combinar quantos brinquedos quiser, sujeito à disponibilidade. Inclusive, alugar mais de um item pode ter condições especiais de preço.',
  },
  {
    question: 'Quanto tempo antes vocês chegam para montar?',
    answer:
      'Nossa equipe chega aproximadamente 2 horas antes do horário de início do seu evento para garantir que tudo esteja montado, testado e pronto para a diversão.',
  },
]

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => setOpenIndex((prev) => (prev === index ? null : index))

  return (
    <section className="bg-brand-bg py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-brand-text tracking-tight">
            PERGUNTAS <span className="text-brand-accent">FREQUENTES</span>
          </h2>
          <p className="text-brand-muted text-base">Tudo o que você precisa saber antes de contratar.</p>
        </div>

        <div className="flex flex-col gap-2">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className={cn(
                  'bg-brand-surface border rounded-xl overflow-hidden transition-colors',
                  isOpen ? 'border-brand-accent/50' : 'border-brand-border',
                )}
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-brand-text font-medium text-sm sm:text-base leading-snug">
                    {faq.question}
                  </span>
                  <span className={cn('shrink-0 transition-colors', isOpen ? 'text-brand-accent' : 'text-brand-muted')}>
                    {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-4">
                    <p className="text-brand-muted text-sm leading-relaxed border-t border-brand-border pt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
