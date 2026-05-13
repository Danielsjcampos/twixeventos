import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getConfig } from '@/lib/db/queries/configuracoes'
import { db } from '@/lib/db'
import { brinquedos } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Envia URLs para a Indexing API do Google usando a chave de serviço configurada
async function notifyGoogle(url: string, apiKey: string): Promise<{ url: string; ok: boolean; status?: number }> {
  try {
    // A Indexing API do Google requer autenticação OAuth2 com Service Account.
    // O campo gsc_api_key deve conter o JSON da service account.
    // Aqui usamos o endpoint de notificação via fetch simples com JWT.
    const serviceAccount = JSON.parse(apiKey)
    const now = Math.floor(Date.now() / 1000)

    // Montar JWT para autenticação
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })).toString('base64url')

    const { createSign } = await import('crypto')
    const sign = createSign('RSA-SHA256')
    sign.update(`${header}.${payload}`)
    const signature = sign.sign(serviceAccount.private_key, 'base64url')
    const jwt = `${header}.${payload}.${signature}`

    // Trocar JWT por access_token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })
    if (!tokenRes.ok) return { url, ok: false, status: tokenRes.status }
    const { access_token } = await tokenRes.json()

    // Enviar URL para indexação
    const indexRes = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ url, type: 'URL_UPDATED' }),
    })
    return { url, ok: indexRes.ok, status: indexRes.status }
  } catch {
    return { url, ok: false }
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [siteUrl, apiKey] = await Promise.all([
    getConfig('site_url'),
    getConfig('gsc_api_key'),
  ])

  const base = (siteUrl ?? 'https://twixeventos.com').replace(/\/$/, '')

  // Montar lista de URLs do sitemap
  const body = await req.json().catch(() => ({}))
  let urls: string[] = body.urls ?? []

  if (urls.length === 0) {
    // Se não especificado, indexar todas as URLs conhecidas
    const lista = await db
      .select({ slug: brinquedos.slug })
      .from(brinquedos)
      .where(eq(brinquedos.ativo, true))

    urls = [
      base,
      `${base}/brinquedos`,
      `${base}/sobre`,
      `${base}/contato`,
      ...lista.map(b => `${base}/brinquedos/${b.slug}`),
    ]
  }

  // Se não há API key, retornar lista de URLs (ping simples ao sitemap)
  if (!apiKey) {
    // Ping ao Google/Bing sem autenticação (método legado mas ainda funciona)
    const pings = await Promise.allSettled([
      fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(`${base}/sitemap.xml`)}`),
      fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(`${base}/sitemap.xml`)}`),
    ])

    return NextResponse.json({
      ok: true,
      modo: 'ping_sitemap',
      urls: urls.length,
      sitemap: `${base}/sitemap.xml`,
      google: pings[0].status === 'fulfilled',
      bing: pings[1].status === 'fulfilled',
    })
  }

  // Indexing API com service account
  const results = await Promise.all(urls.map(url => notifyGoogle(url, apiKey)))
  const ok = results.filter(r => r.ok).length
  const errors = results.filter(r => !r.ok)

  return NextResponse.json({ ok: true, modo: 'indexing_api', total: urls.length, indexados: ok, erros: errors })
}
