import { z } from 'zod'

export const brinquedoSchema = z.object({
  nome:            z.string().min(2, 'Nome obrigatório'),
  slug:            z.string().min(2, 'Slug obrigatório').regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  descricao:       z.string().optional(),
  categoria:       z.string().min(1, 'Categoria obrigatória'),
  faixaEtaria:     z.string().min(1, 'Faixa etária obrigatória'),
  capacidade:      z.string().min(1, 'Capacidade obrigatória'),
  dimensoes:       z.string().min(1, 'Dimensões obrigatórias'),
  energia:         z.string().optional(),
  fotos:           z.array(z.string()).default([]),
  fotoDestaque:    z.string().optional(),
  ativo:           z.boolean().default(true),
  destaque:        z.boolean().default(false),
  ordemDestaque:   z.number().default(0),
  precoReferencia: z.string().optional(),
})

export type BrinquedoInput = z.infer<typeof brinquedoSchema>

export const eventoSchema = z.object({
  leadId:                z.string().uuid().optional().nullable(),
  nomeCliente:           z.string().min(2, 'Nome obrigatório'),
  telefoneCliente:       z.string().min(10, 'Telefone inválido'),
  emailCliente:          z.string().optional().nullable(),
  dataEvento:            z.string().min(1, 'Data obrigatória'),
  horarioInicio:         z.string().min(1, 'Horário obrigatório'),
  horarioFim:            z.string().optional().nullable(),
  enderecoCompleto:      z.string().min(5, 'Endereço obrigatório'),
  regiaoEvento:          z.string().optional().nullable(),
  brinquedosContratados: z.array(z.string()).default([]),
  valorTotal:            z.string().optional().nullable(),
  valorEntrada:          z.string().optional().nullable(),
  valorRestante:         z.string().optional().nullable(),
  formaPagamento:        z.string().default('pix'),
  statusPagamento:       z.string().default('pendente'),
  custoMonitores:        z.string().optional().nullable(),
  custoTransporte:       z.string().optional().nullable(),
  custosExtras:          z.string().optional().nullable(),
  status:                z.string().default('confirmado'),
  observacoes:           z.string().optional().nullable(),
})

export type EventoInput = z.infer<typeof eventoSchema>
