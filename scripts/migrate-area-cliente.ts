import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

async function main() {
  console.log('🚀 Migrando: Área do Cliente + Cashback...')

  // 1. Novos campos na tabela clientes
  await db.execute(sql`
    ALTER TABLE clientes
      ADD COLUMN IF NOT EXISTS codigo_acesso   TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS cashback_saldo  REAL NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cashback_total  REAL NOT NULL DEFAULT 0
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_clientes_codigo ON clientes(codigo_acesso)
  `)
  console.log('✅ Campos adicionados em clientes')

  // 2. Gerar códigos para clientes existentes sem código
  await db.execute(sql`
    UPDATE clientes
    SET codigo_acesso = CONCAT(
      'TWX-',
      UPPER(SUBSTRING(MD5(id::text || telefone), 1, 4)),
      UPPER(SUBSTRING(MD5(id::text || created_at::text), 5, 4))
    )
    WHERE codigo_acesso IS NULL
  `)
  console.log('✅ Códigos de acesso gerados para clientes existentes')

  // 3. Tabela cashback_transacoes
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS cashback_transacoes (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cliente_id          UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      evento_id           UUID REFERENCES eventos(id) ON DELETE SET NULL,
      tipo                TEXT NOT NULL CHECK (tipo IN ('credito', 'resgate', 'expirado')),
      valor               REAL NOT NULL,
      percentual_aplicado REAL,
      descricao           TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cashback_cliente ON cashback_transacoes(cliente_id)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cashback_evento  ON cashback_transacoes(evento_id)`)
  console.log('✅ Tabela cashback_transacoes criada')

  // 4. Configs de cashback no admin
  const configs = [
    ['cashback_ativo',       'true',  'Ativar programa de cashback'],
    ['cashback_percentual',  '5',     'Percentual de cashback (% do valor do evento)'],
    ['cashback_validade_dias','365',  'Validade do cashback em dias (0 = sem expiração)'],
    ['cashback_min_resgate',  '20',   'Valor mínimo para resgate (R$)'],
    ['area_cliente_ativo',    'true', 'Área do cliente ativa'],
    ['area_cliente_titulo',   'Minha Área', 'Título da área do cliente'],
  ]
  for (const [chave, valor, descricao] of configs) {
    await db.execute(sql`
      INSERT INTO configuracoes (chave, valor, descricao)
      VALUES (${chave}, ${valor}, ${descricao})
      ON CONFLICT (chave) DO NOTHING
    `)
  }
  console.log('✅ Configs de cashback inseridas')

  console.log('\n🎉 Migração concluída! Execute:\nnpx dotenv-cli -e .env.local -- npx tsx scripts/migrate-area-cliente.ts')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
