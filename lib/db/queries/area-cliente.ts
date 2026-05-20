import { db, rawSql } from '../index'
import { clientes, eventos, cashbackTransacoes, roletaGiros } from '../schema'
import { eq, desc, count } from 'drizzle-orm'
import { getConfig } from './configuracoes'

/* ── Gera código único TWX-XXXXXXXX ─────────────────────── */
function gerarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem 0/O/I/1
  const parte = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `TWX-${parte(4)}${parte(4)}`
}

/* ── Garante código único no banco ──────────────────────── */
export async function ensureCodigoAcesso(clienteId: string): Promise<string> {
  const [c] = await db.select({ codigo: clientes.codigoAcesso }).from(clientes).where(eq(clientes.id, clienteId))
  if (c?.codigo) return c.codigo

  // Gerar até achar um único
  let codigo = gerarCodigo()
  let tentativas = 0
  while (tentativas < 10) {
    const [exists] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.codigoAcesso, codigo))
    if (!exists) break
    codigo = gerarCodigo()
    tentativas++
  }
  await db.update(clientes).set({ codigoAcesso: codigo }).where(eq(clientes.id, clienteId))
  return codigo
}

/* ── Busca cliente pelo código ───────────────────────────── */
export async function getClientePorCodigo(codigo: string) {
  const codigoUpper = codigo.toUpperCase().trim()
  const [cliente] = await db
    .select({
      id:             clientes.id,
      nome:           clientes.nome,
      telefone:       clientes.telefone,
      email:          clientes.email,
      codigoAcesso:   clientes.codigoAcesso,
      cashbackSaldo:  clientes.cashbackSaldo,
      cashbackTotal:  clientes.cashbackTotal,
      totalEventos:   clientes.totalEventos,
      ultimoEvento:   clientes.ultimoEvento,
      createdAt:      clientes.createdAt,
    })
    .from(clientes)
    .where(eq(clientes.codigoAcesso, codigoUpper))

  return cliente ?? null
}

/* ── Reservas do cliente (via telefone → eventos) ────────── */
export async function getReservasCliente(clienteId: string) {
  const [cliente] = await db.select({ telefone: clientes.telefone }).from(clientes).where(eq(clientes.id, clienteId))
  if (!cliente) return []

  return rawSql<Array<{
    id: string; nome_cliente: string; data_evento: string; horario_inicio: string
    horario_fim: string | null; endereco_completo: string; valor_total: string | null
    status: string; status_pagamento: string; observacoes: string | null
    cashback_ganho: number; brinquedos_nomes: string
  }>>`
    SELECT
      e.id, e.nome_cliente, e.data_evento, e.horario_inicio, e.horario_fim,
      e.endereco_completo, e.valor_total, e.status, e.status_pagamento, e.observacoes,
      COALESCE(
        (SELECT SUM(ct.valor) FROM cashback_transacoes ct
         WHERE ct.evento_id = e.id AND ct.tipo = 'credito'), 0
      ) AS cashback_ganho,
      COALESCE(
        (SELECT string_agg(b.nome, ', ') FROM brinquedos b
         WHERE b.id = ANY(e.brinquedos_contratados)), ''
      ) AS brinquedos_nomes
    FROM eventos e
    WHERE e.telefone_cliente = ${cliente.telefone}
       OR e.telefone_cliente ILIKE ${cliente.telefone.replace(/\D/g, '')}
    ORDER BY e.data_evento DESC
    LIMIT 50
  `
}

/* ── Histórico de cashback ───────────────────────────────── */
export async function getHistoricoCashback(clienteId: string) {
  return db
    .select({
      id:                  cashbackTransacoes.id,
      tipo:                cashbackTransacoes.tipo,
      valor:               cashbackTransacoes.valor,
      percentualAplicado:  cashbackTransacoes.percentualAplicado,
      descricao:           cashbackTransacoes.descricao,
      eventoId:            cashbackTransacoes.eventoId,
      createdAt:           cashbackTransacoes.createdAt,
    })
    .from(cashbackTransacoes)
    .where(eq(cashbackTransacoes.clienteId, clienteId))
    .orderBy(desc(cashbackTransacoes.createdAt))
    .limit(50)
}

/* ── Histórico interno (todos os clientes) ───────────────── */
export async function getHistoricoCashbackGlobal(opts?: { limit?: number; offset?: number }) {
  return rawSql<Array<{
    id: string; tipo: string; valor: string; percentual_aplicado: string | null
    descricao: string | null; evento_id: string | null; created_at: string
    cliente_id: string; cliente_nome: string; cliente_telefone: string
    cashback_saldo: string; data_evento: string | null; evento_valor_total: string | null
  }>>`
    SELECT ct.id, ct.tipo, ct.valor, ct.percentual_aplicado, ct.descricao,
           ct.evento_id, ct.created_at,
           c.id AS cliente_id, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
           c.cashback_saldo,
           e.data_evento, e.valor_total AS evento_valor_total
    FROM cashback_transacoes ct
    JOIN clientes c ON c.id = ct.cliente_id
    LEFT JOIN eventos e ON e.id = ct.evento_id
    ORDER BY ct.created_at DESC
    LIMIT ${opts?.limit ?? 200}
    OFFSET ${opts?.offset ?? 0}
  `
}

export async function getResumosCashbackGlobal() {
  const res = await rawSql<Array<Record<string, string | number>>>`
    SELECT
      COALESCE(SUM(CASE WHEN tipo = 'credito'  THEN valor::numeric ELSE 0 END), 0) AS total_creditado,
      COALESCE(SUM(CASE WHEN tipo = 'resgate'  THEN ABS(valor::numeric) ELSE 0 END), 0) AS total_resgatado,
      COALESCE(SUM(CASE WHEN tipo = 'expirado' THEN ABS(valor::numeric) ELSE 0 END), 0) AS total_expirado,
      COUNT(*) FILTER (WHERE tipo = 'credito')  AS qtd_creditos,
      COUNT(*) FILTER (WHERE tipo = 'resgate')  AS qtd_resgates,
      (SELECT COUNT(*) FROM clientes WHERE cashback_saldo::numeric > 0) AS clientes_com_saldo,
      (SELECT COALESCE(SUM(cashback_saldo::numeric),0) FROM clientes) AS saldo_em_circulacao
    FROM cashback_transacoes
  `
  return res[0] ?? {}
}

/* ── Roleta: giros disponíveis ───────────────────────────── */
export async function getGirosDisponiveis(clienteId: string): Promise<number> {
  const [cliente] = await db
    .select({ cashbackTotal: clientes.cashbackTotal, girosBonus: clientes.girosBonus })
    .from(clientes)
    .where(eq(clientes.id, clienteId))
  if (!cliente) return 0

  const totalCashback = parseFloat(String(cliente.cashbackTotal ?? '0'))
  const girosBonus    = Number(cliente.girosBonus ?? 0)

  const minConf = await getConfig('roleta_min_cashback')
  const min = parseFloat(minConf ?? '200')

  const girosPorCashback = min > 0 && totalCashback >= min ? Math.floor(totalCashback / min) : 0

  const [{ value: girosUsados }] = await db
    .select({ value: count() })
    .from(roletaGiros)
    .where(eq(roletaGiros.clienteId, clienteId))

  return Math.max(0, girosPorCashback + girosBonus - Number(girosUsados))
}

/* ── Admin: dar giros extras ─────────────────────────────── */
export async function darGirosBonus(clienteId: string, quantidade: number) {
  await rawSql`
    UPDATE clientes
    SET giros_bonus = giros_bonus + ${quantidade},
        updated_at  = NOW()
    WHERE id = ${clienteId}
  `
}

export async function getGirosBonusCliente(clienteId: string): Promise<number> {
  const [c] = await db
    .select({ girosBonus: clientes.girosBonus })
    .from(clientes)
    .where(eq(clientes.id, clienteId))
  return Number(c?.girosBonus ?? 0)
}

export async function getHistoricoGiros(clienteId: string) {
  return db
    .select()
    .from(roletaGiros)
    .where(eq(roletaGiros.clienteId, clienteId))
    .orderBy(desc(roletaGiros.createdAt))
}

export async function registrarGiro(clienteId: string, premio: { id: string; nome: string; descricao: string }) {
  const [giro] = await db.insert(roletaGiros).values({
    clienteId,
    premioId:   premio.id,
    premioNome: premio.nome,
    premioDesc: premio.descricao,
  }).returning()
  return giro
}

export async function creditarPremioRoleta(clienteId: string, valor: number, premioNome: string) {
  if (valor <= 0) return null

  const descricao = `Prêmio da roleta: ${premioNome}`
  const valorStr  = valor.toFixed(2)

  await db.insert(cashbackTransacoes).values({
    clienteId,
    eventoId:           null,
    tipo:               'credito' as const,
    valor:              valorStr,
    percentualAplicado: null,
    descricao,
  })

  // IMPORTANTE: atualiza apenas cashback_saldo (saldo disponível para usar como desconto).
  // NÃO atualiza cashback_total — o total histórico serve para calcular giros disponíveis
  // e só deve crescer com cashback de eventos reais, não com prêmios da roleta.
  await rawSql`
    UPDATE clientes
    SET cashback_saldo = cashback_saldo + ${valor},
        updated_at     = NOW()
    WHERE id = ${clienteId}
  `

  return { valorCreditado: valor, descricao }
}

/* ── Creditar cashback de um evento ─────────────────────── */
export async function creditarCashbackEvento(eventoId: string, clienteTelefone: string) {
  const [ativoConf, pctConf] = await Promise.all([
    getConfig('cashback_ativo'),
    getConfig('cashback_percentual'),
  ])
  if (ativoConf !== 'true') return null

  const percentual = parseFloat(pctConf ?? '5')

  // Buscar evento
  const [evento] = await db
    .select({ valorTotal: eventos.valorTotal, status: eventos.status })
    .from(eventos)
    .where(eq(eventos.id, eventoId))

  if (!evento || evento.status !== 'realizado') return null
  const valorTotal = parseFloat(String(evento.valorTotal ?? 0))
  if (valorTotal <= 0) return null

  // Buscar cliente pelo telefone
  const telefoneDigits = clienteTelefone.replace(/\D/g, '')
  const clienteRes = await rawSql<Array<{ id: string; cashback_saldo: number; cashback_total: number }>>`
    SELECT id, cashback_saldo, cashback_total FROM clientes
    WHERE regexp_replace(telefone, '[^0-9]', '', 'g') = ${telefoneDigits}
    LIMIT 1
  `
  const clienteRow = clienteRes[0] ?? null

  // Verificar se já foi creditado para este evento
  const [jaCreditado] = await db
    .select({ id: cashbackTransacoes.id })
    .from(cashbackTransacoes)
    .where(eq(cashbackTransacoes.eventoId, eventoId))

  if (jaCreditado) return null // já processado

  const valorCashback = parseFloat((valorTotal * percentual / 100).toFixed(2))

  // Se tem cliente cadastrado, creditar
  if (clienteRow) {
    await db.insert(cashbackTransacoes).values({
      clienteId:          clienteRow.id,
      eventoId,
      tipo:               'credito' as const,
      valor:              valorCashback.toFixed(2),
      percentualAplicado: percentual.toFixed(2),
      descricao:          `Cashback ${percentual}% do evento de R$ ${valorTotal.toFixed(2)}`,
    })

    await rawSql`
      UPDATE clientes
      SET cashback_saldo = cashback_saldo + ${valorCashback},
          cashback_total = cashback_total + ${valorCashback},
          updated_at = NOW()
      WHERE id = ${clienteRow.id}
    `
  }

  return { valorCashback, percentual, clienteId: clienteRow?.id ?? null }
}
