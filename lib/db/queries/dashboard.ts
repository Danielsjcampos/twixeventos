import { db } from '../index'
import { leads, eventos } from '../schema'
import { eq, gte, lt, not, inArray, and, count, sum, sql } from 'drizzle-orm'

export async function getDashboardMetrics() {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const semanaFim = new Date(hoje.getTime() + 7 * 86400000)
  const hojeStr = hoje.toISOString().slice(0, 10)
  const semanaFimStr = semanaFim.toISOString().slice(0, 10)

  const [
    leadsHojeRes,
    leadsAbertosRes,
    eventosEstaSemanaRes,
    receitaMesRes,
    leadsTotal30dRes,
    leadsConf30dRes,
    leadsPerdidosMesRes,
    topBrinquedoRes,
    topMonitorRes,
    proximosEventosRes,
  ] = await Promise.all([
    db.select({ n: count() }).from(leads).where(gte(leads.createdAt, hoje)).then(r => Number(r[0].n)),
    db.select({ n: count() }).from(leads).where(not(inArray(leads.status, ['realizado', 'perdido']))).then(r => Number(r[0].n)),
    db.select({ n: count() }).from(eventos).where(
      and(gte(eventos.dataEvento, hojeStr), lt(eventos.dataEvento, semanaFimStr))
    ).then(r => Number(r[0].n)),
    db.select({ t: sum(eventos.valorTotal) }).from(eventos)
      .where(and(eq(eventos.status, 'confirmado'), gte(eventos.createdAt, inicioMes)))
      .then(r => Number(r[0].t ?? 0)),
    db.select({ n: count() }).from(leads).where(gte(leads.createdAt, inicioMes)).then(r => Number(r[0].n)),
    db.select({ n: count() }).from(leads).where(and(eq(leads.status, 'confirmado'), gte(leads.createdAt, inicioMes))).then(r => Number(r[0].n)),
    db.select({ n: count() }).from(leads).where(and(eq(leads.status, 'perdido'), gte(leads.createdAt, inicioMes))).then(r => Number(r[0].n)),

    // Brinquedo mais alugado (via eventos.brinquedosContratados array)
    db.execute(sql`
      SELECT b.nome, COUNT(*)::int AS total
      FROM eventos e
      CROSS JOIN LATERAL unnest(e.brinquedos_contratados) AS toy_id
      JOIN brinquedos b ON b.id = toy_id
      WHERE e.status != 'cancelado'
      GROUP BY b.nome
      ORDER BY total DESC
      LIMIT 1
    `).then(r => r.rows[0] as { nome: string; total: number } | undefined),

    // Monitor que mais trabalha
    db.execute(sql`
      SELECT m.nome, COUNT(*)::int AS total
      FROM evento_monitores em
      JOIN monitores m ON m.id = em.monitor_id
      GROUP BY m.id, m.nome
      ORDER BY total DESC
      LIMIT 1
    `).then(r => r.rows[0] as { nome: string; total: number } | undefined),

    // Próximos eventos (até 5)
    db.select({
      id: eventos.id,
      nomeCliente: eventos.nomeCliente,
      dataEvento: eventos.dataEvento,
      horarioInicio: eventos.horarioInicio,
      enderecoCompleto: eventos.enderecoCompleto,
      status: eventos.status,
    }).from(eventos)
      .where(gte(eventos.dataEvento, hojeStr))
      .orderBy(eventos.dataEvento)
      .limit(5),
  ])

  return {
    leadsHoje: leadsHojeRes,
    leadsAbertos: leadsAbertosRes,
    eventosEstaSemana: eventosEstaSemanaRes,
    receitaMes: receitaMesRes,
    taxaConversao: leadsTotal30dRes > 0 ? Math.round((leadsConf30dRes / leadsTotal30dRes) * 100) : 0,
    leadsPerdidosMes: leadsPerdidosMesRes,
    topBrinquedo: topBrinquedoRes ?? null,
    topMonitor: topMonitorRes ?? null,
    proximosEventos: proximosEventosRes,
  }
}
