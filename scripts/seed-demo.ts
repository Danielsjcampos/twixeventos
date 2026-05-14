/**
 * Script de seed — dados de demonstração
 * Execução: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-demo.ts
 */
import { db } from '../lib/db/index'
import { clientes, eventos, cashbackTransacoes } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

function gerarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const parte = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `TWX-${parte(4)}${parte(4)}`
}

function dataPassada(diasAtras: number): string {
  const d = new Date()
  d.setDate(d.getDate() - diasAtras)
  return d.toISOString().split('T')[0]
}

function dataFutura(diasFrente: number): string {
  const d = new Date()
  d.setDate(d.getDate() + diasFrente)
  return d.toISOString().split('T')[0]
}

const CLIENTES_SEED = [
  {
    nome: 'Ana Paula Ferreira',
    telefone: '(11) 99801-2345',
    email: 'anapaula@gmail.com',
    cpf: '382.915.740-22',
    cidade: 'São Paulo',
    origem: 'instagram',
    codigoAcesso: gerarCodigo(),
    cashbackSaldo: '87.50',
    cashbackTotal: '137.50',
    totalEventos: 3,
  },
  {
    nome: 'Bruno Rodrigues Lima',
    telefone: '(11) 98732-6541',
    email: 'brunolima@hotmail.com',
    cpf: '541.227.890-11',
    cidade: 'Guarulhos',
    origem: 'indicacao',
    codigoAcesso: gerarCodigo(),
    cashbackSaldo: '45.00',
    cashbackTotal: '45.00',
    totalEventos: 1,
  },
  {
    nome: 'Carla Mendes Sousa',
    telefone: '(11) 97654-3210',
    email: 'carlamendes@outlook.com',
    cpf: '129.843.560-88',
    cidade: 'Osasco',
    origem: 'whatsapp',
    codigoAcesso: gerarCodigo(),
    cashbackSaldo: '0.00',
    cashbackTotal: '62.00',
    totalEventos: 2,
  },
  {
    nome: 'Daniel Costa Alves',
    telefone: '(11) 95588-7712',
    email: null,
    cpf: null,
    cidade: 'São Paulo',
    origem: 'site',
    codigoAcesso: gerarCodigo(),
    cashbackSaldo: '156.00',
    cashbackTotal: '156.00',
    totalEventos: 2,
  },
  {
    nome: 'Elisa Nunes Barros',
    telefone: '(11) 94422-8890',
    email: 'elisanunes@gmail.com',
    cpf: '667.312.940-55',
    cidade: 'Santo André',
    origem: 'google',
    codigoAcesso: gerarCodigo(),
    cashbackSaldo: '0.00',
    cashbackTotal: '0.00',
    totalEventos: 0,
  },
]

async function main() {
  console.log('🌱 Iniciando seed de dados de demonstração...\n')

  // Limpar dados de demo anteriores
  const telefones = CLIENTES_SEED.map(c => c.telefone)
  for (const tel of telefones) {
    await db.execute(sql`
      DELETE FROM cashback_transacoes
      WHERE cliente_id IN (SELECT id FROM clientes WHERE telefone = ${tel})
    `)
    await db.execute(sql`DELETE FROM eventos WHERE telefone_cliente = ${tel}`)
    await db.execute(sql`DELETE FROM clientes WHERE telefone = ${tel}`)
  }
  console.log('🗑️  Dados anteriores de demo removidos')

  // Inserir clientes
  const inseridos = await db.insert(clientes).values(
    CLIENTES_SEED.map(c => ({
      nome: c.nome,
      telefone: c.telefone,
      email: c.email,
      cpf: c.cpf,
      cidade: c.cidade,
      origem: c.origem,
      codigoAcesso: c.codigoAcesso,
      cashbackSaldo: c.cashbackSaldo,
      cashbackTotal: c.cashbackTotal,
      totalEventos: c.totalEventos,
    }))
  ).returning({ id: clientes.id, nome: clientes.nome, telefone: clientes.telefone })

  console.log(`✅ ${inseridos.length} clientes inseridos`)

  const byTel = new Map(inseridos.map(c => [c.telefone, c]))
  const ana    = byTel.get('(11) 99801-2345')!
  const bruno  = byTel.get('(11) 98732-6541')!
  const carla  = byTel.get('(11) 97654-3210')!
  const daniel = byTel.get('(11) 95588-7712')!

  // Inserir eventos
  const eventosRows = await db.insert(eventos).values([
    // Ana — 3 eventos
    {
      nomeCliente: ana.nome, telefoneCliente: ana.telefone,
      dataEvento: dataPassada(120), horarioInicio: '14:00', horarioFim: '18:00',
      enderecoCompleto: 'Rua das Flores, 234 - Vila Olímpia, São Paulo',
      valorTotal: '1200.00', status: 'realizado', statusPagamento: 'pago', origemCliente: 'instagram',
    },
    {
      nomeCliente: ana.nome, telefoneCliente: ana.telefone,
      dataEvento: dataPassada(45), horarioInicio: '15:00', horarioFim: '19:00',
      enderecoCompleto: 'Av. Paulista, 1000 Ap 72 - Bela Vista, São Paulo',
      valorTotal: '1750.00', status: 'realizado', statusPagamento: 'pago', origemCliente: 'instagram',
    },
    {
      nomeCliente: ana.nome, telefoneCliente: ana.telefone,
      dataEvento: dataFutura(22), horarioInicio: '13:00', horarioFim: '17:00',
      enderecoCompleto: 'Rua Vergueiro, 3100 - Vila Mariana, São Paulo',
      valorTotal: '2000.00', status: 'confirmado', statusPagamento: 'parcial', origemCliente: 'instagram',
    },
    // Bruno — 1 evento
    {
      nomeCliente: bruno.nome, telefoneCliente: bruno.telefone,
      dataEvento: dataPassada(30), horarioInicio: '16:00', horarioFim: '20:00',
      enderecoCompleto: 'Rua Guarulhos Norte, 88 - Jd. Presidente Dutra, Guarulhos',
      valorTotal: '900.00', status: 'realizado', statusPagamento: 'pago', origemCliente: 'indicacao',
    },
    // Carla — 2 eventos
    {
      nomeCliente: carla.nome, telefoneCliente: carla.telefone,
      dataEvento: dataPassada(90), horarioInicio: '14:00', horarioFim: '18:00',
      enderecoCompleto: 'Av. dos Autonomistas, 1500 - Jd. Munhoz, Osasco',
      valorTotal: '800.00', status: 'realizado', statusPagamento: 'pago', origemCliente: 'whatsapp',
    },
    {
      nomeCliente: carla.nome, telefoneCliente: carla.telefone,
      dataEvento: dataPassada(10), horarioInicio: '13:00', horarioFim: '17:00',
      enderecoCompleto: 'Rua Ângela Mirella, 300 - Centro, Osasco',
      valorTotal: '1240.00', status: 'realizado', statusPagamento: 'pago', origemCliente: 'whatsapp',
    },
    // Daniel — 2 eventos
    {
      nomeCliente: daniel.nome, telefoneCliente: daniel.telefone,
      dataEvento: dataPassada(60), horarioInicio: '15:00', horarioFim: '19:00',
      enderecoCompleto: 'Rua Consolação, 555 - Consolação, São Paulo',
      valorTotal: '1600.00', status: 'realizado', statusPagamento: 'pago', origemCliente: 'site',
    },
    {
      nomeCliente: daniel.nome, telefoneCliente: daniel.telefone,
      dataEvento: dataPassada(15), horarioInicio: '10:00', horarioFim: '14:00',
      enderecoCompleto: 'Rua Oscar Freire, 900 - Jardins, São Paulo',
      valorTotal: '1520.00', status: 'realizado', statusPagamento: 'pago', origemCliente: 'site',
    },
  ]).returning({ id: eventos.id, nomeCliente: eventos.nomeCliente, telefoneCliente: eventos.telefoneCliente, valorTotal: eventos.valorTotal, status: eventos.status })

  console.log(`✅ ${eventosRows.length} eventos inseridos`)

  // Transações de cashback
  const PCT = 5
  const txs: { clienteId: string; eventoId?: string; tipo: string; valor: string; percentualAplicado?: string; descricao: string }[] = []

  // Ana — 2 créditos + 1 resgate parcial
  for (const ev of eventosRows.filter(e => e.telefoneCliente === ana.telefone && e.status === 'realizado')) {
    const val = parseFloat(ev.valorTotal ?? '0')
    const cb = parseFloat((val * PCT / 100).toFixed(2))
    txs.push({ clienteId: ana.id, eventoId: ev.id, tipo: 'credito', valor: cb.toFixed(2), percentualAplicado: PCT.toFixed(2), descricao: `Cashback ${PCT}% do evento de R$ ${val.toFixed(2)}` })
  }
  txs.push({ clienteId: ana.id, tipo: 'resgate', valor: '-50.00', descricao: 'Resgate — desconto aplicado na festa de 45 dias atrás' })

  // Bruno — 1 crédito
  for (const ev of eventosRows.filter(e => e.telefoneCliente === bruno.telefone && e.status === 'realizado')) {
    const val = parseFloat(ev.valorTotal ?? '0')
    const cb = parseFloat((val * PCT / 100).toFixed(2))
    txs.push({ clienteId: bruno.id, eventoId: ev.id, tipo: 'credito', valor: cb.toFixed(2), percentualAplicado: PCT.toFixed(2), descricao: `Cashback ${PCT}% do evento de R$ ${val.toFixed(2)}` })
  }

  // Carla — 2 créditos + resgate total
  for (const ev of eventosRows.filter(e => e.telefoneCliente === carla.telefone && e.status === 'realizado')) {
    const val = parseFloat(ev.valorTotal ?? '0')
    const cb = parseFloat((val * PCT / 100).toFixed(2))
    txs.push({ clienteId: carla.id, eventoId: ev.id, tipo: 'credito', valor: cb.toFixed(2), percentualAplicado: PCT.toFixed(2), descricao: `Cashback ${PCT}% do evento de R$ ${val.toFixed(2)}` })
  }
  txs.push({ clienteId: carla.id, tipo: 'resgate', valor: '-62.00', descricao: 'Resgate — desconto total aplicado no 2º evento' })

  // Daniel — 2 créditos (saldo intacto)
  for (const ev of eventosRows.filter(e => e.telefoneCliente === daniel.telefone && e.status === 'realizado')) {
    const val = parseFloat(ev.valorTotal ?? '0')
    const cb = parseFloat((val * PCT / 100).toFixed(2))
    txs.push({ clienteId: daniel.id, eventoId: ev.id, tipo: 'credito', valor: cb.toFixed(2), percentualAplicado: PCT.toFixed(2), descricao: `Cashback ${PCT}% do evento de R$ ${val.toFixed(2)}` })
  }

  await db.insert(cashbackTransacoes).values(txs.map(t => ({
    clienteId: t.clienteId, eventoId: t.eventoId, tipo: t.tipo,
    valor: t.valor, percentualAplicado: t.percentualAplicado, descricao: t.descricao,
  })))

  console.log(`✅ ${txs.length} transações de cashback inseridas`)
  console.log('\n📊 Clientes de demo:')
  console.log('─'.repeat(68))
  for (const c of CLIENTES_SEED) {
    const saldo = parseFloat(c.cashbackSaldo)
    const icon = saldo > 100 ? '🔥' : saldo > 0 ? '💰' : '○'
    const code = c.codigoAcesso
    console.log(`${icon}  ${c.nome.padEnd(26)} | ${c.telefone} | Saldo: R$ ${c.cashbackSaldo.padStart(6)} | ${code}`)
  }
  console.log('─'.repeat(68))
  console.log('\n🎉 Seed concluído!')
  process.exit(0)
}

main().catch(e => { console.error('❌ Erro:', e); process.exit(1) })
