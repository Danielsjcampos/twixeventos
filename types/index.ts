export type Brinquedo = {
  id: string
  nome: string
  slug: string
  descricao: string | null
  categoria: string
  faixaEtaria: string
  capacidade: string
  dimensoes: string
  energia: string | null
  fotos: string[] | null
  fotoDestaque: string | null
  ativo: boolean
  destaque: boolean
  ordemDestaque: number
  precoReferencia: string | null
  createdAt: Date
  updatedAt: Date
}

export type Lead = {
  id: string
  nome: string
  telefone: string
  email: string | null
  dataEvento: string | null
  horarioEvento: string | null
  enderecoEvento: string | null
  brinquedosInteresse: string[] | null
  mensagem: string | null
  origem: string
  status: string
  motivoPerda: string | null
  valorProposto: string | null
  valorSinal: string | null
  prioridade: string
  ultimaInteracao: Date
  proximoFollowup: Date | null
  createdAt: Date
  updatedAt: Date
}

export type Interacao = {
  id: string
  leadId: string
  tipo: string
  conteudo: string
  statusAnterior: string | null
  statusNovo: string | null
  createdAt: Date
}

export type LeadComInteracoes = Lead & { interacoes: Interacao[] }

export type ChecklistItem = {
  id: string
  texto: string
  concluido: boolean
}

export interface HeroSlide {
  id: string
  tipo: 'imagem' | 'video' | 'gradiente' | 'cor'
  fundoUrl: string
  fundoCor: string
  overlay: number
  titulo: string
  tituloDestaque: string
  subtitulo: string
  badge: string
  ctaTexto: string
  ctaLink: string
  ctaTexto2: string
  ctaLink2: string
  ativo: boolean
}

export type Evento = {
  id: string
  leadId: string | null
  nomeCliente: string
  telefoneCliente: string
  dataEvento: string
  horarioInicio: string
  horarioFim: string | null
  enderecoCompleto: string
  brinquedosContratados: string[] | null
  valorTotal: string | null
  valorSinalRecebido: string | null
  checklistMontagem: ChecklistItem[]
  checklistDesmontagem: ChecklistItem[]
  status: string
  observacoes: string | null
  createdAt: Date
  updatedAt: Date
}

export type DashboardMetrics = {
  leadsHoje: number
  leadsAbertos: number
  eventosEstaSemana: number
  receitaMes: number
  taxaConversao: number
  leadsPerdidosMes: number
}

export type KanbanColumn = {
  id: string
  label: string
  cor: string
  leads: Lead[]
}
