import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getLeadById, updateLead, updateLeadStatus, deleteLead, addInteracao } from '@/lib/db/queries/leads'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const lead = await getLeadById(id)
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(lead)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const body = await request.json()
    const { status, statusAnterior, motivoPerda, ...rest } = body

    if (status) {
      await updateLeadStatus(id, status, motivoPerda)
      await addInteracao({
        leadId: id,
        tipo: 'status_change',
        conteudo: `Status alterado: ${statusAnterior ?? '?'} → ${status}${motivoPerda ? ` (Motivo: ${motivoPerda})` : ''}`,
        statusAnterior,
        statusNovo: status,
      })
    }

    if (Object.keys(rest).length > 0) {
      await updateLead(id, rest)
    }

    const updated = await getLeadById(id)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/admin/leads/id]', error)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteLead(id)
  return NextResponse.json({ success: true })
}
