import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getAllLeads, getLeadsKanban } from '@/lib/db/queries/leads'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const kanban = searchParams.get('kanban') === 'true'

  const leads = kanban ? await getLeadsKanban() : await getAllLeads()
  return NextResponse.json(leads)
}
