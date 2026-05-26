import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getKpisMes, getRankingBrinquedosMes, getOrigemClientesMes, getEventosMes } from '@/lib/db/queries/financeiro'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const mes = parseInt(req.nextUrl.searchParams.get('mes') ?? '1')
  const ano = parseInt(req.nextUrl.searchParams.get('ano') ?? String(new Date().getFullYear()))

  const [kpis, eventos, ranking, origens] = await Promise.all([
    getKpisMes(mes, ano),
    getEventosMes(mes, ano),
    getRankingBrinquedosMes(mes, ano),
    getOrigemClientesMes(mes, ano),
  ])

  return NextResponse.json({ kpis, eventos, ranking, origens })
}
