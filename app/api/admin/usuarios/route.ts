import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createUsuario, getUsuarios } from '@/lib/db/queries/usuarios'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const usuarios = await getUsuarios()
  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const [usuario] = await createUsuario(body)
  return NextResponse.json(usuario, { status: 201 })
}
