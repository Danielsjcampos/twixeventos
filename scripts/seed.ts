import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'

const DATABASE_URL = 'postgresql://neondb_owner:npg_aM10bQZrcwoi@ep-misty-lab-acmq6rff.sa-east-1.aws.neon.tech/neondb?sslmode=require'

const sql = neon(DATABASE_URL)
const db = drizzle(sql, { schema })

async function seed() {
  console.log('🌱 Inserindo dados iniciais...')

  // Configurações
  await db.insert(schema.configuracoes).values([
    { chave: 'whatsapp_numero', valor: '5512996498725', descricao: 'Número WhatsApp sem formatação' },
    { chave: 'whatsapp_mensagem_padrao', valor: 'Olá! Estou no site e gostaria de mais informações', descricao: 'Mensagem padrão WhatsApp' },
    { chave: 'sla_followup_horas', valor: '48', descricao: 'Horas para alertar lead sem interação' },
    { chave: 'desconto_seg_qui', valor: 'true', descricao: 'Exibir banner de desconto segunda a quinta' },
  ]).onConflictDoNothing()
  console.log('✅ Configurações inseridas')

  // Admin user (senha: twix@2025)
  await db.insert(schema.adminUsers).values([{
    email: 'admin@twixeventos.com',
    passwordHash: '$2b$12$y0pQfLCBXevVJHI.ThE2jup0cP0ouWs.nPXwEk1Skn0onk6t8QzVS',
    nome: 'Admin Twix',
  }]).onConflictDoNothing()
  console.log('✅ Usuário admin inserido')

  // Brinquedos
  await db.insert(schema.brinquedos).values([
    { nome: 'Futebol de Sabão', slug: 'futebol-de-sabao', categoria: 'inflaveis', faixaEtaria: 'Livre para todas as idades', capacidade: 'Até 4 adultos ou 8 crianças', dimensoes: '5m largura × 10m comprimento', energia: '110v ou 220v', destaque: true, ordemDestaque: 1, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2023/03/Sem-titulo-1.png' },
    { nome: 'Canhão de Espuma', slug: 'canhao-de-espuma', categoria: 'batalhas', faixaEtaria: 'Livre para todas as idades', capacidade: 'Variado', dimensoes: '2m largura × 1,5m comprimento', energia: '220v', destaque: true, ordemDestaque: 2, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2023/03/IMG_2562-scaled.jpeg' },
    { nome: 'Tobogã Inflável', slug: 'toboga-inflavel', categoria: 'inflaveis', faixaEtaria: 'Até 10 anos', capacidade: 'Até 2 crianças', dimensoes: '3m largura × 5m comprimento × 4m altura', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2023/03/IMG_3347-scaled.jpeg' },
    { nome: 'Giro Radical', slug: 'giro-radical', categoria: 'radicais', faixaEtaria: 'Livre para todas as idades', capacidade: '4 pessoas', dimensoes: '6m de circunferência', energia: '220v', destaque: true, ordemDestaque: 3, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2024/10/giro-radical-twixeventos-3-scaled.jpg' },
    { nome: 'Toboágua', slug: 'toboagua', categoria: 'aquaticos', faixaEtaria: 'Até 15 anos', capacidade: '1 pessoa', dimensoes: '4,2m altura × 5m comprimento × 3m largura', energia: '220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2024/03/aluguel-de-toboagua-inflavel-Image-2024-03-01-at-10.10.01.jpg' },
    { nome: 'Óculos VR', slug: 'oculos-vr', categoria: 'radicais', faixaEtaria: 'Livre para todas as idades', capacidade: '1 pessoa', dimensoes: '2,5m largura × 2,5m comprimento', energia: '110v ou 220v', destaque: true, ordemDestaque: 4, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2023/03/oculos-realidade-virtual.jpg' },
    { nome: 'WaterBall', slug: 'waterball', categoria: 'aquaticos', faixaEtaria: 'Livre para todas as idades', capacidade: '1 pessoa', dimensoes: '2m de circunferência', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2023/03/waterball.png' },
    { nome: 'Touro Mecânico', slug: 'touro-mecanico', categoria: 'radicais', faixaEtaria: 'Livre para todas as idades', capacidade: '1 pessoa', dimensoes: '4,2m largura × 4,2m comprimento', energia: '220v', destaque: true, ordemDestaque: 5, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2023/05/aliguel-de-touro-Mecanico.jpg' },
    { nome: 'Mini Tobogã', slug: 'mini-toboga', categoria: 'inflaveis', faixaEtaria: 'Até 7 anos', capacidade: '2 crianças', dimensoes: '2,5m largura × 3m comprimento × 3m altura', energia: '220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2023/03/mini-toboga.jpg' },
    { nome: 'Cama Elástica', slug: 'cama-elastica', categoria: 'inflaveis', faixaEtaria: 'Consultar tamanhos', capacidade: '2 a 3 crianças', dimensoes: 'Modelos de 2 ou 3 metros', energia: 'Não precisa de energia', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2023/03/cama-elastica.jpg' },
    { nome: 'Guerra de Cotonete', slug: 'guerra-de-cotonete', categoria: 'batalhas', faixaEtaria: 'Livre para todas as idades', capacidade: '2 pessoas', dimensoes: '5m largura × 5m comprimento', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2024/10/1602589231129.jpeg' },
    { nome: 'Piscina de Bolinhas Tradicional', slug: 'piscina-de-bolinhas-tradicional', categoria: 'inflaveis', faixaEtaria: 'Até 7 anos', capacidade: '3 a 4 crianças', dimensoes: '1,5m × 1,5m', energia: 'Não precisa de energia', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2023/03/piscina-de-bolinhas.jpg' },
    { nome: 'Toboshark Tradicional', slug: 'toboshark-tradicional', categoria: 'toboshark', faixaEtaria: 'Todas as idades', capacidade: '2 pessoas', dimensoes: '10m comprimento × 7m altura × 4,2m largura', energia: '110v ou 220v', destaque: true, ordemDestaque: 6, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2024/11/Toboshark-Tradicional-sjc-2-Photoroom.jpg' },
    { nome: 'T-Rex 3 em 1', slug: 't-rex-3-em-1', categoria: 'tematicos', faixaEtaria: 'Até 10 anos', capacidade: '4 crianças', dimensoes: '8m comprimento × 4,5m largura × 6m altura', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2024/10/Imagem-do-WhatsApp-de-2024-10-23-as-10.21.36_79c0dc12.jpg' },
    { nome: 'Barco Pirata', slug: 'barco-pirata', categoria: 'inflaveis', faixaEtaria: 'Até 7 anos', capacidade: '3 a 4 crianças', dimensoes: '3m altura × 3,5m largura × 5,8m comprimento', energia: '220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2024/10/barco-pirata-3-1.jpeg.webp' },
    { nome: 'Toboshark Acqua', slug: 'toboshark-acqua', categoria: 'toboshark', faixaEtaria: 'Todas as idades', capacidade: '2 pessoas', dimensoes: '8m comprimento × 7m altura × 4,2m largura', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2024/11/aluguel-toboshark-acqua.jpg' },
    { nome: 'Super Toboshark Slide', slug: 'super-toboshark-slide', categoria: 'toboshark', faixaEtaria: 'Todas as idades', capacidade: '2 pessoas', dimensoes: '4,2m largura × 7m altura × 17m comprimento', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2024/11/Aluguel-Super-Toboshark-Slide-1.jpg' },
    { nome: 'Slide Radical', slug: 'slide-radical', categoria: 'toboshark', faixaEtaria: 'Todas as idades', capacidade: '2 pessoas', dimensoes: '9m comprimento × 3,2m altura × 3m largura', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2025/03/Twix-Eventos-Slide-Radical-3.png' },
    { nome: 'Jardim Encantado', slug: 'jardim-encantado', categoria: 'tematicos', faixaEtaria: 'Todas as idades', capacidade: '3 pessoas', dimensoes: '7,5m × 4m × 3,5m altura', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2025/09/jd-encantado-1.jpeg' },
    { nome: 'Fundo do Mar 2 em 1', slug: 'fundo-do-mar-2-em-1', categoria: 'tematicos', faixaEtaria: 'Todas as idades', capacidade: '2 pessoas', dimensoes: '4,5m × 4,5m × 4,5m altura', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2025/09/fundo-do-mar-5.jpeg' },
    { nome: 'Escalada Tropical', slug: 'escalada-tropical', categoria: 'radicais', faixaEtaria: 'Todas as idades', capacidade: '1 pessoa', dimensoes: '4,5m × 4,5m × 4,5m altura', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2025/09/escalada-tropical.png' },
    { nome: 'Piscina de Bolinhas Inflável', slug: 'piscina-de-bolinhas-inflavel', categoria: 'inflaveis', faixaEtaria: 'Crianças', capacidade: '3 crianças', dimensoes: '2 metros', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2024/10/piscina-inflavel.jpeg.webp' },
    { nome: 'Cotonetes UFC', slug: 'cotonetes-ufc', categoria: 'batalhas', faixaEtaria: 'Todas as idades', capacidade: '2 pessoas', dimensoes: '5,6m × 5,6m × 1,8m altura', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2024/10/esportivos-guerra-cotonete-UFC.jpg' },
    { nome: 'Cotonete Street', slug: 'cotonete-street', categoria: 'batalhas', faixaEtaria: 'Todas as idades', capacidade: '2 pessoas', dimensoes: '5,6m × 5,6m × 1,8m altura', energia: '110v ou 220v', destaque: false, ordemDestaque: 0, fotoDestaque: 'https://twixeventos.com/wp-content/uploads/2025/09/cotonete-1.jpeg' },
  ]).onConflictDoNothing()
  console.log('✅ 24 brinquedos inseridos')

  console.log('\n🎉 Seed concluído!')
}

seed().catch(e => { console.error(e); process.exit(1) })
