import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getConfig } from '@/lib/db/queries/configuracoes'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'brinquedos')
const MAX_WIDTH = 1200
const QUALITY = 80

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { prompt, slug } = await request.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt de imagem é obrigatório' }, { status: 400 })

    const apiKey = await getConfig('ia_api_key')
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key não configurada em Configurações.' }, { status: 400 })
    }

    console.log('[gerar-imagem] Calling DALL-E 3 with prompt:', prompt)

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[gerar-imagem] DALL-E error response:', errText)
      throw new Error(`OpenAI DALL-E error: ${response.status} - ${errText}`)
    }

    const resJson = await response.json()
    const imageUrl = resJson.data?.[0]?.url

    if (!imageUrl) {
      throw new Error('DALL-E did not return an image URL.')
    }

    // Download the image
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) throw new Error(`Failed to download image from OpenAI: ${imgRes.status}`)
    const buffer = Buffer.from(await imgRes.arrayBuffer())

    // Process with sharp
    const webp = await sharp(buffer)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer()

    await mkdir(UPLOAD_DIR, { recursive: true })
    const filename = `blog-${slug || 'featured'}-${randomUUID().slice(0, 8)}.webp`
    await writeFile(path.join(UPLOAD_DIR, filename), webp)

    const localUrl = `/uploads/brinquedos/${filename}`
    console.log('[gerar-imagem] Image saved locally at:', localUrl)

    return NextResponse.json({
      success: true,
      url: localUrl,
    })
  } catch (error: any) {
    console.error('[gerar-imagem] Error:', error)
    return NextResponse.json({ error: error.message ?? 'Erro ao gerar imagem destacada.' }, { status: 500 })
  }
}
