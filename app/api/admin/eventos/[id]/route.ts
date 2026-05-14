import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getEventoById, updateEvento, deleteEvento } from '@/lib/db/queries/eventos'
import { addMonitorEvento, removeMonitorEvento, updateMonitorEvento } from '@/lib/db/queries/monitores'
import { createPagamento, updatePagamento, deletePagamento } from '@/lib/db/queries/pagamentos'
import { creditarCashbackEvento } from '@/lib/db/queries/area-cliente'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const evento = await getEventoById(id)
  if (!evento) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(evento)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { _action, ...data } = body

  // Subresource actions
  if (_action === 'add_monitor') {
    const em = await addMonitorEvento({ eventoId: id, monitorId: data.monitorId, valorPago: data.valorPago })
    return NextResponse.json(em)
  }
  if (_action === 'remove_monitor') {
    await removeMonitorEvento(data.eventoMonitorId)
    return NextResponse.json({ success: true })
  }
  if (_action === 'update_monitor') {
    const em = await updateMonitorEvento(data.eventoMonitorId, { valorPago: data.valorPago, confirmado: data.confirmado })
    return NextResponse.json(em)
  }
  if (_action === 'add_pagamento') {
    const p = await createPagamento({ eventoId: id, ...data })
    return NextResponse.json(p)
  }
  if (_action === 'update_pagamento') {
    const p = await updatePagamento(data.pagamentoId, data.updates)
    return NextResponse.json(p)
  }
  if (_action === 'delete_pagamento') {
    await deletePagamento(data.pagamentoId)
    return NextResponse.json({ success: true })
  }

  const updated = await updateEvento(id, data)

  // Creditar cashback automaticamente quando evento é marcado como realizado
  if (data.status === 'realizado' && updated?.telefoneCliente) {
    creditarCashbackEvento(id, updated.telefoneCliente).catch(() => {/* silencia erro não-crítico */})
  }

  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await deleteEvento(id)
  return NextResponse.json({ success: true })
}
