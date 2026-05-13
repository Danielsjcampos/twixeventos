import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/queries/configuracoes'
import { sendWhatsAppMessage, interpolate } from '@/lib/whatsapp'

// Webhook chamado quando cliente responde a pesquisa (via API WhatsApp callback)
// ou pode ser chamado manualmente com ?telefone=&nota=
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { telefone, nota, nomeCliente } = body as { telefone: string; nota: number; nomeCliente: string }

  if (!telefone || nota === undefined) {
    return NextResponse.json({ error: 'telefone e nota obrigatórios' }, { status: 400 })
  }

  const [notaMinimaStr, googleLink] = await Promise.all([
    getConfig('pesquisa_nota_minima'),
    getConfig('google_review_link'),
  ])

  const notaMinima = Number(notaMinimaStr ?? '4')

  if (nota >= notaMinima && googleLink) {
    const mensagem = interpolate(
      'Que ótimo, {nome}! 😊 Ficamos muito felizes em saber disso! Poderia nos ajudar deixando uma avaliação no Google? É rapidinho! ⭐⭐⭐⭐⭐\n\n{google_link}',
      { nome: nomeCliente ?? 'cliente', google_link: googleLink }
    )
    await sendWhatsAppMessage({ telefone, mensagem })
    return NextResponse.json({ ok: true, acao: 'google_review_enviado' })
  }

  return NextResponse.json({ ok: true, acao: 'nenhuma_acao', nota, notaMinima })
}
