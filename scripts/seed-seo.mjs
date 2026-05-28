/**
 * seed-seo.mjs
 * Gera e salva SEO otimizado para todos os brinquedos da Twix Eventos.
 * Execução: node scripts/seed-seo.mjs
 */

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)

// ---------------------------------------------------------------------------
// Constantes de localização (GEO SEO)
// ---------------------------------------------------------------------------
const CIDADE = 'São José dos Campos'
const REGIAO = 'Vale do Paraíba'
const MARCA = 'Twix Eventos'
const DOMINIO = 'twixeventos.vercel.app'

// ---------------------------------------------------------------------------
// Mapa de termos por categoria
// ---------------------------------------------------------------------------
const CAT_TERMOS = {
  inflaveis:  ['inflável', 'pula-pula', 'brinquedo inflável', 'castelo inflável'],
  toboshark:  ['toboshark', 'tobogã aquático', 'escorregador aquático', 'toboágua'],
  radicais:   ['radical', 'adrenalina', 'esporte radical', 'brinquedo radical'],
  batalhas:   ['batalha', 'duelo', 'cotonete gigante', 'batalha inflável'],
  tematicos:  ['temático', 'brinquedo temático', 'festa temática'],
  aquaticos:  ['aquático', 'diversão na água', 'brinquedo aquático', 'piscina'],
}

// ---------------------------------------------------------------------------
// Gera SEO inteligente por brinquedo
// ---------------------------------------------------------------------------
function gerarSeo(b) {
  const {
    nome, categoria, descricao, faixa_etaria,
    capacidade, dimensoes, energia, tags = [],
  } = b

  const cat = categoria?.toLowerCase() ?? 'inflaveis'
  const termosCat = CAT_TERMOS[cat] ?? ['brinquedo para festa']
  const alTags = (tags ?? []).flatMap(t => CAT_TERMOS[t] ?? [t])

  // --- Título (≤ 60 chars) ---
  const titulo = (() => {
    const base = `${nome} – Aluguel em ${CIDADE}`
    if (base.length <= 58) return `${base} | ${MARCA}`
    return `${nome} – ${CIDADE} | ${MARCA}`
  })()

  // --- Descrição (≤ 155 chars) ---
  const descBase = descricao?.trim()
  const faixa = faixa_etaria ? `Para ${faixa_etaria}.` : ''
  const cap = capacidade ? `Capacidade: ${capacidade}.` : ''

  const descricaoSeo = (() => {
    if (descBase && descBase.length > 20) {
      const trunc = descBase.slice(0, 100).replace(/\s\w+$/, '') + '...'
      const full = `Alugue ${nome} em ${CIDADE}. ${trunc} ${faixa} Entrega e montagem incluídos – ${MARCA}!`
      if (full.length <= 155) return full
    }
    return `Alugue ${nome} em ${CIDADE} e ${REGIAO}. ${faixa} ${cap} Entrega, montagem e desmontagem incluídos. Orçamento grátis – ${MARCA}!`
      .replace(/\s+/g, ' ').trim().slice(0, 155)
  })()

  // --- Keywords (8–14 termos) ---
  const nLower = nome.toLowerCase().replace(/\s+/g, ' ').trim()
  const keywordsArr = [
    nLower,
    `aluguel ${nLower}`,
    `${nLower} ${CIDADE.toLowerCase()}`,
    `${nLower} ${REGIAO.toLowerCase()}`,
    `locação ${nLower}`,
    ...termosCat.slice(0, 3),
    ...alTags.slice(0, 2),
    `aluguel de brinquedos ${CIDADE.toLowerCase()}`,
    `brinquedos para festa infantil ${CIDADE.toLowerCase()}`,
    MARCA.toLowerCase(),
  ].filter((v, i, a) => v && a.indexOf(v) === i) // dedupe

  return {
    seo_title:       titulo.slice(0, 70),
    seo_description: descricaoSeo.slice(0, 160),
    seo_keywords:    keywordsArr.slice(0, 14).join(', '),
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('🔍 Buscando brinquedos...')
  const brinquedos = await sql`
    SELECT id, nome, categoria, descricao, faixa_etaria,
           capacidade, dimensoes, energia, tags
    FROM brinquedos
    ORDER BY nome
  `
  console.log(`📦 ${brinquedos.length} brinquedos encontrados\n`)

  let ok = 0
  let errors = 0

  for (const b of brinquedos) {
    try {
      const seo = gerarSeo(b)
      await sql`
        UPDATE brinquedos
        SET seo_title       = ${seo.seo_title},
            seo_description = ${seo.seo_description},
            seo_keywords    = ${seo.seo_keywords},
            updated_at      = NOW()
        WHERE id = ${b.id}
      `
      ok++
      console.log(`✅  ${b.nome}`)
      console.log(`    Title:    ${seo.seo_title}`)
      console.log(`    Desc:     ${seo.seo_description.slice(0, 80)}...`)
      console.log(`    Keywords: ${seo.seo_keywords.split(', ').slice(0, 5).join(', ')}...`)
      console.log()
    } catch (err) {
      errors++
      console.error(`❌  ${b.nome} — ${err.message}`)
    }
  }

  console.log('─'.repeat(50))
  console.log(`✅ ${ok} brinquedos atualizados | ❌ ${errors} erros`)
}

main().catch(console.error)
