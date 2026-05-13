import {
  pgTable, uuid, text, boolean, integer,
  decimal, date, time, timestamp, jsonb, index
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================
// brinquedos
// ============================================
export const brinquedos = pgTable('brinquedos', {
  id:              uuid('id').primaryKey().defaultRandom(),
  nome:            text('nome').notNull(),
  slug:            text('slug').notNull().unique(),
  descricao:       text('descricao'),
  categoria:       text('categoria').notNull(),
  faixaEtaria:     text('faixa_etaria').notNull(),
  capacidade:      text('capacidade').notNull(),
  dimensoes:       text('dimensoes').notNull(),
  energia:         text('energia'),
  fotos:           text('fotos').array().default([]),
  fotoDestaque:    text('foto_destaque'),
  ativo:           boolean('ativo').default(true).notNull(),
  destaque:        boolean('destaque').default(false).notNull(),
  ordemDestaque:   integer('ordem_destaque').default(0).notNull(),
  precoReferencia: decimal('preco_referencia', { precision: 10, scale: 2 }),
  monitoresNecessarios: integer('monitores_necessarios').default(1).notNull(),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_brinquedos_ativo').on(t.ativo),
  index('idx_brinquedos_destaque').on(t.destaque, t.ordemDestaque),
  index('idx_brinquedos_categoria').on(t.categoria),
])

// ============================================
// leads
// ============================================
export const leads = pgTable('leads', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  nome:                text('nome').notNull(),
  telefone:            text('telefone').notNull(),
  email:               text('email'),
  dataEvento:          date('data_evento'),
  horarioEvento:       text('horario_evento'),
  enderecoEvento:      text('endereco_evento'),
  regiaoEvento:        text('regiao_evento'),
  brinquedosInteresse: text('brinquedos_interesse').array().default([]),
  mensagem:            text('mensagem'),
  origem:              text('origem').default('site').notNull(),
  status:              text('status').default('novo').notNull(),
  motivoPerda:         text('motivo_perda'),
  valorProposto:       decimal('valor_proposto', { precision: 10, scale: 2 }),
  valorSinal:          decimal('valor_sinal', { precision: 10, scale: 2 }),
  prioridade:          text('prioridade').default('normal').notNull(),
  ultimaInteracao:     timestamp('ultima_interacao', { withTimezone: true }).defaultNow().notNull(),
  proximoFollowup:     timestamp('proximo_followup', { withTimezone: true }),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_leads_status').on(t.status),
  index('idx_leads_data_evento').on(t.dataEvento),
  index('idx_leads_ultima_interacao').on(t.ultimaInteracao),
])

// ============================================
// interacoes
// ============================================
export const interacoes = pgTable('interacoes', {
  id:             uuid('id').primaryKey().defaultRandom(),
  leadId:         uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  tipo:           text('tipo').notNull(),
  conteudo:       text('conteudo').notNull(),
  statusAnterior: text('status_anterior'),
  statusNovo:     text('status_novo'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_interacoes_lead').on(t.leadId, t.createdAt),
])

// ============================================
// monitores (funcionários)
// ============================================
export const monitores = pgTable('monitores', {
  id:        uuid('id').primaryKey().defaultRandom(),
  nome:      text('nome').notNull(),
  telefone:  text('telefone').notNull(),
  cpf:       text('cpf'),
  pix:       text('pix'),
  ativo:     boolean('ativo').default(true).notNull(),
  valorDia:  decimal('valor_dia', { precision: 10, scale: 2 }),
  observacoes: text('observacoes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_monitores_ativo').on(t.ativo),
])

// ============================================
// eventos (expandido com financeiro)
// ============================================
export const eventos = pgTable('eventos', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  leadId:                uuid('lead_id').references(() => leads.id),
  nomeCliente:           text('nome_cliente').notNull(),
  telefoneCliente:       text('telefone_cliente').notNull(),
  emailCliente:          text('email_cliente'),
  dataEvento:            date('data_evento').notNull(),
  horarioInicio:         time('horario_inicio').notNull(),
  horarioFim:            time('horario_fim'),
  enderecoCompleto:      text('endereco_completo').notNull(),
  regiaoEvento:          text('regiao_evento'),
  brinquedosContratados: uuid('brinquedos_contratados').array().default([]),
  // Financeiro
  valorTotal:            decimal('valor_total', { precision: 10, scale: 2 }),
  valorEntrada:          decimal('valor_entrada', { precision: 10, scale: 2 }).default('0'),
  valorRestante:         decimal('valor_restante', { precision: 10, scale: 2 }).default('0'),
  formaPagamento:        text('forma_pagamento').default('pix'),
  statusPagamento:       text('status_pagamento').default('pendente').notNull(),
  // Custos operacionais
  custoMonitores:        decimal('custo_monitores', { precision: 10, scale: 2 }).default('0'),
  custoTransporte:       decimal('custo_transporte', { precision: 10, scale: 2 }).default('0'),
  custosExtras:          decimal('custos_extras', { precision: 10, scale: 2 }).default('0'),
  // Checklists
  checklistMontagem:     jsonb('checklist_montagem').default([]),
  checklistDesmontagem:  jsonb('checklist_desmontagem').default([]),
  // Origem e tipo do cliente (Instagram, indicação, site, etc.)
  origemCliente:         text('origem_cliente'),
  tipoCliente:           text('tipo_cliente'), // fisica | empresa | cerimonialista | locador
  // Status do evento
  status:                text('status').default('orcamento').notNull(),
  observacoes:           text('observacoes'),
  fotosMontagem:         text('fotos_montagem').array().default([]),
  createdAt:             timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_eventos_data').on(t.dataEvento),
  index('idx_eventos_status').on(t.status),
  index('idx_eventos_status_pag').on(t.statusPagamento),
])

// ============================================
// evento_monitores (junction)
// ============================================
export const eventoMonitores = pgTable('evento_monitores', {
  id:         uuid('id').primaryKey().defaultRandom(),
  eventoId:   uuid('evento_id').notNull().references(() => eventos.id, { onDelete: 'cascade' }),
  monitorId:  uuid('monitor_id').notNull().references(() => monitores.id, { onDelete: 'cascade' }),
  valorPago:  decimal('valor_pago', { precision: 10, scale: 2 }),
  confirmado: boolean('confirmado').default(false).notNull(),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_em_evento').on(t.eventoId),
  index('idx_em_monitor').on(t.monitorId),
])

// ============================================
// pagamentos (parcelas do evento)
// ============================================
export const pagamentos = pgTable('pagamentos', {
  id:          uuid('id').primaryKey().defaultRandom(),
  eventoId:    uuid('evento_id').notNull().references(() => eventos.id, { onDelete: 'cascade' }),
  descricao:   text('descricao').notNull(),
  valor:       decimal('valor', { precision: 10, scale: 2 }).notNull(),
  tipo:        text('tipo').default('receita').notNull(), // receita | despesa
  forma:       text('forma').default('pix'),
  status:      text('status').default('pendente').notNull(), // pendente | recebido | cancelado
  dataPrevista: date('data_prevista'),
  dataRecebido: date('data_recebido'),
  comprovante:  text('comprovante'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_pag_evento').on(t.eventoId),
  index('idx_pag_status').on(t.status),
  index('idx_pag_tipo').on(t.tipo),
])

// ============================================
// usuarios_sistema
// ============================================
export const usuariosSistema = pgTable('usuarios_sistema', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        text('email').notNull().unique(),
  nome:         text('nome').notNull(),
  cargo:        text('cargo'),
  role:         text('role').default('operador').notNull(), // admin | operador | financeiro | viewer
  permissoes:   jsonb('permissoes').default({}),
  ativo:        boolean('ativo').default(true).notNull(),
  ultimoAcesso: timestamp('ultimo_acesso', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_usuarios_email').on(t.email),
  index('idx_usuarios_role').on(t.role),
])

// ============================================
// configuracoes
// ============================================
export const configuracoes = pgTable('configuracoes', {
  chave:     text('chave').primaryKey(),
  valor:     text('valor'),
  descricao: text('descricao'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================
// admin_users
// ============================================
export const adminUsers = pgTable('admin_users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nome:         text('nome').notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================
// Relations
// ============================================
export const leadsRelations = relations(leads, ({ many }) => ({
  interacoes: many(interacoes),
  eventos:    many(eventos),
}))

export const interacoesRelations = relations(interacoes, ({ one }) => ({
  lead: one(leads, { fields: [interacoes.leadId], references: [leads.id] }),
}))

export const eventosRelations = relations(eventos, ({ one, many }) => ({
  lead:           one(leads, { fields: [eventos.leadId], references: [leads.id] }),
  monitoresEvento: many(eventoMonitores),
  pagamentos:     many(pagamentos),
}))

export const monitoresRelations = relations(monitores, ({ many }) => ({
  eventos: many(eventoMonitores),
}))

export const eventoMonitoresRelations = relations(eventoMonitores, ({ one }) => ({
  evento:  one(eventos,  { fields: [eventoMonitores.eventoId],  references: [eventos.id] }),
  monitor: one(monitores, { fields: [eventoMonitores.monitorId], references: [monitores.id] }),
}))

export const pagamentosRelations = relations(pagamentos, ({ one }) => ({
  evento: one(eventos, { fields: [pagamentos.eventoId], references: [eventos.id] }),
}))
