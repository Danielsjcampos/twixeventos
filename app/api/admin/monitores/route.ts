import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAllMonitores, createMonitor } from '@/lib/db/queries/monitores'
import { z } from 'zod'

const monitorSchema = z.object({
  nome:        z.string().min(2),
  telefone:    z.string().min(10),
  cpf:         z.string().optional(),
  pix:         z.string().optional(),
  ativo:       z.boolean().default(true),
  valorDia:    z.string().optional(),
  observacoes: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await getAllMonitores()
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = monitorSchema.parse(body)
    const monitor = await createMonitor(data)
    return NextResponse.json(monitor, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }
}
