import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

async function main() {
  console.log('🎡 Migrando: coluna giros_bonus em clientes...\n')
  await db.execute(sql`
    ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS giros_bonus INTEGER NOT NULL DEFAULT 0
  `)
  console.log('✅ Coluna giros_bonus adicionada')
  console.log('\n🎉 Migração concluída!')
  process.exit(0)
}

main().catch(e => { console.error('❌', e); process.exit(1) })
