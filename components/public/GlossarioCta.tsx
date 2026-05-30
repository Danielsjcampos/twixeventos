import Link from 'next/link'
import { PartyPopper, ArrowRight, MessageCircle } from 'lucide-react'

/**
 * Bloco de anúncio/CTA inserido dentro do conteúdo do glossário.
 * Liga para o formulário de contato e para o catálogo de brinquedos.
 * Os data-track permitem medir os cliques no painel de Analytics.
 */
export function GlossarioCta({ termo }: { termo: string }) {
  return (
    <aside
      className="my-8 rounded-2xl border border-brand-accent/25 bg-gradient-to-br from-brand-accent/10 to-brand-accent/5 p-6 shadow-sm not-prose"
      aria-label="Anúncio Twix Eventos"
    >
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center size-10 rounded-xl bg-brand-accent/15 text-brand-accent shrink-0">
          <PartyPopper className="size-5" />
        </span>
        <div className="flex-1">
          <h3 className="font-extrabold text-brand-text text-base leading-tight">
            Vai fazer uma festa? A Twix Eventos cuida de tudo!
          </h3>
          <p className="text-brand-muted text-sm mt-1.5 leading-relaxed">
            Aluguel de brinquedos com entrega, montagem e monitor inclusos em São José dos Campos e região.
            Peça já um orçamento sem compromisso.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-4">
            <Link
              href="/contato"
              data-track={`glossario-cta:orcamento:${termo}`}
              className="inline-flex items-center gap-1.5 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <MessageCircle className="size-4" />
              Pedir orçamento
            </Link>
            <Link
              href="/brinquedos"
              data-track={`glossario-cta:brinquedos:${termo}`}
              className="inline-flex items-center gap-1.5 bg-brand-surface border border-brand-border hover:border-brand-accent text-brand-text hover:text-brand-accent font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              Ver brinquedos
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}

/**
 * Divide o HTML do verbete em duas partes para encaixar a CTA no meio,
 * preferindo cortar antes de um <h2> próximo do meio do texto.
 */
export function dividirConteudo(html: string): [string, string] {
  if (!html) return ['', '']
  const indices: number[] = []
  const regex = /<h2[\s>]/gi
  let m: RegExpExecArray | null
  while ((m = regex.exec(html)) !== null) indices.push(m.index)

  // Sem h2 suficientes para dividir → não insere no meio
  if (indices.length < 2) return [html, '']

  const meio = html.length / 2
  // Escolhe o <h2> mais próximo do meio (a partir do 2º)
  let corte = indices[1]
  for (const idx of indices.slice(1)) {
    if (Math.abs(idx - meio) < Math.abs(corte - meio)) corte = idx
  }
  return [html.slice(0, corte), html.slice(corte)]
}
