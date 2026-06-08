import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { blogPosts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getConfig, setConfig } from '@/lib/db/queries/configuracoes'
import { createPost } from '@/lib/db/queries/blog'
import { slugify } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const PROVIDER_BASES: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  deepseek: 'https://api.deepseek.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  anthropic: '__anthropic__',
}

function getRandomOfflineTopic(): string {
  const topics = [
    'Aluguel de Brinquedos Infláveis em São José dos Campos',
    'Como Planejar um Aniversário Infantil Perfeito',
    'Locação de Tobogã e Touro Mecânico no Vale do Paraíba',
    'Brinquedos Eletrônicos para Festas de Adolescentes',
    'Dicas de Segurança no Uso de Brinquedos em Festas',
    'Organizando Eventos Corporativos com Espaço Kids',
  ]
  return topics[Math.floor(Math.random() * topics.length)]
}

function generateOfflinePost(keyword: string) {
  const slug = slugify(keyword)
  const category = 'Dicas de Festa'
  const title = `Tudo sobre ${keyword} para seu Evento`
  const excerpt = `Descubra as melhores dicas sobre ${keyword} em São José dos Campos e região para tornar sua festa inesquecível.`
  
  const conteudo = `
<h2>Por que ${keyword} é a escolha ideal para seu evento?</h2>
<p>Organizar uma festa infantil ou evento corporativo de sucesso exige atenção especial ao entretenimento. Ao optar por ${keyword} em São José dos Campos (SJC) e Vale do Paraíba, você garante diversão de alta qualidade e momentos memoráveis para todos os convidados.</p>
<p>A Twix Eventos conta com uma equipe especializada e brinquedos novos, higienizados e totalmente seguros, garantindo a tranquilidade dos pais e a alegria da garotada.</p>

<h2>Segurança e Qualidade em Primeiro Lugar</h2>
<p>Ao planejar a locação de itens para festas, a segurança deve ser sua prioridade absoluta. Todos os nossos equipamentos passam por inspeções rigorosas e manutenção periódica. Nossa equipe faz a montagem profissional no local do evento, assegurando que tudo funcione perfeitamente do início ao fim.</p>
<p>Seja aluguel de brinquedos infláveis, camas elásticas ou eletrônicos, cada item é projetado para oferecer a máxima diversão com segurança total.</p>

<h2>Dicas para Planejar o Espaço do Evento</h2>
<p>Antes de confirmar a reserva, é fundamental medir a área disponível no salão ou quintal. Certifique-se de que o local possui acesso fácil à energia elétrica e espaço suficiente para a circulação segura das crianças ao redor do brinquedo. Com um planejamento simples, seu evento será um verdadeiro sucesso!</p>
  `.trim()

  return {
    title,
    slug,
    excerpt,
    conteudo,
    category,
    tags: [keyword, 'Festa Infantil', 'Locação SJC', 'Lazer'],
    seoTitle: `${title.substring(0, 50)} - Twix Eventos`,
    seoDescription: excerpt.substring(0, 150),
    seoKeywords: `${keyword}, locação sjc, brinquedos inflaveis`,
    imagePrompt: '',
  }
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'brinquedos')

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
      'X-Title': 'Twix Eventos Cron',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
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
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim()
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1)
  }
  return cleaned
}

// Helper to generate cover image using DALL-E
async function generateDalleImage(
  prompt: string,
  apiKey: string,
  slug: string
): Promise<string | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
      }),
    })
    if (!response.ok) return null
    const resJson = await response.json()
    const imageUrl = resJson.data?.[0]?.url
    if (!imageUrl) return null

    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) return null
    const buffer = Buffer.from(await imgRes.arrayBuffer())

    const webp = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    await mkdir(UPLOAD_DIR, { recursive: true })
    const filename = `blog-cron-${slug}-${randomUUID().slice(0, 8)}.webp`
    await writeFile(path.join(UPLOAD_DIR, filename), webp)
    return `/uploads/brinquedos/${filename}`
  } catch (err) {
    console.error('[cron-gerar-imagem] DALL-E error:', err)
    return null
  }
}

export async function GET(request: Request) {
  // 1. Authorization Check (Vercel Cron Header or secret key in query)
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const querySecret = searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET || 'twix-cron-secret-2025'

  if (authHeader !== `Bearer ${expectedSecret}` && querySecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. Load configurations
    const [provedor, modelo, apiKey, queueRaw, fallbacksRaw] = await Promise.all([
      getConfig('ia_motor_nome'),
      getConfig('ia_modelo'),
      getConfig('ia_api_key'),
      getConfig('blog_keyword_queue'),
      getConfig('blog_fallback_imagens'),
    ])

    const isAiConfigured = !!(provedor && modelo && apiKey)
    const provKey = isAiConfigured ? provedor.toLowerCase().trim() : 'offline'

    // 3. Resolve keyword/topic
    let keyword = ''
    let queue: string[] = []

    if (queueRaw) {
      try {
        queue = JSON.parse(queueRaw)
      } catch {
        queue = []
      }
    }

    if (queue.length > 0) {
      keyword = queue.shift() || ''
      // Save updated queue back to db
      await setConfig('blog_keyword_queue', JSON.stringify(queue))
      console.log('[cron-blog] Selected keyword from queue:', keyword)
    } else {
      // Autopilot mode: AI invents a topic based on niche and recent post titles
      console.log('[cron-blog] Queue is empty. Triggering autopilot topic selection...')
      const recentPosts = await db
        .select({ titulo: blogPosts.titulo })
        .from(blogPosts)
        .orderBy(desc(blogPosts.createdAt))
        .limit(15)

      const titlesList = recentPosts.map((p) => p.titulo).join('\n')

      const suggestPrompt = `Você é um especialista em SEO e Marketing de Conteúdo para empresas de lazer e festas infantis.
Sugira uma única palavra-chave ou tema de artigo altamente relevante, atrativo e focado em cliques (SEO local) para o blog da "Twix Eventos" (empresa que faz locação de brinquedos infláveis, camas elásticas e eletrônicos para aniversários e eventos corporativos em São José dos Campos e Vale do Paraíba).

Temas abordados recentemente (NÃO repita nem escreva nada parecido):
${titlesList || '(Nenhum artigo publicado ainda)'}

Retorne APENAS a palavra-chave/tema sugerido em texto puro, sem aspas, sem formatações ou comentários.`

      let suggestion = ''
      if (isAiConfigured) {
        try {
          if (provKey === 'anthropic') {
            suggestion = await callAnthropic(modelo, apiKey!, suggestPrompt)
          } else {
            const baseUrl = PROVIDER_BASES[provKey] ?? `https://api.${provKey}.com/v1`
            suggestion = await callOpenAiCompatible(baseUrl, modelo!, apiKey!, suggestPrompt)
          }
        } catch (err) {
          console.warn('[cron-blog] AI Suggestion failed (offline/network error), running offline fallback:', err)
          suggestion = getRandomOfflineTopic()
        }
      } else {
        suggestion = getRandomOfflineTopic()
      }

      keyword = suggestion
        .trim()
        .replace(/^"(.*)"$/, '$1')
        .replace(/^'(.*)'$/, '$1')
      console.log('[cron-blog] Autopilot suggested keyword:', keyword)
    }

    if (!keyword) {
      return NextResponse.json({ error: 'Nenhum tema pôde ser definido.' }, { status: 500 })
    }

    // 4. Generate post content
    const generatePrompt = `Você é um redator sênior especialista em Marketing de Conteúdo, SEO local e produção de artigos de alto engajamento.
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

    let postData: any = null
    if (isAiConfigured) {
      try {
        let generatedText = ''
        if (provKey === 'anthropic') {
          generatedText = await callAnthropic(modelo!, apiKey!, generatePrompt)
        } else {
          const baseUrl = PROVIDER_BASES[provKey] ?? `https://api.${provKey}.com/v1`
          generatedText = await callOpenAiCompatible(baseUrl, modelo!, apiKey!, generatePrompt)
        }

        const cleanedText = cleanJsonResponse(generatedText)
        postData = JSON.parse(cleanedText)
      } catch (err) {
        console.warn('[cron-blog] AI Generation failed (offline/network error), running offline fallback:', err)
        postData = generateOfflinePost(keyword)
      }
    } else {
      postData = generateOfflinePost(keyword)
    }

    if (!postData || !postData.title || !postData.conteudo) {
      throw new Error('Conteúdo ou Título gerado está vazio ou inválido.')
    }

    const slug = postData.slug || slugify(postData.title)

    // 5. Select Featured Cover Image from Fallback Gallery
    let fotoDestaque: string | null = null

    if (fallbacksRaw) {
      try {
        const fallbacks: string[] = JSON.parse(fallbacksRaw)
        if (fallbacks.length > 0) {
          const idx = Math.floor(Math.random() * fallbacks.length)
          fotoDestaque = fallbacks[idx]
          console.log('[cron-blog] Selected cover from fallback gallery:', fotoDestaque)
        }
      } catch (err) {
        console.error('[cron-blog] Error parsing fallback images:', err)
      }
    }

    // Try DALL-E if OpenAI is the provider, and we haven't selected a fallback image yet
    if (!fotoDestaque && isAiConfigured && provKey === 'openai' && postData.imagePrompt) {
      try {
        fotoDestaque = await generateDalleImage(postData.imagePrompt, apiKey!, slug)
        console.log('[cron-blog] DALL-E cover generated as fallback:', fotoDestaque)
      } catch (err) {
        console.warn('[cron-blog] DALL-E cover generation failed:', err)
      }
    }

    // 6. Save and publish to the database
    const publishedPost = await createPost({
      titulo: postData.title,
      slug,
      conteudo: postData.conteudo,
      resumo: postData.excerpt || '',
      categoria: postData.category || 'Dicas de Festa',
      tags: postData.tags || [],
      status: 'publicado', // Automatically published via Cron!
      fotoDestaque,
      seoTitle: postData.seoTitle || postData.title,
      seoDescription: postData.seoDescription || postData.excerpt || '',
      seoKeywords: postData.seoKeywords || keyword,
      tempoLeitura: Math.ceil((postData.conteudo || '').split(/\s+/).length / 200) || 5,
    })

    console.log('[cron-blog] Post published successfully! ID:', publishedPost.id)

    // 7. Revalidate Next.js cache paths
    revalidatePath('/')
    revalidatePath('/blog')
    revalidatePath(`/blog/${slug}`)

    return NextResponse.json({
      success: true,
      action: 'post_created',
      post: {
        id: publishedPost.id,
        titulo: publishedPost.titulo,
        slug: publishedPost.slug,
        categoria: publishedPost.categoria,
        fotoDestaque: publishedPost.fotoDestaque,
      },
    })
  } catch (error: any) {
    console.error('[cron-blog] Error:', error)
    return NextResponse.json(
      { error: error.message ?? 'Erro interno no cron de geração de blog.' },
      { status: 500 }
    )
  }
}
