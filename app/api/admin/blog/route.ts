import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getPostsAdmin, createPost } from '@/lib/db/queries/blog'
import { slugify } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const search = searchParams.get('search') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const categoria = searchParams.get('categoria') ?? undefined

  try {
    const list = await getPostsAdmin({ search, status, categoria })
    return NextResponse.json(list)
  } catch (error) {
    console.error('[blog-admin-list] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { titulo, categoria, tags, conteudo, resumo, status } = await req.json()
    if (!titulo || !categoria) {
      return NextResponse.json({ error: 'Título e Categoria são obrigatórios' }, { status: 400 })
    }

    const slug = slugify(titulo)
    const result = await createPost({
      titulo,
      slug,
      conteudo: conteudo || '',
      resumo: resumo || '',
      categoria,
      tags: tags || [],
      status: status || 'rascunho',
      tempoLeitura: Math.ceil((conteudo || '').split(/\s+/).length / 200) || 5,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[blog-admin-create] Error:', error)
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 })
  }
}
