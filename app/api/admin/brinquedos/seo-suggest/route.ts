import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getConfig } from '@/lib/db/queries/configuracoes'

// ---------------------------------------------------------------------------
// Template fallback — works without any AI key
// ---------------------------------------------------------------------------
function templateSeo(nome: string, categoria: string, descricao: string | null, tags: string[]) {
  const cidadeRef = 'São José dos Campos e Vale do Paraíba'
  const allTags = [categoria, ...tags].filter(Boolean).join(', ')

  const title = `${nome} para Alugar – ${cidadeRef} | Twix Eventos`

  const desc =
    descricao && descricao.length > 30
      ? `Alugue ${nome} para sua festa. ${descricao.slice(0, 120).trim()}... Entrega, montagem e desmontagem incluídos.`
      : `Alugue ${nome} para festas infantis e eventos em ${cidadeRef}. Entrega, montagem e desmontagem incluídos. Solicite seu orçamento com a Twix Eventos!`

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

// ---------------------------------------------------------------------------
// Provider configs — OpenAI-compatible API (OpenAI, OpenRouter, Groq, etc.)
// ---------------------------------------------------------------------------
const PROVIDER_BASES: Record<string, string> = {
  openai:       'https://api.openai.com/v1',
  openrouter:   'https://openrouter.ai/api/v1',
  groq:         'https://api.groq.com/openai/v1',
  deepseek:     'https://api.deepseek.com/v1',
  gemini:       'https://generativelanguage.googleapis.com/v1beta/openai',
  anthropic:    '__anthropic__', // Handled separately
}

async function callOpenAiCompatible(
  baseUrl: string,
  model: string,
  apiKey: string,
  prompt: string,
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      // OpenRouter requires this header
      'HTTP-Referer': 'https://twixeventos.vercel.app',
      'X-Title': 'Twix Eventos Admin',
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Provider error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callAnthropic(model: string, apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

function buildPrompt(
  nome: string, categoria: string, descricao: string | null,
  faixaEtaria: string, tags: string[],
): string {
  return `Você é um especialista em SEO para a Twix Eventos, empresa de aluguel de brinquedos em São José dos Campos, atendendo o Vale do Paraíba, SP.

Gere informações de SEO para o brinquedo abaixo, em português do Brasil.

Brinquedo: ${nome}
Categoria: ${categoria}${tags.length ? `\nTags: ${tags.join(', ')}` : ''}
Faixa etária: ${faixaEtaria}
${descricao ? `Descrição: ${descricao}` : ''}

Responda APENAS com JSON válido (sem markdown):
{
  "title": "(máx 60 chars — nome do brinquedo + localidade)",
  "description": "(máx 155 chars — atraente, mencione São José dos Campos)",
  "keywords": "(8 a 12 termos separados por vírgula)"
}`
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { nome, categoria, descricao, faixaEtaria, tags = [] } = body

  if (!nome || !categoria) {
    return NextResponse.json({ error: 'nome e categoria são obrigatórios' }, { status: 400 })
  }

  // Load AI config from configuracoes table
  const [provedor, modelo, apiKey] = await Promise.all([
    getConfig('ia_motor_nome'),
    getConfig('ia_modelo'),
    getConfig('ia_api_key'),
  ])

  const prompt = buildPrompt(nome, categoria, descricao, faixaEtaria ?? '', tags)

  if (provedor && modelo && apiKey) {
    try {
      const provKey = provedor.toLowerCase().trim()
      let rawText = ''

      if (provKey === 'anthropic') {
        rawText = await callAnthropic(modelo, apiKey, prompt)
      } else {
        const baseUrl = PROVIDER_BASES[provKey] ?? `https://api.${provKey}.com/v1`
        rawText = await callOpenAiCompatible(baseUrl, modelo, apiKey, prompt)
      }

      const parsed = JSON.parse(rawText)
      return NextResponse.json({
        title:       parsed.title ?? '',
        description: parsed.description ?? '',
        keywords:    parsed.keywords ?? '',
      })
    } catch (err) {
      console.error('[seo-suggest] AI error, falling back to template:', err)
    }
  }

  // Fallback: template-based generation
  return NextResponse.json(templateSeo(nome, categoria, descricao, tags))
}
