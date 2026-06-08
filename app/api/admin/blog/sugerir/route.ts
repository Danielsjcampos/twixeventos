import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { blogPosts } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { getConfig } from '@/lib/db/queries/configuracoes'

const PROVIDER_BASES: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  deepseek: 'https://api.deepseek.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  anthropic: '__anthropic__',
}

async function callOpenAiCompatible(
  baseUrl: string,
  model: string,
  apiKey: string,
  prompt: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://twixeventos.vercel.app',
      'X-Title': 'Twix Eventos Admin Suggestions',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8, // Slightly higher temperature for creative suggestions
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
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    }),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim()

  // Remover bloco <think>...</think> se existir
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // Buscar o primeiro '[' e o último ']' para isolar o JSON array bruto
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
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

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. Carregar configurações da IA
    const [provedor, modelo, apiKey, queueRaw] = await Promise.all([
      getConfig('ia_motor_nome'),
      getConfig('ia_modelo'),
      getConfig('ia_api_key'),
      getConfig('blog_keyword_queue'),
    ])

    const isAiConfigured = !!(provedor && modelo && apiKey)

    // 2. Buscar posts recentes para evitar duplicatas
    const recentPosts = await db
      .select({ titulo: blogPosts.titulo })
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt))
      .limit(30)

    const existingTitles = recentPosts.map((p) => p.titulo)

    let currentQueue: string[] = []
    if (queueRaw) {
      try {
        currentQueue = JSON.parse(queueRaw)
      } catch {
        currentQueue = []
      }
    }

    // 3. Montar o prompt negativo com artigos já criados e na fila
    const recentList = existingTitles.map((t) => `- ${t}`).join('\n')
    const queueList = currentQueue.map((q) => `- ${q}`).join('\n')

    const prompt = `Você é um especialista em SEO, Inbound Marketing e Co-fundador de uma agência de casamentos e festas infantis em São José dos Campos (SJC) e região do Vale do Paraíba.
Sugira de 8 a 10 pautas/temas inéditos, atraentes e de alto volume de buscas ou valor de conversão para o blog da "Twix Eventos" (empresa especialista em aluguel de brinquedos infláveis, camas elásticas, tobogãs, pebolim, fliperamas, brinquedos eletrônicos e recreação).

Instruções cruciais para as ideias sugeridas:
1. Devem focar em termos e locais de interesse de São José dos Campos (SJC), Jacareí, Taubaté ou Vale do Paraíba.
2. Devem ser ideias variadas, abrangendo festas infantis, planejamento de eventos, confraternizações de empresas (eventos corporativos), dicas de lazer de fim de semana, e segurança em brinquedos.
3. Não podem se sobrepor ou serem idênticas aos artigos já criados ou na fila atual.

Artigos já escritos recentemente:
${recentList || '(Nenhum artigo ainda escrito)'}

Temas na fila cron aguardando publicação:
${queueList || '(Nenhuma palavra-chave na fila)'}

Classifique as sugestões em uma das categorias permitidas:
- 'Dicas de Festa'
- 'Lazer e Diversão'
- 'Planejamento'
- 'Brinquedos'
- 'Eventos Corporativos'

Retorne APENAS um array JSON bruto no formato abaixo, sem tags markdown ou textos explicativos de introdução/conclusão:
[
  {
    "tema": "Tema/Palavra-chave curta (ex: Aluguel de tobogã inflável em SJC)",
    "tituloSugerido": "Título chamativo de alta conversão (ex: Guia Completo para Alugar Tobogã Inflável em SJC e Vale do Paraíba)",
    "categoria": "Uma das categorias da lista acima",
    "justificativa": "Explicação breve (máx 120 caracteres) do porquê esse tema trará conversões ou visitas de SEO local."
  }
]`

    let suggestions = []
    if (isAiConfigured) {
      try {
        const provKey = provedor.toLowerCase().trim()
        let rawText = ''

        if (provKey === 'anthropic') {
          rawText = await callAnthropic(modelo!, apiKey!, prompt)
        } else {
          const baseUrl = PROVIDER_BASES[provKey] ?? `https://api.${provKey}.com/v1`
          rawText = await callOpenAiCompatible(baseUrl, modelo!, apiKey!, prompt)
        }

        const cleanedText = cleanJsonResponse(rawText)
        suggestions = JSON.parse(cleanedText)
      } catch (err) {
        console.warn('[sugerir-posts] AI Suggestion failed (offline/network error), running offline fallback:', err)
      }
    }

    if (!suggestions || suggestions.length === 0) {
      suggestions = [
        {
          tema: "Aluguel de Tobogã Inflável em SJC",
          tituloSugerido: "Guia Completo para Alugar Tobogã Inflável em SJC e Vale do Paraíba",
          categoria: "Brinquedos",
          justificativa: "Alta busca local em SJC por tobogãs infláveis durante feriados e finais de semana."
        },
        {
          tema: "Como Planejar uma Festa Infantil no Vale do Paraíba",
          tituloSugerido: "Como Planejar a Festa Infantil Perfeita em São José dos Campos e Jacareí",
          categoria: "Planejamento",
          justificativa: "Palavra-chave muito procurada por mães que buscam planejar aniversários do zero."
        },
        {
          tema: "Aluguel de Touro Mecânico para Festas Corporativas",
          tituloSugerido: "Touro Mecânico em Eventos Corporativos: Dicas para Engajar seu Time",
          categoria: "Eventos Corporativos",
          justificativa: "Excelente para atração de leads B2B em busca de confraternizações de fim de ano."
        },
        {
          tema: "Dicas de Segurança em Locação de Brinquedos",
          tituloSugerido: "Segurança em Primeiro Lugar: O que Saber Antes de Alugar Brinquedos Infláveis",
          categoria: "Lazer e Diversão",
          justificativa: "Informativo crucial para construir autoridade de marca e confiança com os clientes."
        },
        {
          tema: "Festa de Aniversário com Brinquedos Eletrônicos",
          tituloSugerido: "Brinquedos Eletrônicos que Fazem Sucesso em Festas de Adolescentes",
          categoria: "Dicas de Festa",
          justificativa: "Atrai público que busca entretenimento além dos infláveis tradicionais."
        }
      ]
    }

    return NextResponse.json({
      success: true,
      suggestions,
    })
  } catch (error: any) {
    console.error('[sugerir-posts] Error:', error)
    return NextResponse.json(
      { error: error.message ?? 'Erro interno ao sugerir temas.' },
      { status: 500 }
    )
  }
}
