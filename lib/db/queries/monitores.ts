import { db } from '../index'
import { monitores, eventoMonitores } from '../schema'
import { eq, desc } from 'drizzle-orm'

export const getAllMonitores = () =>
  db.select().from(monitores).orderBy(monitores.nome)

export const getMonitoresAtivos = () =>
  db.select().from(monitores).where(eq(monitores.ativo, true)).orderBy(monitores.nome)

export const getMonitorById = (id: string) =>
  db.select().from(monitores).where(eq(monitores.id, id)).then(r => r[0])

export const createMonitor = (data: typeof monitores.$inferInsert) =>
  db.insert(monitores).values(data).returning().then(r => r[0])

export const updateMonitor = (id: string, data: Partial<typeof monitores.$inferInsert>) =>
  db.update(monitores).set({ ...data, updatedAt: new Date() }).where(eq(monitores.id, id)).returning().then(r => r[0])

export const deleteMonitor = (id: string) =>
  db.delete(monitores).where(eq(monitores.id, id))

export const getMonitoresDoEvento = (eventoId: string) =>
  db.query.eventoMonitores.findMany({
    where: eq(eventoMonitores.eventoId, eventoId),
    with: { monitor: true },
  })

export const addMonitorEvento = (data: typeof eventoMonitores.$inferInsert) =>
  db.insert(eventoMonitores).values(data).returning().then(r => r[0])

export const removeMonitorEvento = (id: string) =>
  db.delete(eventoMonitores).where(eq(eventoMonitores.id, id))

export const updateMonitorEvento = (id: string, data: Partial<typeof eventoMonitores.$inferInsert>) =>
  db.update(eventoMonitores).set(data).where(eq(eventoMonitores.id, id)).returning().then(r => r[0])
