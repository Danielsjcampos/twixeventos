import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getAllEventos, createEvento } from '@/lib/db/queries/eventos'
import { eventoSchema } from '@/lib/validations/toy'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const eventos = await getAllEventos()
  return NextResponse.json(eventos)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = eventoSchema.parse(body)
    const checklistPadrao = [
      { id: '1', texto: 'Brinquedos carregados no veículo', concluido: false },
      { id: '2', texto: 'Ferramentas e extensões separadas', concluido: false },
      { id: '3', texto: 'Chegar 2h antes do evento', concluido: false },
      { id: '4', texto: 'Montar e testar todos os brinquedos', concluido: false },
      { id: '5', texto: 'Confirmar energia disponível (110v/220v)', concluido: false },
      { id: '6', texto: 'Registrar foto da montagem concluída', concluido: false },
    ]
    const evento = await createEvento({
      ...data,
      leadId: data.leadId ?? null,
      checklistMontagem: checklistPadrao,
      checklistDesmontagem: checklistPadrao.map(i => ({ ...i, id: `d${i.id}`, texto: i.texto.replace('carregados', 'descarregados') })),
    })
    return NextResponse.json(evento, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/eventos]', error)
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }
}
