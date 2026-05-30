import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getConfig } from '@/lib/db/queries/configuracoes'
import { getTermoById, updateTermo } from '@/lib/db/queries/glossario'
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
  
  // Remover bloco <think>...</think> se existir (comum em modelos de raciocínio como DeepSeek-R1 e Nemotron)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // Buscar o primeiro '{' e o último '}' para isolar o JSON bruto
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1)
  }

  // Fallback legível anterior
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
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id do termo é obrigatório' }, { status: 400 })

    // Buscar o termo no banco
    const termo = await getTermoById(id)
    if (!termo) {
      return NextResponse.json({ error: 'Termo não encontrado' }, { status: 404 })
    }

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

    const prompt = `Você é um redator sênior especialista em Marketing de Busca, SEO local e produção de conteúdo de alto valor.
Escreva uma definição/verbete de dicionário extremamente detalhado e explicativo (em formato de mini-artigo de blog) para o termo de glossário abaixo.

Termo: "${termo.termo}"
Nicho/Contexto: "${termo.nicho}"
Localização e Foco Geográfico: Atuação da empresa em São José dos Campos (SJC) e Vale do Paraíba, SP.

Instruções Cruciais:
1. Escreva um artigo completo, longo e muito detalhado, com excelente profundidade e riqueza de informações reais.
2. Cada seção (introduzida por uma tag <h2>) DEVE ser acompanhada de pelo menos um parágrafo longo de 100 a 150 palavras de texto explicativo real.
3. Use obrigatoriamente tags HTML <h2> para introduzir as seções. Adapte os cabeçalhos para o contexto do termo (nunca use reticências "..." nos títulos finais). Exemplos de cabeçalhos adequados:
   - "<h2>O que significa [Termo]</h2>" (Escreva um parágrafo explicativo completo)
   - "<h2>Como funciona [Termo] em São José dos Campos</h2>" (Escreva um parágrafo explicativo completo)
   - "<h2>Vantagens de utilizar [Termo]</h2>" (Escreva um parágrafo explicativo completo)
   - "<h2>Como escolher a melhor opção em SJC e região</h2>" (Escreva um parágrafo explicativo completo)
4. ATENÇÃO MÁXIMA: NUNCA adicione marcadores de posição, textos inacabados, resumos em tópicos ou reticências ("...") no conteúdo. Todos os parágrafos sob cada tag <h2> devem estar inteiramente escritos e conter definições reais, completas e ricas em SEO.
5. Não use markdown de títulos (como ##) nem tags <h1>. Não use tags globais de estrutura como <html>, <body>, ou <div>.
6. Inclua palavras-chave e citações geográficas locais de forma fluida e natural (como "São José dos Campos", "aluguel de brinquedos em SJC", "Taubaté", "Jacareí", "Vale do Paraíba", "festas infantis em SJC").
7. Escreva no tom de voz de um especialista profissional, mas amigável e persuasivo.
8. NÃO adicione introduções formais (ex: "Aqui está o verbete..."), conclusões redundantes (ex: "Conclusão", "Considerações finais") nem considerações sobre o processo. O conteúdo deve iniciar direto no assunto da primeira tag <h2>.
9. NUNCA faça rascunhos extensos, contagens manuais de palavras ou cálculos demorados em seus pensamentos internos (isso esgota o seu limite de tokens de saída). Foque em escrever diretamente o texto final e em gerar o JSON completo de uma vez.
10. Retorne o resultado em formato JSON válido para que possamos salvar no banco de dados.

Retorne APENAS um objeto JSON válido (sem formatação markdown, sem comentários, apenas o JSON bruto):
{
  "conteudo": "HTML completo com o texto e as tags <h2> (não use markdown de títulos), e sem tags <html>/<body>/<div> externas",
  "seoTitle": "(título SEO ideal de no máximo 60 caracteres com o termo e menção a São José dos Campos ou Vale do Paraíba)",
  "seoDescription": "(descrição SEO atraente de no máximo 155 caracteres com chamada para ação e menção à localidade)"
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

    const { conteudo, seoTitle, seoDescription } = parsed

    if (!conteudo) {
      return NextResponse.json({ error: 'Conteúdo gerado pela IA está vazio ou inválido.' }, { status: 500 })
    }

    // Atualizar no banco com status 'publicado'
    const updated = await updateTermo(id, {
      conteudo: conteudo.trim(),
      seoTitle: seoTitle ? seoTitle.trim() : `${termo.termo} – O que é e Significado | Twix Eventos`,
      seoDescription: seoDescription ? seoDescription.trim() : `Saiba o que significa ${termo.termo} e tudo relacionado no Glossário da Twix Eventos em São José dos Campos.`,
      status: 'publicado',
    })

    // Notifica buscadores (Google sitemap + IndexNow) — não bloqueia em caso de falha
    const slug = updated?.slug ?? termo.slug
    if (slug) {
      await notificarBuscadores([`/glossario/${slug}`])
    }

    return NextResponse.json({
      success: true,
      termo: updated
    })
  } catch (error: any) {
    console.error('[gerar-conteudo] Error:', error)
    return NextResponse.json({ error: error.message ?? 'Erro interno ao gerar definição do termo.' }, { status: 500 })
  }
}
