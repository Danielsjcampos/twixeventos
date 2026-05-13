import { db } from '../index'
import { leads, eventos } from '../schema'
import { eq, gte, lt, not, inArray, and, count, sum, sql } from 'drizzle-orm'

export async function getDashboardMetrics() {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const inicioMes   = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const inicio30d   = new Date(hoje.getTime() - 30 * 86400000)
  const semanaFim   = new Date(hoje.getTime() + 7 * 86400000)
  const hojeStr     = hoje.toISOString().slice(0, 10)
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
    leadsPorStatusRes,
    origemLeadsRes,
    topBrinquedosRes,
    eventosPorStatusRes,
  ] = await Promise.all([
    // Leads criados hoje
    db.select({ n: count() }).from(leads)
      .where(gte(leads.createdAt, hoje))
      .then(r => Number(r[0].n)),

    // Leads em aberto (pipeline ativo)
    db.select({ n: count() }).from(leads)
      .where(not(inArray(leads.status, ['realizado', 'perdido'])))
      .then(r => Number(r[0].n)),

    // Eventos esta semana
    db.select({ n: count() }).from(eventos)
      .where(and(gte(eventos.dataEvento, hojeStr), lt(eventos.dataEvento, semanaFimStr)))
      .then(r => Number(r[0].n)),

    // Receita do mês (confirmados)
    db.select({ t: sum(eventos.valorTotal) }).from(eventos)
      .where(and(eq(eventos.status, 'confirmado'), gte(eventos.createdAt, inicioMes)))
      .then(r => Number(r[0].t ?? 0)),

    // Leads total 30d (para taxa de conversão)
    db.select({ n: count() }).from(leads)
      .where(gte(leads.createdAt, inicio30d))
      .then(r => Number(r[0].n)),

    // Leads confirmados 30d
    db.select({ n: count() }).from(leads)
      .where(and(eq(leads.status, 'confirmado'), gte(leads.createdAt, inicio30d)))
      .then(r => Number(r[0].n)),

    // Leads perdidos no mês
    db.select({ n: count() }).from(leads)
      .where(and(eq(leads.status, 'perdido'), gte(leads.createdAt, inicioMes)))
      .then(r => Number(r[0].n)),

    // Top brinquedo (1)
    db.execute(sql`
      SELECT b.nome, COUNT(*)::int AS total
      FROM eventos e
      CROSS JOIN LATERAL unnest(e.brinquedos_contratados) AS toy_id
      JOIN brinquedos b ON b.id = toy_id
      WHERE e.status != 'cancelado'
      GROUP BY b.nome ORDER BY total DESC LIMIT 1
    `).then(r => r.rows[0] as { nome: string; total: number } | undefined),

    // Top monitor (1)
    db.execute(sql`
      SELECT m.nome, COUNT(*)::int AS total
      FROM evento_monitores em
      JOIN monitores m ON m.id = em.monitor_id
      GROUP BY m.id, m.nome ORDER BY total DESC LIMIT 1
    `).then(r => r.rows[0] as { nome: string; total: number } | undefined),

    // Próximos eventos (até 6)
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
      .limit(6),

    // Funil: leads por status (todos os leads)
    db.execute(sql`
      SELECT status, COUNT(*)::int AS total
      FROM leads
      GROUP BY status
    `).then(r => r.rows as { status: string; total: number }[]),

    // Origem dos leads (últimos 90 dias)
    db.execute(sql`
      SELECT COALESCE(origem, 'Direto') AS origem, COUNT(*)::int AS total
      FROM leads
      WHERE created_at >= NOW() - INTERVAL '90 days'
      GROUP BY origem ORDER BY total DESC LIMIT 6
    `).then(r => r.rows as { origem: string; total: number }[]),

    // Top 6 brinquedos mais alugados
    db.execute(sql`
      SELECT b.nome, COUNT(*)::int AS total
      FROM eventos e
      CROSS JOIN LATERAL unnest(e.brinquedos_contratados) AS toy_id
      JOIN brinquedos b ON b.id = toy_id
      WHERE e.status != 'cancelado'
      GROUP BY b.nome ORDER BY total DESC LIMIT 6
    `).then(r => r.rows as { nome: string; total: number }[]),

    // Eventos por status (para donut)
    db.execute(sql`
      SELECT status, COUNT(*)::int AS total
      FROM eventos GROUP BY status
    `).then(r => r.rows as { status: string; total: number }[]),
  ])

  return {
    leadsHoje:          leadsHojeRes,
    leadsAbertos:       leadsAbertosRes,
    eventosEstaSemana:  eventosEstaSemanaRes,
    receitaMes:         receitaMesRes,
    taxaConversao:      leadsTotal30dRes > 0
                          ? Math.round((leadsConf30dRes / leadsTotal30dRes) * 100)
                          : 0,
    leadsPerdidosMes:   leadsPerdidosMesRes,
    topBrinquedo:       topBrinquedoRes ?? null,
    topMonitor:         topMonitorRes ?? null,
    proximosEventos:    proximosEventosRes,
    leadsPorStatus:     leadsPorStatusRes,
    origemLeads:        origemLeadsRes,
    topBrinquedos:      topBrinquedosRes,
    eventosPorStatus:   eventosPorStatusRes,
  }
}
