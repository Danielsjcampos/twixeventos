import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'

function templateSeo(nome: string, categoria: string, descricao: string | null, tags: string[]) {
  const cidadeRef = 'São José dos Campos e Vale do Paraíba'
  const allTags = [categoria, ...tags].filter(Boolean).join(', ')

  const title = `${nome} para Alugar – ${cidadeRef} | Twix Eventos`

  const desc =
    descricao && descricao.length > 30
      ? `Alugue ${nome} para sua festa. ${descricao.slice(0, 120).trim()}... Entrega, montagem e desmontagem incluídos. Atendemos ${cidadeRef}.`
      : `Alugue ${nome} para festas infantis e eventos em ${cidadeRef}. Entrega, montagem e desmontagem incluídos. Solicite seu orçamento grátis com a Twix Eventos!`

  const keywords = [
    nome.toLowerCase(),
    `aluguel ${nome.toLowerCase()}`,
    `${nome.toLowerCase()} são josé dos campos`,
    `${nome.toLowerCase()} vale do paraíba`,
    allTags,
    'aluguel de brinquedos festa',
    'twix eventos',
    'brinquedos para festa infantil',
  ]
    .filter(Boolean)
    .join(', ')

  return { title, description: desc, keywords }
}

async function aiSeo(
  nome: string,
  categoria: string,
  descricao: string | null,
  faixaEtaria: string,
  tags: string[],
  apiKey: string,
) {
  const prompt = `Você é um especialista em SEO para uma empresa de aluguel de brinquedos chamada Twix Eventos, localizada em São José dos Campos, atendendo o Vale do Paraíba, SP.

Gere as seguintes informações de SEO para o brinquedo abaixo, em português do Brasil:

Brinquedo: ${nome}
Categoria: ${categoria}${tags.length ? `\nTags/categorias extras: ${tags.join(', ')}` : ''}
Faixa etária: ${faixaEtaria}
${descricao ? `Descrição: ${descricao}` : ''}

Retorne APENAS um JSON válido (sem markdown, sem backticks) com:
{
  "title": "(máx 60 chars — inclua o nome do brinquedo + localidade)",
  "description": "(máx 155 chars — atraente, com chamada para ação, mencione São José dos Campos)",
  "keywords": "(lista separada por vírgulas — 8 a 12 termos relevantes)"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`)
  const data = await response.json()
  const text = data.content?.[0]?.text ?? ''
  const parsed = JSON.parse(text)
  return {
    title: parsed.title ?? '',
    description: parsed.description ?? '',
    keywords: parsed.keywords ?? '',
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { nome, categoria, descricao, faixaEtaria, tags = [] } = body

  if (!nome || !categoria) {
    return NextResponse.json({ error: 'nome e categoria são obrigatórios' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  try {
    if (apiKey && apiKey.startsWith('sk-ant-')) {
      const result = await aiSeo(nome, categoria, descricao, faixaEtaria ?? '', tags, apiKey)
      return NextResponse.json(result)
    }
    // Fallback: gera sugestão por template
    const result = templateSeo(nome, categoria, descricao, tags)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[seo-suggest] AI error, falling back to template:', err)
    const result = templateSeo(nome, categoria, descricao, tags)
    return NextResponse.json(result)
  }
}
