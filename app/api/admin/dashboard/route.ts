import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getDashboardMetrics } from '@/lib/db/queries/dashboard'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const metrics = await getDashboardMetrics()
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('[GET /api/admin/dashboard]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
