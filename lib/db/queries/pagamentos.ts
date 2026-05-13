import { db } from '../index'
import { pagamentos } from '../schema'
import { eq } from 'drizzle-orm'

export const getPagamentosDoEvento = (eventoId: string) =>
  db.select().from(pagamentos).where(eq(pagamentos.eventoId, eventoId))

export const createPagamento = (data: typeof pagamentos.$inferInsert) =>
  db.insert(pagamentos).values(data).returning().then(r => r[0])

export const updatePagamento = (id: string, data: Partial<typeof pagamentos.$inferInsert>) =>
  db.update(pagamentos).set(data).where(eq(pagamentos.id, id)).returning().then(r => r[0])

export const deletePagamento = (id: string) =>
  db.delete(pagamentos).where(eq(pagamentos.id, id))
