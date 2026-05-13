import { db } from '../index'
import { leads, interacoes } from '../schema'
import { eq, lt, not, inArray, and, desc } from 'drizzle-orm'

export const getLeadsKanban = () =>
  db.select().from(leads)
    .where(not(inArray(leads.status, ['realizado', 'perdido'])))
    .orderBy(desc(leads.createdAt))

export const getAllLeads = () =>
  db.select().from(leads).orderBy(desc(leads.createdAt))

export const getLeadById = (id: string) =>
  db.query.leads.findFirst({
    where: eq(leads.id, id),
    with: { interacoes: { orderBy: [desc(interacoes.createdAt)] } },
  })

export const createLead = async (data: typeof leads.$inferInsert) =>
  db.insert(leads).values(data).returning().then(r => r[0])

export const updateLead = (id: string, data: Partial<typeof leads.$inferInsert>) =>
  db.update(leads).set({ ...data, updatedAt: new Date() }).where(eq(leads.id, id)).returning().then(r => r[0])

export const updateLeadStatus = (id: string, status: string, motivoPerda?: string) =>
  db.update(leads)
    .set({ status, motivoPerda, ultimaInteracao: new Date(), updatedAt: new Date() })
    .where(eq(leads.id, id))

export const deleteLead = (id: string) =>
  db.delete(leads).where(eq(leads.id, id))

export const addInteracao = async (data: typeof interacoes.$inferInsert) => {
  const result = await db.insert(interacoes).values(data).returning().then(r => r[0])
  await db.update(leads).set({ ultimaInteracao: new Date(), updatedAt: new Date() })
    .where(eq(leads.id, data.leadId))
  return result
}

export const getLeadsSemInteracao = (horas = 48) => {
  const limite = new Date(Date.now() - horas * 3600000)
  return db.select().from(leads)
    .where(and(
      lt(leads.ultimaInteracao, limite),
      not(inArray(leads.status, ['realizado', 'perdido']))
    ))
}

export const getLeadsCrmStats = async () => {
  const all = await db.select().from(leads).orderBy(desc(leads.createdAt))

  const total = all.length
  const convertidos = all.filter(l => ['confirmado', 'realizado'].includes(l.status)).length
  const perdidos = all.filter(l => l.status === 'perdido').length
  const taxaConversao = total > 0 ? Math.round((convertidos / total) * 100) : 0

  const valorConvertido = all
    .filter(l => ['confirmado', 'realizado'].includes(l.status))
    .reduce((s, l) => s + parseFloat(l.valorProposto ?? '0'), 0)

  const valorPerdido = all
    .filter(l => l.status === 'perdido')
    .reduce((s, l) => s + parseFloat(l.valorProposto ?? '0'), 0)

  const bCount: Record<string, number> = {}
  for (const lead of all) {
    for (const b of lead.brinquedosInteresse ?? []) {
      bCount[b] = (bCount[b] ?? 0) + 1
    }
  }
  const topBrinquedo = Object.entries(bCount).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null
  const origens = [...new Set(all.map(l => l.origem).filter(Boolean))]
  const todosBrinquedos = [...new Set(all.flatMap(l => l.brinquedosInteresse ?? []))]

  return { total, convertidos, perdidos, taxaConversao, valorConvertido, valorPerdido, topBrinquedo, origens, todosBrinquedos }
}
