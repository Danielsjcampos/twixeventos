import { db } from '../index'
import { eventos } from '../schema'
import { eq, gte, lte, and, asc, desc } from 'drizzle-orm'
import { getTableColumns } from 'drizzle-orm'

// Excludes columns not yet in the DB (added in a pending migration).
// Remove this helper and use db.select() directly after running db:push.
function safeEventosCols() {
  const { origemCliente, tipoCliente, ...rest } = getTableColumns(eventos)
  void origemCliente; void tipoCliente
  return rest
}

export const getEventosFuturos = () =>
  db.select(safeEventosCols()).from(eventos)
    .where(gte(eventos.dataEvento, new Date().toISOString().slice(0, 10)))
    .orderBy(asc(eventos.dataEvento))

export const getEventosByMes = (ano: number, mes: number) => {
  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const fim = `${ano}-${String(mes).padStart(2, '0')}-31`
  return db.select(safeEventosCols()).from(eventos)
    .where(and(gte(eventos.dataEvento, inicio), lte(eventos.dataEvento, fim)))
    .orderBy(asc(eventos.dataEvento))
}

export const getEventoById = (id: string) =>
  db.query.eventos.findFirst({
    where: eq(eventos.id, id),
    with: {
      monitoresEvento: { with: { monitor: true } },
      pagamentos: true,
    },
  })

export const createEvento = (data: typeof eventos.$inferInsert) =>
  db.insert(eventos).values(data).returning().then(r => r[0])

export const updateEvento = (id: string, data: Partial<typeof eventos.$inferInsert>) =>
  db.update(eventos).set({ ...data, updatedAt: new Date() }).where(eq(eventos.id, id)).returning().then(r => r[0])

export const deleteEvento = (id: string) =>
  db.delete(eventos).where(eq(eventos.id, id))

export const getEventosPorData = (data: string) =>
  db.select(safeEventosCols()).from(eventos).where(eq(eventos.dataEvento, data)).orderBy(asc(eventos.horarioInicio))

export const getAllEventos = () =>
  db.select(safeEventosCols()).from(eventos).orderBy(desc(eventos.dataEvento))
