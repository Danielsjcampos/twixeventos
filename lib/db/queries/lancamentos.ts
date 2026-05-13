import { db } from '../index'
import { lancamentosFinanceiros, eventos, monitores } from '../schema'
import { eq, gte, lt, and, sum, desc, sql } from 'drizzle-orm'

export type LancamentoInsert = typeof lancamentosFinanceiros.$inferInsert

function mesRange(mes: number, ano: number) {
  const inicio = new Date(ano, mes - 1, 1)
  const fim = new Date(ano, mes, 1)
  return {
    inicioStr: inicio.toISOString().slice(0, 10),
    fimStr: fim.toISOString().slice(0, 10),
  }
}

export async function getLancamentosMes(mes: number, ano: number) {
  const { inicioStr, fimStr } = mesRange(mes, ano)
  const rows = await db
    .select({
      id: lancamentosFinanceiros.id,
      tipo: lancamentosFinanceiros.tipo,
      descricao: lancamentosFinanceiros.descricao,
      valor: lancamentosFinanceiros.valor,
      forma: lancamentosFinanceiros.forma,
      status: lancamentosFinanceiros.status,
      data: lancamentosFinanceiros.data,
      categoria: lancamentosFinanceiros.categoria,
      observacoes: lancamentosFinanceiros.observacoes,
      eventoId: lancamentosFinanceiros.eventoId,
      monitorId: lancamentosFinanceiros.monitorId,
      criadoPor: lancamentosFinanceiros.criadoPor,
      createdAt: lancamentosFinanceiros.createdAt,
      nomeEvento: eventos.nomeCliente,
      nomeMonitor: monitores.nome,
    })
    .from(lancamentosFinanceiros)
    .leftJoin(eventos, eq(lancamentosFinanceiros.eventoId, eventos.id))
    .leftJoin(monitores, eq(lancamentosFinanceiros.monitorId, monitores.id))
    .where(
      and(
        gte(lancamentosFinanceiros.data, inicioStr),
        lt(lancamentosFinanceiros.data, fimStr),
      )
    )
    .orderBy(desc(lancamentosFinanceiros.data))
  return rows
}

export async function getLancamentosTotaisMes(mes: number, ano: number) {
  const { inicioStr, fimStr } = mesRange(mes, ano)
  const rows = await db
    .select({
      tipo: lancamentosFinanceiros.tipo,
      total: sum(lancamentosFinanceiros.valor),
    })
    .from(lancamentosFinanceiros)
    .where(
      and(
        gte(lancamentosFinanceiros.data, inicioStr),
        lt(lancamentosFinanceiros.data, fimStr),
        eq(lancamentosFinanceiros.status, 'pago'),
      )
    )
    .groupBy(lancamentosFinanceiros.tipo)

  const map: Record<string, number> = {}
  for (const r of rows) map[r.tipo] = Number(r.total ?? 0)
  return {
    receita:         map['receita'] ?? 0,
    despesa:         map['despesa'] ?? 0,
    retiradaSocio:   map['retirada_socio'] ?? 0,
    pagamentoMonitor: map['pagamento_monitor'] ?? 0,
  }
}

export const createLancamento = (data: LancamentoInsert) =>
  db.insert(lancamentosFinanceiros).values(data).returning().then(r => r[0])

export const updateLancamento = (id: string, data: Partial<LancamentoInsert>) =>
  db.update(lancamentosFinanceiros).set({ ...data, updatedAt: new Date() }).where(eq(lancamentosFinanceiros.id, id)).returning().then(r => r[0])

export const deleteLancamento = (id: string) =>
  db.delete(lancamentosFinanceiros).where(eq(lancamentosFinanceiros.id, id))

export async function getLancamentosAno(ano: number) {
  const rows = await db.execute(sql`
    SELECT
      EXTRACT(MONTH FROM data)::int AS mes,
      tipo,
      COALESCE(SUM(valor), 0)::float AS total
    FROM lancamentos_financeiros
    WHERE EXTRACT(YEAR FROM data) = ${ano}
      AND status = 'pago'
    GROUP BY mes, tipo
    ORDER BY mes
  `)
  return rows.rows as { mes: number; tipo: string; total: number }[]
}
