import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getAllLeads, getLeadsKanban, createLead } from '@/lib/db/queries/leads'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const kanban = searchParams.get('kanban') === 'true'

  const leads = kanban ? await getLeadsKanban() : await getAllLeads()
  return NextResponse.json(leads)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const lead = await createLead({
      nome: body.nome,
      telefone: body.telefone,
      email: body.email || null,
      dataEvento: body.dataEvento || null,
      horarioEvento: body.horarioEvento || null,
      enderecoEvento: body.enderecoEvento || null,
      regiaoEvento: body.regiaoEvento || null,
      brinquedosInteresse: body.brinquedosInteresse || [],
      mensagem: body.mensagem || null,
      origem: body.origem || 'manual',
      status: body.status || 'novo',
      valorProposto: body.valorProposto || null,
      prioridade: body.prioridade || 'normal',
    })
    return NextResponse.json(lead, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar lead' }, { status: 500 })
  }
}
