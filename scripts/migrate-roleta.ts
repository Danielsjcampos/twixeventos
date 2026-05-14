import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

const PREMIOS_DEFAULT = JSON.stringify([
  { id: '1', nome: '10% Bônus',       descricao: 'Bônus de 10% de cashback na próxima festa',  cor: '#3B82F6', peso: 30, valorCredito: 0  },
  { id: '2', nome: 'R$ 20 desconto',  descricao: 'R$ 20 creditados direto no seu cashback!',   cor: '#10B981', peso: 25, valorCredito: 20 },
  { id: '3', nome: 'Brinde Surpresa', descricao: 'Um brinde especial entregue no dia da festa', cor: '#F59E0B', peso: 20, valorCredito: 0  },
  { id: '4', nome: 'Frete Grátis',    descricao: 'Sem taxa de transporte no próximo evento',    cor: '#8B5CF6', peso: 15, valorCredito: 0  },
  { id: '5', nome: 'R$ 50 desconto',  descricao: 'R$ 50 creditados no cashback — grand prize!', cor: '#EF4444', peso: 8,  valorCredito: 50 },
  { id: '6', nome: '1h Extra',        descricao: '1 hora extra de locação sem custo adicional', cor: '#EC4899', peso: 2,  valorCredito: 0  },
])

async function main() {
  console.log('🎡 Migrando: Roleta de prêmios...\n')

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS roleta_giros (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cliente_id  UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      premio_nome TEXT NOT NULL,
      premio_desc TEXT,
      premio_id   TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_roleta_cliente ON roleta_giros(cliente_id)`)
  console.log('✅ Tabela roleta_giros criada')

  // Configs da roleta
  await db.execute(sql`
    INSERT INTO configuracoes (chave, valor, descricao) VALUES
      ('roleta_ativa',        'true', 'Habilitar roleta de prêmios na área do cliente'),
      ('roleta_min_cashback', '200',  'Valor mínimo de cashback total para ganhar 1 giro'),
      ('roleta_premios',      ${PREMIOS_DEFAULT}, 'Prêmios da roleta em JSON')
    ON CONFLICT (chave) DO NOTHING
  `)
  console.log('✅ Configs da roleta inseridas')

  console.log('\n🎉 Migração da roleta concluída!')
  process.exit(0)
}

main().catch(e => { console.error('❌', e); process.exit(1) })
