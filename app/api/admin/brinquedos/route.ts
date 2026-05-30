import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getAllBrinquedosAdmin, createBrinquedo, getBrinquedosAtivos } from '@/lib/db/queries/brinquedos'
import { brinquedoSchema } from '@/lib/validations/toy'
import { slugify } from '@/lib/utils'
import { notificarBuscadores } from '@/lib/seo/notificar'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { searchParams } = new URL(request.url)
  const isLight = searchParams.get('light') === 'true'
  
  if (isLight) {
    const brinquedos = await getBrinquedosAtivos()
    return NextResponse.json(brinquedos)
  }
  
  const brinquedos = await getAllBrinquedosAdmin()
  return NextResponse.json(brinquedos)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    body.slug = slugify(body.slug || body.nome || '')
    const data = brinquedoSchema.parse(body)
    const brinquedo = await createBrinquedo(data)

    // Notifica buscadores se o brinquedo já está ativo (público)
    if (brinquedo?.ativo && brinquedo?.slug) {
      await notificarBuscadores([`/brinquedos/${brinquedo.slug}`, '/brinquedos'])
    }

    return NextResponse.json(brinquedo, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/admin/brinquedos]', err)
    const error = err as Record<string, unknown>

    // Zod validation error
    if (error.name === 'ZodError' || error.errors) {
      const errs = error.errors as { path: string[]; message: string }[]
      const msg = errs.map(e => `${e.path.join('.')}: ${e.message}`).join(' | ')
      return NextResponse.json({ message: msg }, { status: 400 })
    }

    // PostgreSQL unique constraint (slug duplicado)
    if (error.code === '23505') {
      const msg = typeof error.constraint === 'string' && error.constraint.includes('slug')
        ? 'Já existe um brinquedo com esse nome. Use um nome diferente.'
        : 'Registro duplicado.'
      return NextResponse.json({ message: msg }, { status: 409 })
    }

    // Outros erros de banco
    const msg = typeof error.message === 'string' ? error.message : 'Erro interno ao salvar'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
