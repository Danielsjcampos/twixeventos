import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

const premiosAtualizados = JSON.stringify([
  { id: '1', nome: '10% Bônus',       descricao: 'Bônus de 10% de cashback na próxima festa',   cor: '#3B82F6', peso: 30, valorCredito: 0  },
  { id: '2', nome: 'R$ 20 desconto',  descricao: 'R$ 20 creditados direto no seu cashback!',    cor: '#10B981', peso: 25, valorCredito: 20 },
  { id: '3', nome: 'Brinde Surpresa', descricao: 'Um brinde especial entregue no dia da festa',  cor: '#F59E0B', peso: 20, valorCredito: 0  },
  { id: '4', nome: 'Frete Grátis',    descricao: 'Sem taxa de transporte no próximo evento',     cor: '#8B5CF6', peso: 15, valorCredito: 0  },
  { id: '5', nome: 'R$ 50 desconto',  descricao: 'R$ 50 creditados no cashback — grand prize!', cor: '#EF4444', peso: 8,  valorCredito: 50 },
  { id: '6', nome: '1h Extra',        descricao: '1 hora extra de locação sem custo adicional',  cor: '#EC4899', peso: 2,  valorCredito: 0  },
])

async function main() {
  await db.execute(sql`UPDATE configuracoes SET valor = ${premiosAtualizados} WHERE chave = 'roleta_premios'`)
  console.log('✅ Prêmios atualizados com valorCredito')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
