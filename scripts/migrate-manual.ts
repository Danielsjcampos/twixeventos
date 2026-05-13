import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function run() {
  await sql`ALTER TABLE eventos ADD COLUMN IF NOT EXISTS origem_cliente text`
  await sql`ALTER TABLE eventos ADD COLUMN IF NOT EXISTS tipo_cliente text`
  await sql`
    CREATE TABLE IF NOT EXISTS usuarios_sistema (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      nome text NOT NULL,
      cargo text,
      role text NOT NULL DEFAULT 'operador',
      permissoes jsonb DEFAULT '{}',
      ativo boolean NOT NULL DEFAULT true,
      ultimo_acesso timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `
  console.log('✅ Colunas origem_cliente, tipo_cliente e tabela usuarios_sistema criadas!')
}

run().catch(e => { console.error(e); process.exit(1) })
