import { db } from '../index'
import { clientes, datasComecorativas, eventos } from '../schema'
import { eq, desc, ilike, or, and, sql } from 'drizzle-orm'

export type ClienteInsert = typeof clientes.$inferInsert
export type DataComecorativaInsert = typeof datasComecorativas.$inferInsert

// ── Lista de clientes ──
export async function getClientes(search?: string) {
  const query = db.select().from(clientes)
  if (search) {
    return query.where(
      or(
        ilike(clientes.nome, `%${search}%`),
        ilike(clientes.telefone, `%${search}%`),
        ilike(clientes.email ?? '', `%${search}%`),
      )
    ).orderBy(desc(clientes.createdAt))
  }
  return query.orderBy(desc(clientes.createdAt))
}

// ── Cliente por ID com datas comemorativas ──
export async function getClienteById(id: string) {
  return db.query.clientes.findFirst({
    where: eq(clientes.id, id),
    with: { datasComecorativas: { orderBy: [datasComecorativas.dataNasc] } },
  })
}

// ── Cliente por telefone ──
export async function getClienteByTelefone(telefone: string) {
  const limpo = telefone.replace(/\D/g, '')
  return db.select().from(clientes)
    .where(or(
      eq(clientes.telefone, telefone),
      eq(clientes.telefone, limpo),
    ))
    .limit(1).then(r => r[0] ?? null)
}

// ── Histórico de eventos de um cliente ──
export async function getEventosCliente(clienteId: string) {
  const c = await db.select().from(clientes).where(eq(clientes.id, clienteId)).limit(1)
  if (!c[0]) return []
  const tel = c[0].telefone.replace(/\D/g, '')
  return db.select().from(eventos)
    .where(
      or(
        sql`regexp_replace(${eventos.telefoneCliente}, '[^0-9]', '', 'g') = ${tel}`,
        ilike(eventos.nomeCliente, `%${c[0].nome}%`),
      )
    )
    .orderBy(desc(eventos.dataEvento))
    .limit(50)
}

// ── Próximos aniversários (30 dias) ──
export async function getProximosAniversarios(dias = 30) {
  const rows = await db.execute(sql`
    SELECT *
    FROM (
      SELECT
        dc.id,
        dc.nome,
        dc.relacao,
        dc.data_nasc,
        dc.ano_nasc,
        c.id AS cliente_id,
        c.nome AS cliente_nome,
        c.telefone AS cliente_telefone,
        CASE
          WHEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM dc.data_nasc)::int, EXTRACT(DAY FROM dc.data_nasc)::int) >= CURRENT_DATE
          THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM dc.data_nasc)::int, EXTRACT(DAY FROM dc.data_nasc)::int)
          ELSE make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1, EXTRACT(MONTH FROM dc.data_nasc)::int, EXTRACT(DAY FROM dc.data_nasc)::int)
        END AS proximo_aniversario
      FROM datas_comemorativas dc
      JOIN clientes c ON c.id = dc.cliente_id
      WHERE c.ativo = true
    ) sub
    WHERE sub.proximo_aniversario <= CURRENT_DATE + (${dias} * INTERVAL '1 day')
    ORDER BY sub.proximo_aniversario
  `)
  return rows.rows as {
    id: string; nome: string; relacao: string; data_nasc: string; ano_nasc: number | null
    cliente_id: string; cliente_nome: string; cliente_telefone: string; proximo_aniversario: string
  }[]
}

// ── CRUD ──
export const createCliente = (data: ClienteInsert) =>
  db.insert(clientes).values(data).returning().then(r => r[0])

export const updateCliente = (id: string, data: Partial<ClienteInsert>) =>
  db.update(clientes).set({ ...data, updatedAt: new Date() }).where(eq(clientes.id, id)).returning().then(r => r[0])

export const deleteCliente = (id: string) =>
  db.delete(clientes).where(eq(clientes.id, id))

export const addDataComecorativa = (data: DataComecorativaInsert) =>
  db.insert(datasComecorativas).values(data).returning().then(r => r[0])

export const updateDataComecorativa = (id: string, data: Partial<DataComecorativaInsert>) =>
  db.update(datasComecorativas).set(data).where(eq(datasComecorativas.id, id)).returning().then(r => r[0])

export const deleteDataComecorativa = (id: string) =>
  db.delete(datasComecorativas).where(eq(datasComecorativas.id, id))

// ── Sincronizar cliente a partir de evento ──
export async function syncClienteFromEvento(ev: {
  nomeCliente: string; telefoneCliente: string; emailCliente?: string | null
  origemCliente?: string | null; tipoCliente?: string | null; dataEvento: string
}) {
  const tel = ev.telefoneCliente.replace(/\D/g, '')
  const existing = await db.select().from(clientes)
    .where(sql`regexp_replace(telefone, '[^0-9]', '', 'g') = ${tel}`)
    .limit(1).then(r => r[0] ?? null)

  if (existing) {
    await db.update(clientes).set({
      totalEventos: sql`${clientes.totalEventos} + 1`,
      ultimoEvento: ev.dataEvento,
      updatedAt: new Date(),
    }).where(eq(clientes.id, existing.id))
    return existing
  }

  return db.insert(clientes).values({
    nome: ev.nomeCliente,
    telefone: ev.telefoneCliente,
    email: ev.emailCliente ?? undefined,
    origem: ev.origemCliente ?? 'site',
    tipoCliente: ev.tipoCliente ?? 'fisica',
    totalEventos: 1,
    ultimoEvento: ev.dataEvento,
  }).returning().then(r => r[0])
}
