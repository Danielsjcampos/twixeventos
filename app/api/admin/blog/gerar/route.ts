import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getConfig } from '@/lib/db/queries/configuracoes'
import { notificarBuscadores } from '@/lib/seo/notificar'

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
      'HTTP-Referer': 'https://twixeventos.vercel.app',
      'X-Title': 'Twix Eventos Admin',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
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
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim()
  
  // Remover bloco <think>...</think> se existir (comum em modelos de raciocínio como DeepSeek-R1)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // Buscar o primeiro '{' e o último '}' para isolar o JSON bruto
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1)
  }

  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3)
  }
  return cleaned.trim()
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { keyword } = await request.json()
    if (!keyword) return NextResponse.json({ error: 'keyword/tema é obrigatório' }, { status: 400 })

    // Load AI config from configuracoes table
    const [provedor, modelo, apiKey] = await Promise.all([
      getConfig('ia_motor_nome'),
      getConfig('ia_modelo'),
      getConfig('ia_api_key'),
    ])

    if (!provedor || !modelo || !apiKey) {
      return NextResponse.json({
        error: 'Chave de IA não configurada. Configure o provedor de IA e a API Key nas Configurações do Sistema.'
      }, { status: 400 })
    }

    const prompt = `Você é um redator sênior especialista em Marketing de Conteúdo, SEO local e produção de artigos de alto engajamento.
Escreva um artigo de blog extremamente completo, detalhado e explicativo sobre o tema abaixo.

Palavra-chave/Tema: "${keyword}"
Localização e Foco Geográfico: Atuação da empresa em São José dos Campos (SJC) e Vale do Paraíba, SP.
Empresa: Twix Eventos (empresa especialista em locação de brinquedos infláveis, eletrônicos, camas elásticas e serviços de lazer para aniversários, festas infantis e eventos corporativos).

Instruções Cruciais:
1. Escreva um artigo completo, longo (pelo menos 800 a 1200 palavras) e muito detalhado, com excelente profundidade e riqueza de informações reais.
2. Crie uma estrutura cativante e fluida, utilizando obrigatoriamente tags HTML <h2> para as seções principais.
3. Sob cada tag <h2>, escreva pelo menos dois a três parágrafos longos, explicativos e ricos em SEO. NUNCA adicione marcadores de posição, reticências ("...") ou textos incompletos.
4. Use palavras-chave relevantes locais e do setor de forma natural no texto (ex: "locação de brinquedos em SJC", "festas infantis em São José dos Campos", "aluguel de cama elástica", "brinquedos infláveis", "Vale do Paraíba", etc.).
5. Não use markdown de títulos (como ##) nem tags <h1>. Não use tags estruturais de página como <html>, <body> ou <div>. O conteúdo deve iniciar direto no assunto da primeira tag <h2>.
6. Escreva em um tom de voz de especialista, amigável, confiável e persuasivo.
7. Retorne o resultado em formato JSON válido para que possamos processar e salvar.
8. Gere também tags de post e sugestão de categoria de forma automatizada (use categorias simples como 'Dicas de Festa', 'Lazer e Diversão', 'Planejamento').
9. Crie um prompt descritivo detalhado em inglês ("imagePrompt") para gerar a imagem de capa ideal do artigo usando DALL-E (ex: "A hyper-detailed, vibrant photo of a colorful children's party with kids playing, shot on 35mm lens, high quality").

Retorne APENAS um objeto JSON válido (sem formatação markdown, sem comentários, apenas o JSON bruto):
{
  "title": "(título atraente, focado em cliques e otimizado para SEO)",
  "slug": "(slug amigável separado por hífens, ex: como-organizar-festa-infantil-sjc)",
  "excerpt": "(resumo curto e instigante do artigo de 140 a 160 caracteres)",
  "conteudo": "HTML completo do corpo do post, contendo apenas tags <h2>, <p>, <ul>/<li> se apropriado, e sem tags <html>/<body>/<div> externas",
  "category": "(categoria ideal do post, ex: 'Dicas de Festa' ou 'Lazer e Diversão' ou 'Planejamento')",
  "tags": ["tag1", "tag2", "tag3"],
  "seoTitle": "(título SEO ideal de no máximo 60 caracteres)",
  "seoDescription": "(descrição SEO de no máximo 155 caracteres com chamada para ação)",
  "seoKeywords": "palavra-chave1, palavra-chave2",
  "imagePrompt": "(prompt em inglês detalhado e visual para DALL-E gerar a foto de destaque perfeita, sem texto na imagem)"
}`

    const provKey = provedor.toLowerCase().trim()
    let rawText = ''

    if (provKey === 'anthropic') {
      rawText = await callAnthropic(modelo, apiKey, prompt)
    } else {
      const baseUrl = PROVIDER_BASES[provKey] ?? `https://api.${provKey}.com/v1`
      rawText = await callOpenAiCompatible(baseUrl, modelo, apiKey, prompt)
    }

    const cleanedText = cleanJsonResponse(rawText)
    const parsed = JSON.parse(cleanedText)

    return NextResponse.json({
      success: true,
      post: parsed
    })
  } catch (error: any) {
    console.error('[gerar-post] Error:', error)
    return NextResponse.json({ error: error.message ?? 'Erro interno ao gerar conteúdo do post.' }, { status: 500 })
  }
}
