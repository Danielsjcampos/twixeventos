import { db } from '../index'
import { brinquedos } from '../schema'
import { eq, and, asc, desc } from 'drizzle-orm'

export const getBrinquedosAtivos = () =>
  db.select().from(brinquedos).where(eq(brinquedos.ativo, true)).orderBy(asc(brinquedos.nome))

export const getBrinquedosDestaque = () =>
  db.select().from(brinquedos)
    .where(and(eq(brinquedos.ativo, true), eq(brinquedos.destaque, true)))
    .orderBy(asc(brinquedos.ordemDestaque))

export const getBrinquedoBySlug = async (slug: string) =>
  db.select().from(brinquedos)
    .where(and(eq(brinquedos.slug, slug), eq(brinquedos.ativo, true)))
    .limit(1).then(r => r[0] ?? null)

export const getBrinquedoById = async (id: string) =>
  db.select().from(brinquedos).where(eq(brinquedos.id, id)).limit(1).then(r => r[0] ?? null)

export const getAllBrinquedosAdmin = () =>
  db.select().from(brinquedos).orderBy(asc(brinquedos.nome))

export const toggleDestaque = (id: string, value: boolean) =>
  db.update(brinquedos).set({ destaque: value, updatedAt: new Date() }).where(eq(brinquedos.id, id))

export const toggleAtivo = (id: string, value: boolean) =>
  db.update(brinquedos).set({ ativo: value, updatedAt: new Date() }).where(eq(brinquedos.id, id))

export const createBrinquedo = (data: typeof brinquedos.$inferInsert) =>
  db.insert(brinquedos).values(data).returning().then(r => r[0])

export const updateBrinquedo = (id: string, data: Partial<typeof brinquedos.$inferInsert>) =>
  db.update(brinquedos).set({ ...data, updatedAt: new Date() }).where(eq(brinquedos.id, id)).returning().then(r => r[0])

export const deleteBrinquedo = (id: string) =>
  db.delete(brinquedos).where(eq(brinquedos.id, id))

export const getBrinquedosByCategoria = (categoria: string) =>
  db.select().from(brinquedos)
    .where(and(eq(brinquedos.ativo, true), eq(brinquedos.categoria, categoria)))
    .orderBy(asc(brinquedos.nome))
