import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getPostById, updatePost, deletePost } from '@/lib/db/queries/blog'
import { slugify } from '@/lib/utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const post = await getPostById(id)
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }
    return NextResponse.json(post)
  } catch (error) {
    console.error('[blog-admin-get-item] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json()
    const post = await getPostById(id)
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }

    const updateData: any = {}
    if (body.titulo !== undefined) {
      updateData.titulo = body.titulo.trim()
      updateData.slug = slugify(body.titulo)
    }
    if (body.conteudo !== undefined) {
      updateData.conteudo = body.conteudo
      // recalculate read time
      updateData.tempoLeitura = Math.ceil(body.conteudo.split(/\s+/).length / 200) || 5
    }
    if (body.resumo !== undefined) updateData.resumo = body.resumo
    if (body.fotoDestaque !== undefined) updateData.fotoDestaque = body.fotoDestaque
    if (body.categoria !== undefined) updateData.categoria = body.categoria
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.status !== undefined) updateData.status = body.status
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription
    if (body.seoKeywords !== undefined) updateData.seoKeywords = body.seoKeywords

    const updated = await updatePost(id, updateData)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('[blog-admin-update-item] Error:', error)
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const post = await getPostById(id)
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }
    await deletePost(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[blog-admin-delete-item] Error:', error)
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 })
  }
}
