import { NextRequest, NextResponse } from 'next/server'
import { createUsuario, getUsuarios } from '@/lib/db/queries/usuarios'

export async function GET() {
  const usuarios = await getUsuarios()
  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const [usuario] = await createUsuario(body)
  return NextResponse.json(usuario, { status: 201 })
}
