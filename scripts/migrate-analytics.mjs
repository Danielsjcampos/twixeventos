/**
 * migrate-analytics.mjs
 * Cria a tabela analytics_events (rastreamento de páginas first-party).
 * Execução: node scripts/migrate-analytics.mjs
 */

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)

async function main() {
  console.log('→ Criando tabela analytics_events...')

  await sql`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tipo        text NOT NULL,
      path        text NOT NULL,
      referrer    text,
      rotulo      text,
      session_id  text,
      device      text,
      pais        text,
      meta        jsonb,
      created_at  timestamptz NOT NULL DEFAULT now()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS analytics_tipo_idx ON analytics_events (tipo)`
  await sql`CREATE INDEX IF NOT EXISTS analytics_path_idx ON analytics_events (path)`
  await sql`CREATE INDEX IF NOT EXISTS analytics_created_idx ON analytics_events (created_at)`

  console.log('✅ Tabela analytics_events e índices criados com sucesso.')

  // Seed das configurações padrão (liga/desliga)
  console.log('→ Inserindo flags de configuração padrão...')
  const flags = [
    ['tracking_ativo', 'true', 'Liga/desliga o rastreamento de páginas (first-party)'],
    ['glossario_leitura_ativo', 'true', 'Liga/desliga o modo de leitura ditada nos verbetes do glossário'],
    ['glossario_ads_ativo', 'true', 'Liga/desliga os anúncios/CTAs dentro do conteúdo do glossário'],
  ]
  for (const [chave, valor, descricao] of flags) {
    await sql`
      INSERT INTO configuracoes (chave, valor, descricao, updated_at)
      VALUES (${chave}, ${valor}, ${descricao}, now())
      ON CONFLICT (chave) DO NOTHING
    `
  }
  console.log('✅ Flags de configuração inseridas (sem sobrescrever existentes).')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erro na migração:', err)
    process.exit(1)
  })
