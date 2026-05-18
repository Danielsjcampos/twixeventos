import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getAllBrinquedosAdmin, createBrinquedo } from '@/lib/db/queries/brinquedos'
import { brinquedoSchema } from '@/lib/validations/toy'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const brinquedos = await getAllBrinquedosAdmin()
  return NextResponse.json(brinquedos)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = brinquedoSchema.parse(body)
    const brinquedo = await createBrinquedo(data)
    return NextResponse.json(brinquedo, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/admin/brinquedos]', error)

    // Zod validation error
    if (error.name === 'ZodError' || error.errors) {
      const msg = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(' | ')
      return NextResponse.json({ message: msg }, { status: 400 })
    }

    // PostgreSQL unique constraint (slug duplicado)
    if (error.code === '23505') {
      const msg = error.constraint?.includes('slug')
        ? 'Já existe um brinquedo com esse nome. Use um nome diferente.'
        : 'Registro duplicado.'
      return NextResponse.json({ message: msg }, { status: 409 })
    }

    // Outros erros de banco
    const msg = error.message ?? 'Erro interno ao salvar'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
