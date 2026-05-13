/**
 * Seed de demonstração — dados realistas para apresentação
 * Execute com: npx tsx scripts/seed-demo.ts
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'
import { eq } from 'drizzle-orm'

const DATABASE_URL = process.env.DATABASE_URL!
if (!DATABASE_URL) throw new Error('DATABASE_URL não definida no ambiente')

const sql = neon(DATABASE_URL)
const db = drizzle(sql, { schema })

// ── helpers ──────────────────────────────────────────────────────────────────
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const between = (min: number, max: number) => Math.round(Math.random() * (max - min) + min)
const fmt2 = (n: number) => n.toFixed(2)
const dateStr = (d: Date) => d.toISOString().slice(0, 10)

const ORIGENS = ['Instagram', 'Indicação', 'Site Twix', 'Google', 'Indicação Tio Chico',
  'Campanha', 'Fazendo a Festa', 'Locador', 'Cerimonialista', 'Cliente Antigo', 'TikTok']
const REGIOES = ['Centro', 'Zona Sul', 'Zona Norte', 'Zona Leste', 'Zona Oeste', 'Urbanova',
  'Jd. Satélite', 'Jd. Aquarius', 'Vila Industrial', 'Bosque dos Eucaliptos']
const STATUS_PAGS = ['pago', 'pago', 'pago', 'pendente', 'parcial']
const FORMAS = ['pix', 'pix', 'pix', 'dinheiro', 'cartao']
const TIPOS_CLIENTE = ['fisica', 'empresa', 'cerimonialista', 'locador']
const BAIRROS_SJC = [
  'R. das Flores, 123, Jd. Esplanada', 'Av. Adhemar de Barros, 550, Centro',
  'R. Paraíba, 88, Vila Industrial', 'Estrada do Ypu, 200, Urbanova',
  'R. João Pessoa, 30, Jd. Satélite', 'Av. São João, 999, Jd. Aquarius',
  'R. das Palmeiras, 14, Bosque dos Eucaliptos', 'R. Tiradentes, 77, Centro',
  'Av. Cassiano R. de Campos, 600, Jd. Oriente', 'R. Espírito Santo, 45, Vila Adyana',
  'Av. Nelson DAvila, 2000, Jd. America', 'R. São Francisco, 130, Pq. Residencial Aquarius',
  'Av. Andrômeda, 350, Alphav. Residencial', 'R. Comendador Rolim, 11, Higienópolis',
]

const NOMES = [
  'Maria Silva', 'João Oliveira', 'Ana Costa', 'Pedro Santos', 'Lucia Ferreira',
  'Carlos Souza', 'Fernanda Lima', 'Roberto Alves', 'Patricia Gomes', 'Marcos Rocha',
  'Juliana Martins', 'André Pereira', 'Camila Ribeiro', 'Felipe Castro', 'Aline Cardoso',
  'Thiago Nascimento', 'Renata Dias', 'Bruno Mendes', 'Gabriela Torres', 'Ricardo Barros',
  'Beatriz Freitas', 'Leonardo Carvalho', 'Larissa Pinto', 'Diego Araújo', 'Nathalia Moura',
  'Gustavo Teixeira', 'Priscila Vieira', 'Rodrigo Correia', 'Vanessa Borges', 'Henrique Lopes',
  'Mariana Ramos', 'Eduardo Farias', 'Tatiana Cunha', 'Alexandre Costa', 'Cristiane Nunes',
  'Daniel Machado', 'Simone Azevedo', 'Lucas Fernandes', 'Isabela Melo', 'Fabrício Barbosa',
]
const TELEFONES = () => `119${between(6000, 9999)}${between(1000, 9999)}`

async function run() {
  console.log('🌱 Iniciando seed de demonstração…\n')

  // ── 1. Monitores ──────────────────────────────────────────────────────────
  console.log('👷 Inserindo monitores…')
  const monitoresData = [
    { nome: 'Danilo',    telefone: '11991110001', cpf: '111.111.111-01', pix: 'danilo@pix', valorDia: '180.00' },
    { nome: 'Xesus',    telefone: '11991110002', cpf: '111.111.111-02', pix: 'xesus@pix',  valorDia: '160.00' },
    { nome: 'Felipe',   telefone: '11991110003', cpf: '111.111.111-03', pix: 'felipe@pix', valorDia: '170.00' },
    { nome: 'João',     telefone: '11991110004', cpf: '111.111.111-04', pix: 'joao@pix',   valorDia: '160.00' },
    { nome: 'Eduardo',  telefone: '11991110005', cpf: '111.111.111-05', pix: 'edu@pix',    valorDia: '150.00' },
    { nome: 'Samuel',   telefone: '11991110006', cpf: '111.111.111-06', pix: 'samuel@pix', valorDia: '150.00' },
    { nome: 'Gabriel',  telefone: '11991110007', cpf: '111.111.111-07', pix: 'gabriel@pix',valorDia: '160.00' },
    { nome: 'Nazicolas',telefone: '11991110008', cpf: '111.111.111-08', pix: 'nazi@pix',   valorDia: '140.00' },
  ]
  const monitoresInseridos = await db.insert(schema.monitores)
    .values(monitoresData).onConflictDoNothing().returning()

  // buscar monitores existentes se o insert retornou vazio
  const monitores = monitoresInseridos.length
    ? monitoresInseridos
    : await db.select().from(schema.monitores)
  console.log(`  ✅ ${monitores.length} monitores`)

  // ── 2. Brinquedos (buscar IDs existentes) ────────────────────────────────
  const brinquedos = await db.select({ id: schema.brinquedos.id, nome: schema.brinquedos.nome })
    .from(schema.brinquedos)
  if (!brinquedos.length) throw new Error('Rode o seed principal antes (npm run db:seed)')
  console.log(`  ℹ  ${brinquedos.length} brinquedos encontrados`)

  // ── 3. Leads ──────────────────────────────────────────────────────────────
  console.log('👥 Inserindo leads/clientes…')
  const hoje = new Date()
  const leadsData = [
    // Novos recentes
    ...Array.from({ length: 8 }, (_, i) => ({
      nome: NOMES[i], telefone: TELEFONES(), email: `cliente${i}@email.com`,
      dataEvento: dateStr(new Date(hoje.getTime() + between(5, 30) * 86400000)),
      horarioEvento: `${between(10, 17)}:00`,
      enderecoEvento: pick(BAIRROS_SJC), regiaoEvento: pick(REGIOES),
      mensagem: 'Gostaria de um orçamento para festa infantil.',
      origem: pick(ORIGENS), status: 'novo', prioridade: pick(['normal', 'alta']),
      brinquedosInteresse: [pick(brinquedos).id, pick(brinquedos).id],
    })),
    // Em contato
    ...Array.from({ length: 7 }, (_, i) => ({
      nome: NOMES[8 + i], telefone: TELEFONES(), email: `contato${i}@email.com`,
      dataEvento: dateStr(new Date(hoje.getTime() + between(3, 20) * 86400000)),
      horarioEvento: `${between(10, 18)}:00`,
      enderecoEvento: pick(BAIRROS_SJC), regiaoEvento: pick(REGIOES),
      mensagem: 'Quero saber mais sobre preços e disponibilidade.',
      origem: pick(ORIGENS), status: 'contato', prioridade: 'normal',
      brinquedosInteresse: [pick(brinquedos).id],
    })),
    // Proposta enviada
    ...Array.from({ length: 5 }, (_, i) => ({
      nome: NOMES[15 + i], telefone: TELEFONES(),
      dataEvento: dateStr(new Date(hoje.getTime() + between(7, 25) * 86400000)),
      horarioEvento: `${between(10, 17)}:00`,
      enderecoEvento: pick(BAIRROS_SJC), regiaoEvento: pick(REGIOES),
      mensagem: 'Aguardando confirmação do orçamento.',
      origem: pick(ORIGENS), status: 'proposta', prioridade: 'alta',
      valorProposto: `${between(600, 2500)}.00`,
      brinquedosInteresse: [pick(brinquedos).id, pick(brinquedos).id, pick(brinquedos).id],
    })),
    // Confirmados
    ...Array.from({ length: 4 }, (_, i) => ({
      nome: NOMES[20 + i], telefone: TELEFONES(),
      dataEvento: dateStr(new Date(hoje.getTime() + between(1, 10) * 86400000)),
      horarioEvento: `${between(10, 17)}:00`,
      enderecoEvento: pick(BAIRROS_SJC), regiaoEvento: pick(REGIOES),
      mensagem: 'Confirmado!', origem: pick(ORIGENS), status: 'confirmado', prioridade: 'alta',
      valorProposto: `${between(800, 3000)}.00`,
      valorSinal: `${between(200, 800)}.00`,
      brinquedosInteresse: [pick(brinquedos).id, pick(brinquedos).id],
    })),
    // Perdidos
    ...Array.from({ length: 4 }, (_, i) => ({
      nome: NOMES[24 + i], telefone: TELEFONES(),
      dataEvento: dateStr(new Date(hoje.getTime() - between(5, 30) * 86400000)),
      horarioEvento: '14:00', enderecoEvento: pick(BAIRROS_SJC), regiaoEvento: pick(REGIOES),
      mensagem: '', origem: pick(ORIGENS), status: 'perdido',
      motivoPerda: pick(['Preço alto', 'Não respondeu mais', 'Escolheu concorrente', 'Evento cancelado']),
      prioridade: 'normal',
      brinquedosInteresse: [pick(brinquedos).id],
    })),
  ]
  const leadsInseridos = await db.insert(schema.leads).values(leadsData as typeof schema.leads.$inferInsert[]).returning()
  console.log(`  ✅ ${leadsInseridos.length} leads`)

  // ── 4. Eventos (Jan–Mai 2026) ─────────────────────────────────────────────
  console.log('🎪 Inserindo eventos com dados financeiros…')

  // Definir eventos mês a mês baseado no Excel
  type EventoSpec = {
    mes: number; dia: number; nome: string; valor: number; frete: number
    monitoresQtd: number; custoMonitor: number; origem: string; tipo: string
    brinquedosQtd: number; status: string; statusPag: string
  }

  const eventosSpec: EventoSpec[] = [
    // JANEIRO
    { mes: 1, dia: 6,  nome: NOMES[0],  valor: 4200, frete: 150, monitoresQtd: 2, custoMonitor: 360, origem: 'Instagram',       tipo: 'fisica',        brinquedosQtd: 5, status: 'realizado', statusPag: 'pago' },
    { mes: 1, dia: 12, nome: NOMES[1],  valor: 5800, frete: 200, monitoresQtd: 3, custoMonitor: 480, origem: 'Indicação',       tipo: 'empresa',       brinquedosQtd: 7, status: 'realizado', statusPag: 'pago' },
    { mes: 1, dia: 13, nome: NOMES[2],  valor: 3500, frete: 100, monitoresQtd: 2, custoMonitor: 320, origem: 'Site Twix',       tipo: 'fisica',        brinquedosQtd: 4, status: 'realizado', statusPag: 'pago' },
    { mes: 1, dia: 19, nome: NOMES[3],  valor: 6500, frete: 250, monitoresQtd: 3, custoMonitor: 480, origem: 'Google',         tipo: 'cerimonialista', brinquedosQtd: 8, status: 'realizado', statusPag: 'pago' },
    { mes: 1, dia: 20, nome: NOMES[4],  valor: 4800, frete: 180, monitoresQtd: 2, custoMonitor: 360, origem: 'Instagram',       tipo: 'fisica',        brinquedosQtd: 6, status: 'realizado', statusPag: 'pago' },
    { mes: 1, dia: 25, nome: NOMES[5],  valor: 3900, frete: 120, monitoresQtd: 2, custoMonitor: 320, origem: 'Campanha',        tipo: 'empresa',       brinquedosQtd: 5, status: 'realizado', statusPag: 'pago' },
    { mes: 1, dia: 26, nome: NOMES[6],  valor: 4118, frete: 100, monitoresQtd: 2, custoMonitor: 360, origem: 'Indicação Tio Chico', tipo: 'fisica',   brinquedosQtd: 6, status: 'realizado', statusPag: 'pago' },
    { mes: 1, dia: 27, nome: NOMES[7],  valor: 2500, frete: 80,  monitoresQtd: 1, custoMonitor: 180, origem: 'TikTok',         tipo: 'fisica',        brinquedosQtd: 3, status: 'realizado', statusPag: 'pago' },

    // FEVEREIRO
    { mes: 2, dia: 1,  nome: NOMES[8],  valor: 1200, frete: 80,  monitoresQtd: 1, custoMonitor: 160, origem: 'Instagram',       tipo: 'fisica',        brinquedosQtd: 2, status: 'realizado', statusPag: 'pago' },
    { mes: 2, dia: 2,  nome: NOMES[9],  valor: 1500, frete: 80,  monitoresQtd: 1, custoMonitor: 160, origem: 'Google',          tipo: 'fisica',        brinquedosQtd: 2, status: 'realizado', statusPag: 'pago' },
    { mes: 2, dia: 8,  nome: NOMES[10], valor: 1800, frete: 100, monitoresQtd: 1, custoMonitor: 170, origem: 'Site Twix',       tipo: 'empresa',       brinquedosQtd: 2, status: 'realizado', statusPag: 'pago' },
    { mes: 2, dia: 9,  nome: NOMES[11], valor: 2200, frete: 120, monitoresQtd: 2, custoMonitor: 320, origem: 'Indicação',       tipo: 'fisica',        brinquedosQtd: 3, status: 'realizado', statusPag: 'pago' },
    { mes: 2, dia: 14, nome: NOMES[12], valor: 2800, frete: 100, monitoresQtd: 2, custoMonitor: 320, origem: 'Campanha',        tipo: 'cerimonialista', brinquedosQtd: 4, status: 'realizado', statusPag: 'pago' },
    { mes: 2, dia: 15, nome: NOMES[13], valor: 1600, frete: 80,  monitoresQtd: 1, custoMonitor: 160, origem: 'Instagram',       tipo: 'fisica',        brinquedosQtd: 2, status: 'realizado', statusPag: 'pago' },
    { mes: 2, dia: 22, nome: NOMES[14], valor: 3200, frete: 150, monitoresQtd: 2, custoMonitor: 340, origem: 'Google',          tipo: 'empresa',       brinquedosQtd: 4, status: 'realizado', statusPag: 'pago' },
    { mes: 2, dia: 23, nome: NOMES[15], valor: 1900, frete: 100, monitoresQtd: 1, custoMonitor: 180, origem: 'Locador',         tipo: 'locador',       brinquedosQtd: 2, status: 'realizado', statusPag: 'pago' },

    // MARÇO
    { mes: 3, dia: 1,  nome: NOMES[16], valor: 1400, frete: 80,  monitoresQtd: 1, custoMonitor: 160, origem: 'Instagram',       tipo: 'fisica',        brinquedosQtd: 2, status: 'realizado', statusPag: 'pago' },
    { mes: 3, dia: 7,  nome: NOMES[17], valor: 2500, frete: 100, monitoresQtd: 2, custoMonitor: 320, origem: 'Google',          tipo: 'empresa',       brinquedosQtd: 3, status: 'realizado', statusPag: 'pago' },
    { mes: 3, dia: 8,  nome: NOMES[18], valor: 3800, frete: 180, monitoresQtd: 2, custoMonitor: 360, origem: 'Site Twix',       tipo: 'fisica',        brinquedosQtd: 5, status: 'realizado', statusPag: 'pago' },
    { mes: 3, dia: 14, nome: NOMES[19], valor: 4200, frete: 200, monitoresQtd: 3, custoMonitor: 480, origem: 'Campanha',        tipo: 'cerimonialista', brinquedosQtd: 6, status: 'realizado', statusPag: 'pago' },
    { mes: 3, dia: 15, nome: NOMES[20], valor: 2900, frete: 120, monitoresQtd: 2, custoMonitor: 320, origem: 'Indicação',       tipo: 'fisica',        brinquedosQtd: 4, status: 'realizado', statusPag: 'pago' },
    { mes: 3, dia: 21, nome: NOMES[21], valor: 5500, frete: 250, monitoresQtd: 3, custoMonitor: 510, origem: 'Instagram',       tipo: 'empresa',       brinquedosQtd: 7, status: 'realizado', statusPag: 'pago' },
    { mes: 3, dia: 22, nome: NOMES[22], valor: 3300, frete: 150, monitoresQtd: 2, custoMonitor: 340, origem: 'Google',          tipo: 'fisica',        brinquedosQtd: 4, status: 'realizado', statusPag: 'pago' },
    { mes: 3, dia: 28, nome: NOMES[23], valor: 4800, frete: 200, monitoresQtd: 3, custoMonitor: 480, origem: 'TikTok',          tipo: 'empresa',       brinquedosQtd: 6, status: 'realizado', statusPag: 'pago' },
    { mes: 3, dia: 29, nome: NOMES[24], valor: 6200, frete: 300, monitoresQtd: 4, custoMonitor: 680, origem: 'Cerimonialista',  tipo: 'cerimonialista', brinquedosQtd: 8, status: 'realizado', statusPag: 'pago' },

    // ABRIL
    { mes: 4, dia: 4,  nome: NOMES[25], valor: 1600, frete: 80,  monitoresQtd: 1, custoMonitor: 160, origem: 'Instagram',       tipo: 'fisica',        brinquedosQtd: 2, status: 'realizado', statusPag: 'pago' },
    { mes: 4, dia: 5,  nome: NOMES[26], valor: 2100, frete: 100, monitoresQtd: 2, custoMonitor: 320, origem: 'Site Twix',       tipo: 'empresa',       brinquedosQtd: 3, status: 'realizado', statusPag: 'pago' },
    { mes: 4, dia: 11, nome: NOMES[27], valor: 2700, frete: 120, monitoresQtd: 2, custoMonitor: 340, origem: 'Indicação',       tipo: 'fisica',        brinquedosQtd: 3, status: 'realizado', statusPag: 'pago' },
    { mes: 4, dia: 12, nome: NOMES[28], valor: 1900, frete: 80,  monitoresQtd: 1, custoMonitor: 180, origem: 'Google',          tipo: 'fisica',        brinquedosQtd: 2, status: 'realizado', statusPag: 'pago' },
    { mes: 4, dia: 19, nome: NOMES[29], valor: 3500, frete: 150, monitoresQtd: 2, custoMonitor: 360, origem: 'Campanha',        tipo: 'cerimonialista', brinquedosQtd: 4, status: 'realizado', statusPag: 'pago' },
    { mes: 4, dia: 25, nome: NOMES[30], valor: 2200, frete: 100, monitoresQtd: 2, custoMonitor: 320, origem: 'Instagram',       tipo: 'fisica',        brinquedosQtd: 3, status: 'realizado', statusPag: 'pago' },
    { mes: 4, dia: 26, nome: NOMES[31], valor: 3127, frete: 120, monitoresQtd: 2, custoMonitor: 340, origem: 'Locador',         tipo: 'locador',       brinquedosQtd: 4, status: 'realizado', statusPag: 'pago' },

    // MAIO
    { mes: 5, dia: 3,  nome: NOMES[32], valor: 1800, frete: 80,  monitoresQtd: 1, custoMonitor: 170, origem: 'Instagram',       tipo: 'fisica',        brinquedosQtd: 2, status: 'realizado', statusPag: 'pago' },
    { mes: 5, dia: 4,  nome: NOMES[33], valor: 2400, frete: 100, monitoresQtd: 2, custoMonitor: 320, origem: 'Google',          tipo: 'empresa',       brinquedosQtd: 3, status: 'realizado', statusPag: 'pago' },
    { mes: 5, dia: 10, nome: NOMES[34], valor: 3100, frete: 150, monitoresQtd: 2, custoMonitor: 360, origem: 'Site Twix',       tipo: 'fisica',        brinquedosQtd: 4, status: 'realizado', statusPag: 'pago' },
    { mes: 5, dia: 11, nome: NOMES[35], valor: 4500, frete: 200, monitoresQtd: 3, custoMonitor: 480, origem: 'Campanha',        tipo: 'cerimonialista', brinquedosQtd: 6, status: 'realizado', statusPag: 'pago' },
    { mes: 5, dia: 17, nome: NOMES[36], valor: 2800, frete: 120, monitoresQtd: 2, custoMonitor: 340, origem: 'TikTok',          tipo: 'fisica',        brinquedosQtd: 3, status: 'realizado', statusPag: 'pago' },
    { mes: 5, dia: 18, nome: NOMES[37], valor: 3600, frete: 150, monitoresQtd: 2, custoMonitor: 360, origem: 'Indicação',       tipo: 'empresa',       brinquedosQtd: 5, status: 'realizado', statusPag: 'pago' },
    { mes: 5, dia: 24, nome: NOMES[38], valor: 2900, frete: 120, monitoresQtd: 2, custoMonitor: 320, origem: 'Instagram',       tipo: 'fisica',        brinquedosQtd: 4, status: 'realizado', statusPag: 'pago' },

    // JUNHO — eventos futuros confirmados
    { mes: 6, dia: 1,  nome: NOMES[39], valor: 3200, frete: 150, monitoresQtd: 2, custoMonitor: 360, origem: 'Google',          tipo: 'fisica',        brinquedosQtd: 4, status: 'confirmado', statusPag: 'parcial' },
    { mes: 6, dia: 7,  nome: NOMES[0],  valor: 5500, frete: 250, monitoresQtd: 3, custoMonitor: 510, origem: 'Instagram',       tipo: 'empresa',       brinquedosQtd: 7, status: 'confirmado', statusPag: 'parcial' },
    { mes: 6, dia: 8,  nome: NOMES[1],  valor: 2800, frete: 120, monitoresQtd: 2, custoMonitor: 320, origem: 'Indicação',       tipo: 'fisica',        brinquedosQtd: 3, status: 'confirmado', statusPag: 'pendente' },
    { mes: 6, dia: 14, nome: NOMES[2],  valor: 4100, frete: 180, monitoresQtd: 2, custoMonitor: 360, origem: 'Site Twix',       tipo: 'cerimonialista', brinquedosQtd: 5, status: 'confirmado', statusPag: 'parcial' },
    { mes: 6, dia: 15, nome: NOMES[3],  valor: 6800, frete: 300, monitoresQtd: 4, custoMonitor: 640, origem: 'Cerimonialista',  tipo: 'empresa',       brinquedosQtd: 8, status: 'confirmado', statusPag: 'parcial' },
    { mes: 6, dia: 20, nome: 'Maria Silva', valor: 800, frete: 0, monitoresQtd: 1, custoMonitor: 180, origem: 'Instagram', tipo: 'fisica', brinquedosQtd: 1, status: 'confirmado', statusPag: 'pago' },
    { mes: 6, dia: 21, nome: NOMES[5],  valor: 3900, frete: 150, monitoresQtd: 2, custoMonitor: 340, origem: 'Campanha',        tipo: 'fisica',        brinquedosQtd: 5, status: 'orcamento', statusPag: 'pendente' },
    { mes: 6, dia: 28, nome: NOMES[6],  valor: 4700, frete: 200, monitoresQtd: 3, custoMonitor: 480, origem: 'TikTok',          tipo: 'empresa',       brinquedosQtd: 6, status: 'orcamento', statusPag: 'pendente' },
  ]

  let eventosInseridos = 0
  let pagamentosInseridos = 0
  let emJuncs = 0

  for (const spec of eventosSpec) {
    const ano = 2026
    const data = `${ano}-${String(spec.mes).padStart(2, '0')}-${String(spec.dia).padStart(2, '0')}`
    const horario = `${pick(['10', '11', '13', '14', '15', '16'])}:00`

    // Selecionar brinquedos aleatórios (sem duplicatas)
    const shuffled = [...brinquedos].sort(() => Math.random() - 0.5)
    const selecionados = shuffled.slice(0, Math.min(spec.brinquedosQtd, brinquedos.length))
    const brinquedoIds = selecionados.map(b => b.id)

    const valorTotal = spec.valor
    const custoMonitores = spec.monitoresQtd * spec.custoMonitor / spec.monitoresQtd
    const custoTransporte = spec.frete
    const custoTotal = custoMonitores * spec.monitoresQtd + custoTransporte
    const entrada = spec.statusPag === 'pago' ? valorTotal : spec.statusPag === 'parcial' ? Math.round(valorTotal * 0.4) : 0
    const restante = valorTotal - entrada

    const [evento] = await db.insert(schema.eventos).values({
      nomeCliente: spec.nome,
      telefoneCliente: TELEFONES(),
      emailCliente: `${spec.nome.toLowerCase().replace(' ', '.')}@email.com`,
      dataEvento: data,
      horarioInicio: horario,
      horarioFim: `${parseInt(horario) + 4}:00`,
      enderecoCompleto: pick(BAIRROS_SJC),
      regiaoEvento: pick(REGIOES),
      brinquedosContratados: brinquedoIds,
      valorTotal: fmt2(valorTotal),
      valorEntrada: fmt2(entrada),
      valorRestante: fmt2(restante),
      formaPagamento: pick(FORMAS),
      statusPagamento: spec.statusPag,
      custoMonitores: fmt2(custoMonitores * spec.monitoresQtd),
      custoTransporte: fmt2(custoTransporte),
      custosExtras: '0.00',
      status: spec.status,
      observacoes: null,
    } as typeof schema.eventos.$inferInsert).returning()

    eventosInseridos++

    // Monitores do evento
    const mQtd = Math.min(spec.monitoresQtd, monitores.length)
    const monsSelecionados = [...monitores].sort(() => Math.random() - 0.5).slice(0, mQtd)
    for (const m of monsSelecionados) {
      await db.insert(schema.eventoMonitores).values({
        eventoId: evento.id,
        monitorId: m.id,
        valorPago: fmt2(Number(m.valorDia)),
        confirmado: spec.status === 'realizado',
      }).onConflictDoNothing()
      emJuncs++
    }

    // Pagamentos
    if (entrada > 0) {
      await db.insert(schema.pagamentos).values({
        eventoId: evento.id,
        descricao: 'Sinal / entrada',
        valor: fmt2(entrada),
        tipo: 'receita',
        forma: pick(FORMAS),
        status: 'recebido',
        dataPrevista: data,
        dataRecebido: data,
      }).onConflictDoNothing()
      pagamentosInseridos++
    }
    if (restante > 0) {
      await db.insert(schema.pagamentos).values({
        eventoId: evento.id,
        descricao: 'Restante do evento',
        valor: fmt2(restante),
        tipo: 'receita',
        forma: pick(FORMAS),
        status: spec.statusPag === 'pago' ? 'recebido' : 'pendente',
        dataPrevista: data,
        dataRecebido: spec.statusPag === 'pago' ? data : null,
      }).onConflictDoNothing()
      pagamentosInseridos++
    }
  }

  console.log(`  ✅ ${eventosInseridos} eventos`)
  console.log(`  ✅ ${emJuncs} alocações de monitores`)
  console.log(`  ✅ ${pagamentosInseridos} registros de pagamento`)

  // ── 5. Interações nos leads ───────────────────────────────────────────────
  console.log('💬 Inserindo interações nos leads…')
  let interacoesCount = 0
  for (const lead of leadsInseridos.slice(0, 15)) {
    const msgs = [
      { tipo: 'whatsapp', conteudo: 'Primeiro contato via WhatsApp — cliente perguntou sobre preços.' },
      { tipo: 'nota',     conteudo: 'Enviou proposta com 3 brinquedos para a data solicitada.' },
      { tipo: 'whatsapp', conteudo: 'Cliente respondeu positivamente, pediu prazo para confirmar.' },
    ]
    for (const msg of msgs.slice(0, between(1, 3))) {
      await db.insert(schema.interacoes).values({
        leadId: lead.id,
        tipo: msg.tipo,
        conteudo: msg.conteudo,
        statusAnterior: 'novo',
        statusNovo: lead.status,
      })
      interacoesCount++
    }
  }
  console.log(`  ✅ ${interacoesCount} interações`)

  // ── 6. Configurações extras ───────────────────────────────────────────────
  console.log('⚙️  Atualizando configurações…')
  const configs = [
    { chave: 'site_nome',         valor: 'Twix Eventos' },
    { chave: 'site_telefone',     valor: '5512996498725' },
    { chave: 'site_descricao',    valor: 'Locação de brinquedos infláveis e eletrônicos para festas em São José dos Campos. Mais de 455 avaliações 5 estrelas!' },
    { chave: 'site_endereco',     valor: 'R. Prof. Roberval Fróes, 390 – 143C, SJC/SP' },
    { chave: 'whatsapp_numero',   valor: '5512996498725' },
    { chave: 'whatsapp_mensagem_padrao', valor: 'Olá! Gostaria de fazer um orçamento de brinquedos para meu evento 🎉' },
    { chave: 'whatsapp_ativo',    valor: 'true' },
    { chave: 'banner_ativo',      valor: 'true' },
    { chave: 'banner_texto',      valor: 'Descontos especiais de segunda a quinta! Reserve agora e garanta sua data →' },
    { chave: 'desconto_seg_qui',  valor: 'true' },
    { chave: 'robots_indexar',    valor: 'true' },
    { chave: 'sla_followup_horas',       valor: '48' },
    { chave: 'eventos_antecedencia_dias', valor: '7' },
    { chave: 'max_brinquedos_orcamento', valor: '10' },
    { chave: 'social_instagram',  valor: 'https://instagram.com/twixeventos' },
    { chave: 'social_youtube',    valor: 'https://youtube.com/@twixeventos' },
    { chave: 'social_tiktok',     valor: 'https://tiktok.com/@twixeventos' },
  ]
  for (const c of configs) {
    await db.insert(schema.configuracoes).values({ chave: c.chave, valor: c.valor })
      .onConflictDoUpdate({ target: schema.configuracoes.chave, set: { valor: c.valor } })
  }
  console.log(`  ✅ ${configs.length} configurações`)

  // ── Resumo ────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed de demonstração concluído!')
  console.log('─────────────────────────────────────')
  console.log(`  Monitores:   ${monitores.length}`)
  console.log(`  Leads:       ${leadsInseridos.length}`)
  console.log(`  Eventos:     ${eventosInseridos}`)
  console.log(`  Pagamentos:  ${pagamentosInseridos}`)
  console.log(`  Interações:  ${interacoesCount}`)

  const receitaTotal = eventosSpec.reduce((s, e) => s + e.valor, 0)
  console.log(`\n  Receita total simulada: R$ ${receitaTotal.toLocaleString('pt-BR')}`)
}

run().catch(e => { console.error(e); process.exit(1) })
