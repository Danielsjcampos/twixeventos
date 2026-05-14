import { NextRequest, NextResponse } from 'next/server'
import { getClientePorCodigo, getGirosDisponiveis, registrarGiro, creditarPremioRoleta } from '@/lib/db/queries/area-cliente'
import { getConfig } from '@/lib/db/queries/configuracoes'

interface Premio {
  id: string; nome: string; descricao: string; cor: string; peso: number
  valorCredito?: number
  percentual?: number
  tipo?: 'fixo' | 'percentual'
}
interface Params  { params: Promise<{ codigo: string }> }

function pickWeightedRandom(premios: Premio[]): Premio {
  const totalPeso = premios.reduce((s, p) => s + (p.peso ?? 1), 0)
  let rand = Math.random() * totalPeso
  for (const p of premios) {
    rand -= p.peso ?? 1
    if (rand <= 0) return p
  }
  return premios[premios.length - 1]
}

export async function POST(req: NextRequest, { params }: Params) {
  const { codigo } = await params

  const [ativaConf, premiosConf] = await Promise.all([
    getConfig('roleta_ativa'),
    getConfig('roleta_premios'),
  ])

  if (ativaConf !== 'true') {
    return NextResponse.json({ error: 'Roleta desativada' }, { status: 400 })
  }

  const cliente = await getClientePorCodigo(codigo.toUpperCase())
  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const girosDisponiveis = await getGirosDisponiveis(cliente.id)
  if (girosDisponiveis <= 0) {
    return NextResponse.json({ error: 'Sem giros disponíveis' }, { status: 400 })
  }

  let premios: Premio[] = []
  try { premios = JSON.parse(premiosConf ?? '[]') } catch { /* usa array vazio */ }
  if (!premios.length) {
    return NextResponse.json({ error: 'Nenhum prêmio configurado' }, { status: 400 })
  }

  const premio = pickWeightedRandom(premios)
  const giro   = await registrarGiro(cliente.id, premio)

  // Calcular valor a creditar
  let valorParaCreditar = 0
  if ((premio.tipo ?? 'fixo') === 'percentual' && (premio.percentual ?? 0) > 0) {
    // X% do cashback total do cliente
    const cashbackTotal = parseFloat(String(cliente.cashbackTotal ?? '0'))
    valorParaCreditar = parseFloat((cashbackTotal * (premio.percentual! / 100)).toFixed(2))
  } else {
    valorParaCreditar = Number(premio.valorCredito ?? 0)
  }

  let creditado: { valorCreditado: number; descricao: string } | null = null
  if (valorParaCreditar > 0) {
    creditado = await creditarPremioRoleta(cliente.id, valorParaCreditar, premio.nome)
  }

  return NextResponse.json({ premio, giroId: giro.id, creditado, valorCreditado: valorParaCreditar })
}

export async function GET(req: NextRequest, { params }: Params) {
  const { codigo } = await params
  const cliente = await getClientePorCodigo(codigo.toUpperCase())
  if (!cliente) return NextResponse.json({ girosDisponiveis: 0 })
  const girosDisponiveis = await getGirosDisponiveis(cliente.id)
  return NextResponse.json({ girosDisponiveis })
}
