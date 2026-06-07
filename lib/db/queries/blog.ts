import { db } from '../index'
import { blogPosts } from '../schema'
import { eq, and, desc, ilike, or } from 'drizzle-orm'

// ── Funções Públicas ──────────────────────────────────────────

/**
 * Retorna todos os posts publicados ordenados pela data de criação decrescente
 */
export const getPostsPublicados = () =>
  db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, 'publicado'))
    .orderBy(desc(blogPosts.createdAt))

/**
 * Retorna posts publicados de uma determinada categoria
 */
export const getPostsByCategoriaPublicados = (categoria: string) =>
  db
    .select()
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.status, 'publicado'),
        eq(blogPosts.categoria, categoria)
      )
    )
    .orderBy(desc(blogPosts.createdAt))

/**
 * Retorna um post publicado a partir do slug
 */
export const getPostBySlugPublicado = async (slug: string) =>
  db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'publicado')))
    .limit(1)
    .then(r => r[0] ?? null)

// ── Funções Admin ──────────────────────────────────────────────

/**
 * Busca flexível de posts para a tabela do painel administrativo
 */
export const getPostsAdmin = async (filters: {
  search?: string
  status?: string
  categoria?: string
}) => {
  let query = db.select().from(blogPosts)
  const conditions = []

  if (filters.status) {
    conditions.push(eq(blogPosts.status, filters.status))
  }
  if (filters.categoria) {
    conditions.push(eq(blogPosts.categoria, filters.categoria))
  }
  if (filters.search) {
    conditions.push(
      or(
        ilike(blogPosts.titulo, `%${filters.search}%`),
        ilike(blogPosts.categoria, `%${filters.search}%`)
      )
    )
  }

  if (conditions.length > 0) {
    // @ts-ignore
    query = query.where(and(...conditions))
  }

  return query.orderBy(desc(blogPosts.createdAt))
}

/**
 * Retorna um post completo por ID
 */
export const getPostById = async (id: string) =>
  db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1)
    .then(r => r[0] ?? null)

/**
 * Cria um novo post
 */
export const createPost = async (data: typeof blogPosts.$inferInsert) => {
  return db
    .insert(blogPosts)
    .values(data)
    .returning()
    .then(r => r[0])
}

/**
 * Atualiza um post por ID
 */
export const updatePost = async (id: string, data: Partial<typeof blogPosts.$inferInsert>) =>
  db
    .update(blogPosts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(blogPosts.id, id))
    .returning()
    .then(r => r[0])

/**
 * Exclui um post por ID
 */
export const deletePost = (id: string) =>
  db.delete(blogPosts).where(eq(blogPosts.id, id))

/**
 * Incrementa o contador de visualizações de um post
 */
export const incrementViews = async (id: string) => {
  const post = await getPostById(id)
  if (!post) return null
  return db
    .update(blogPosts)
    .set({ visualizacoes: post.visualizacoes + 1 })
    .where(eq(blogPosts.id, id))
    .returning()
    .then(r => r[0])
}
