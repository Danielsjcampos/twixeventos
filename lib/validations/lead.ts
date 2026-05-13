import { z } from 'zod'

export const leadSchema = z.object({
  nome:                z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  telefone:            z.string().min(10, 'Telefone inválido'),
  email:               z.string().email('Email inválido').optional().or(z.literal('')),
  dataEvento:          z.string().optional(),
  horarioEvento:       z.string().optional(),
  enderecoEvento:      z.string().optional(),
  regiaoEvento:        z.string().optional(),
  brinquedosInteresse: z.array(z.string()).default([]),
  mensagem:            z.string().optional(),
  origem:              z.string().default('site'),
})

export type LeadInput = z.infer<typeof leadSchema>

export const updateLeadSchema = z.object({
  status:        z.string().optional(),
  motivoPerda:   z.string().optional(),
  valorProposto: z.string().optional(),
  valorSinal:    z.string().optional(),
  prioridade:    z.enum(['normal', 'alta', 'urgente']).optional(),
  dataEvento:    z.string().optional(),
  enderecoEvento: z.string().optional(),
  brinquedosInteresse: z.array(z.string()).optional(),
})

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>

export const interacaoSchema = z.object({
  leadId:         z.string().uuid(),
  tipo:           z.enum(['whatsapp', 'ligacao', 'email', 'nota', 'sistema', 'status_change']),
  conteudo:       z.string().min(1, 'Conteúdo obrigatório'),
  statusAnterior: z.string().optional(),
  statusNovo:     z.string().optional(),
})

export type InteracaoInput = z.infer<typeof interacaoSchema>
