import { db, rawSql } from '../index'
import { eventos } from '../schema'
import { gte, lt, not, inArray, and, sum, count } from 'drizzle-orm'

export type MesAno = { mes: number; ano: number }

function mesRange(mes: number, ano: number) {
  const inicio = new Date(ano, mes - 1, 1)
  const fim = new Date(ano, mes, 1)
  return {
    inicioStr: inicio.toISOString().slice(0, 10),
    fimStr: fim.toISOString().slice(0, 10),
  }
}

export async function getKpisMes(mes: number, ano: number) {
  const { inicioStr, fimStr } = mesRange(mes, ano)

  const [totalFaturado, totalFestas, brinquedosAlugados] = await Promise.all([
    db.select({ t: sum(eventos.valorTotal) })
      .from(eventos)
      .where(and(not(inArray(eventos.status, ['cancelado'])), gte(eventos.dataEvento, inicioStr), lt(eventos.dataEvento, fimStr)))
      .then(r => Number(r[0].t ?? 0)),

    db.select({ n: count() })
      .from(eventos)
      .where(and(not(inArray(eventos.status, ['cancelado'])), gte(eventos.dataEvento, inicioStr), lt(eventos.dataEvento, fimStr)))
      .then(r => Number(r[0].n)),

    (async () => {
      const r = await rawSql<Array<{ total: number }>>`
        SELECT COALESCE(SUM(array_length(brinquedos_contratados, 1)), 0)::int AS total
        FROM eventos
        WHERE status != 'cancelado'
          AND data_evento >= ${inicioStr}
          AND data_evento < ${fimStr}
          AND brinquedos_contratados IS NOT NULL
      `
      return Number(r[0]?.total ?? 0)
    })(),
  ])

  const ticketMedioFestas      = totalFestas > 0      ? totalFaturado / totalFestas      : 0
  const ticketMedioBrinquedos  = brinquedosAlugados > 0 ? totalFaturado / brinquedosAlugados : 0

  return { totalFaturado, totalFestas, brinquedosAlugados, ticketMedioFestas, ticketMedioBrinquedos }
}

export async function getReceitaPorMes(ano: number) {
  const rows = await rawSql<Array<{ mes: number; receita: number; festas: number }>>`
    SELECT
      EXTRACT(MONTH FROM data_evento::date)::int AS mes,
      COALESCE(SUM(valor_total), 0)::float AS receita,
      COUNT(*)::int AS festas
    FROM eventos
    WHERE status != 'cancelado'
      AND EXTRACT(YEAR FROM data_evento::date) = ${ano}
    GROUP BY mes ORDER BY mes
  `
  const map: Record<number, { receita: number; festas: number }> = {}
  for (const r of rows) {
    map[r.mes] = { receita: r.receita, festas: r.festas }
  }
  return Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    receita: map[i + 1]?.receita ?? 0,
    festas:  map[i + 1]?.festas  ?? 0,
  }))
}

export async function getRankingBrinquedosMes(mes: number, ano: number) {
  const { inicioStr, fimStr } = mesRange(mes, ano)
  return rawSql<Array<{ nome: string; alugados: number; receita: number }>>`
    SELECT b.nome, COUNT(*)::int AS alugados,
           COALESCE(SUM(e.valor_total / NULLIF(array_length(e.brinquedos_contratados,1),0)), 0)::float AS receita
    FROM eventos e
    CROSS JOIN LATERAL unnest(e.brinquedos_contratados) AS toy_id
    JOIN brinquedos b ON b.id = toy_id
    WHERE e.status != 'cancelado'
      AND e.data_evento >= ${inicioStr}
      AND e.data_evento < ${fimStr}
    GROUP BY b.nome ORDER BY alugados DESC LIMIT 10
  `
}

export async function getOrigemClientesMes(mes: number, ano: number) {
  const { inicioStr, fimStr } = mesRange(mes, ano)
  try {
    return rawSql<Array<{ origem: string; total: number }>>`
      SELECT COALESCE(origem_cliente, 'Não informado') AS origem, COUNT(*)::int AS total
      FROM eventos
      WHERE status != 'cancelado' AND data_evento >= ${inicioStr} AND data_evento < ${fimStr}
      GROUP BY origem ORDER BY total DESC
    `
  } catch {
    return [] as Array<{ origem: string; total: number }>
  }
}

type EventoMes = {
  id: string; nomeCliente: string; dataEvento: string; horarioInicio: string
  valorTotal: string | null; custoMonitores: string | null; custoTransporte: string | null
  custosExtras: string | null; status: string; statusPagamento: string
  origemCliente: string | null; tipoCliente: string | null
}

export async function getEventosMes(mes: number, ano: number): Promise<EventoMes[]> {
  const { inicioStr, fimStr } = mesRange(mes, ano)

  type Row = {
    id: string; nome_cliente: string; data_evento: string; horario_inicio: string
    valor_total: string | null; custo_monitores: string | null
    custo_transporte: string | null; custos_extras: string | null
    status: string; status_pagamento: string
    origem_cliente?: string | null; tipo_cliente?: string | null
  }

  const rows = await rawSql<Array<Row>>`
    SELECT id, nome_cliente, data_evento, horario_inicio,
           valor_total, custo_monitores, custo_transporte, custos_extras,
           status, status_pagamento, origem_cliente, tipo_cliente
    FROM eventos
    WHERE data_evento >= ${inicioStr} AND data_evento < ${fimStr} AND status != 'cancelado'
    ORDER BY data_evento
  `

  return rows.map(r => ({
    id:              r.id,
    nomeCliente:     r.nome_cliente,
    dataEvento:      r.data_evento,
    horarioInicio:   r.horario_inicio,
    valorTotal:      r.valor_total      ?? null,
    custoMonitores:  r.custo_monitores  ?? null,
    custoTransporte: r.custo_transporte ?? null,
    custosExtras:    r.custos_extras    ?? null,
    status:          r.status,
    statusPagamento: r.status_pagamento,
    origemCliente:   r.origem_cliente   ?? null,
    tipoCliente:     r.tipo_cliente     ?? null,
  }))
}
