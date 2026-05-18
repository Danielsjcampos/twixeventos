export const CURRENT_VERSION = '1.6.0'

export type ChangeType = 'feature' | 'fix' | 'improvement' | 'security'

export interface Change {
  type: ChangeType
  text: string
}

export interface Version {
  version: string
  date: string
  title: string
  changes: Change[]
}

export const CHANGELOG: Version[] = [
  {
    version: '1.6.0',
    date: '2026-05-18',
    title: 'Imagens 100% no banco — adeus Vercel Blob, CORS e SDK quebrado',
    changes: [
      { type: 'fix', text: 'Upload de fotos agora é 100% client-side: converte para WebP via Canvas API e salva como base64 data URL direto no PostgreSQL' },
      { type: 'fix', text: 'Resolve definitivamente o erro CORS / 400 do Vercel Blob em produção' },
      { type: 'improvement', text: 'Removida toda a infraestrutura de upload externo (Vercel Blob, sharp em runtime, /api/upload)' },
      { type: 'improvement', text: 'Funciona idêntico em localhost e em produção — sem variáveis de ambiente, sem tokens, sem buckets' },
      { type: 'improvement', text: 'WebP no browser continua reduzindo o tamanho da imagem em 60–80% antes de salvar' },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-05-18',
    title: 'Upload direto para Vercel Blob (cliente → storage)',
    changes: [
      { type: 'fix', text: 'Upload de imagens migrado para o padrão recomendado da Vercel: navegador envia direto para o Blob via @vercel/blob/client, bypassando a função serverless' },
      { type: 'improvement', text: 'Sem mais limite de 4.5MB do body da serverless — aceita até 20MB' },
      { type: 'improvement', text: 'Conversão para WebP continua acontecendo no browser (Canvas API), economizando 60-80% de espaço' },
      { type: 'improvement', text: 'Fallback automático para filesystem em desenvolvimento (sem necessidade do Vercel Blob local)' },
      { type: 'improvement', text: 'Logs detalhados de economia de espaço e tempo de upload no console do navegador' },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-05-18',
    title: 'Correção crítica de upload de imagens em produção',
    changes: [
      { type: 'fix', text: 'Adicionado `serverExternalPackages: [\'sharp\']` no next.config.ts — corrige erro 500 ao fazer upload no Vercel (sharp é binário nativo e não pode ser bundled)' },
      { type: 'fix', text: 'Hostname `*.public.blob.vercel-storage.com` adicionado aos remotePatterns do Next.js Image para exibir fotos salvas no Vercel Blob' },
      { type: 'feature', text: 'Histórico de versões adicionado ao painel admin com timeline completa' },
      { type: 'feature', text: 'Badge de versão atual visível na sidebar do admin com link para o changelog' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-05-18',
    title: 'CRM inteligente + captura de leads pelo WhatsApp',
    changes: [
      { type: 'feature', text: 'Botão flutuante do WhatsApp agora exibe mini-formulário de captura (nome + telefone) antes de abrir o chat' },
      { type: 'feature', text: 'Lead registrado automaticamente no CRM ao preencher o formulário do botão WhatsApp' },
      { type: 'feature', text: 'Cliente cadastrado automaticamente no módulo Clientes ao criar um novo lead no CRM' },
      { type: 'feature', text: 'Evento confirmado sincroniza o cliente no módulo Clientes (histórico de festas atualizado)' },
      { type: 'improvement', text: 'Formulário de brinquedos (ToyForm) reformulado: campos com fundo correto, toggle switches, seções organizadas' },
      { type: 'feature', text: 'Crédito de desenvolvedor adicionado no rodapé: Daniel Marques · 2TimeWeb' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-05-17',
    title: 'Upload de imagens com WebP + correção Vercel',
    changes: [
      { type: 'fix', text: 'Adicionado `sharp` como dependência direta no package.json (corrige falha no Vercel)' },
      { type: 'fix', text: 'Adicionado `serverExternalPackages: [\'sharp\']` no next.config.ts (corrige erro 500 no upload em produção)' },
      { type: 'improvement', text: 'Rota de upload detecta se imagem já é WebP (convertida no browser) e evita dupla conversão' },
      { type: 'improvement', text: 'Limite de upload aumentado para 20 MB com mensagem de erro clara' },
      { type: 'feature', text: 'Log de economia de espaço exibido no console ao fazer upload (ex: 2MB → 400KB −80%)' },
      { type: 'improvement', text: 'Hostname do Vercel Blob adicionado aos remotePatterns do Next.js Image' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-05-17',
    title: 'Roleta de prêmios + cashback para clientes',
    changes: [
      { type: 'feature', text: 'Roleta de prêmios na área do cliente com animação GSAP e confete canvas-confetti' },
      { type: 'feature', text: 'Prêmios configuráveis pelo admin: valor fixo (R$) ou percentual do cashback total' },
      { type: 'feature', text: 'Giros disponíveis calculados por: floor(cashbackTotal / mínimo) + giros bônus' },
      { type: 'feature', text: 'Admin pode dar giros bônus individuais para cada cliente' },
      { type: 'feature', text: 'Histórico de giros e prêmios ganhos visível na área do cliente' },
      { type: 'fix', text: 'Prêmios da roleta creditam apenas cashback_saldo (não inflam cashback_total, evitando giros infinitos)' },
      { type: 'feature', text: 'Confete disparado ao ganhar na roleta e ao resgatar cashback' },
      { type: 'improvement', text: 'Pesos configuráveis por prêmio para controle de raridade' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-13',
    title: 'Lançamento inicial do sistema',
    changes: [
      { type: 'feature', text: 'Painel administrativo completo com dashboard, eventos, clientes, financeiro e configurações' },
      { type: 'feature', text: 'CRM Kanban com drag-and-drop para gestão de leads' },
      { type: 'feature', text: 'Catálogo público de brinquedos com filtros por categoria' },
      { type: 'feature', text: 'Área do cliente com acesso via código TWX (sem login)' },
      { type: 'feature', text: 'Sistema de cashback automático por evento realizado' },
      { type: 'feature', text: 'Calendário de eventos e controle de monitores' },
      { type: 'feature', text: 'Autenticação de admin com NextAuth' },
      { type: 'feature', text: 'Deploy na Vercel com banco PostgreSQL (Neon)' },
    ],
  },
]
