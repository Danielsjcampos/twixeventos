import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function run() {
  // ── clientes ──
  await sql`
    CREATE TABLE IF NOT EXISTS clientes (
      id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      nome             text NOT NULL,
      telefone         text NOT NULL UNIQUE,
      email            text,
      cpf              text,
      data_nascimento  date,
      endereco         text,
      cidade           text,
      origem           text DEFAULT 'site',
      tipo_cliente     text DEFAULT 'fisica',
      nome_empresa     text,
      observacoes      text,
      ativo            boolean NOT NULL DEFAULT true,
      total_eventos    integer NOT NULL DEFAULT 0,
      ultimo_evento    date,
      created_at       timestamptz NOT NULL DEFAULT now(),
      updated_at       timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes (telefone)`
  await sql`CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes (nome)`
  await sql`CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes (ativo)`

  // ── datas_comemorativas ──
  await sql`
    CREATE TABLE IF NOT EXISTS datas_comemorativas (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      cliente_id   uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      nome         text NOT NULL,
      relacao      text NOT NULL,
      data_nasc    date NOT NULL,
      ano_nasc     integer,
      observacoes  text,
      created_at   timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_dc_cliente ON datas_comemorativas (cliente_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_dc_data ON datas_comemorativas (data_nasc)`

  // ── lancamentos_financeiros ──
  await sql`
    CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      evento_id    uuid REFERENCES eventos(id) ON DELETE SET NULL,
      monitor_id   uuid REFERENCES monitores(id) ON DELETE SET NULL,
      tipo         text NOT NULL,
      descricao    text NOT NULL,
      valor        decimal(10,2) NOT NULL,
      forma        text DEFAULT 'pix',
      status       text NOT NULL DEFAULT 'pago',
      data         date NOT NULL,
      categoria    text,
      comprovante  text,
      observacoes  text,
      criado_por   text,
      created_at   timestamptz NOT NULL DEFAULT now(),
      updated_at   timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_lf_data ON lancamentos_financeiros (data)`
  await sql`CREATE INDEX IF NOT EXISTS idx_lf_tipo ON lancamentos_financeiros (tipo)`
  await sql`CREATE INDEX IF NOT EXISTS idx_lf_evento ON lancamentos_financeiros (evento_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_lf_status ON lancamentos_financeiros (status)`

  // ── configuracoes para automações WhatsApp ──
  await sql`
    INSERT INTO configuracoes (chave, valor, descricao) VALUES
      ('whatsapp_api_url',       '',    'URL da API WhatsApp (ex: 0API)'),
      ('whatsapp_token',         '',    'Token de autenticação'),
      ('whatsapp_instance',      '',    'Instance ID'),
      ('whatsapp_ativo',         'false', 'Ativar envio de WhatsApp automático'),
      ('aniversario_dias_antes', '3',  'Dias antes do aniversário para enviar mensagem'),
      ('aniversario_mensagem',   'Olá {nome}! A Twix Eventos deseja um feliz aniversário para {aniversariante}! 🎉 Que seja um dia especial!', 'Mensagem de parabéns'),
      ('pesquisa_ativo',         'false', 'Enviar pesquisa pós-evento'),
      ('pesquisa_horas_apos',    '24',  'Horas após evento para enviar pesquisa'),
      ('pesquisa_mensagem',      'Olá {nome}! Esperamos que sua festa tenha sido incrível! Como foi sua experiência com a Twix Eventos? (Responda de 1 a 5)', 'Mensagem de pesquisa'),
      ('pesquisa_nota_minima',   '4',   'Nota mínima para enviar link do Google'),
      ('google_review_link',     '',    'Link de avaliação no Google Meu Negócio')
    ON CONFLICT (chave) DO NOTHING
  `

  console.log('✅ Tabelas clientes, datas_comemorativas e lancamentos_financeiros criadas!')
  console.log('✅ Configurações de automação WhatsApp inseridas!')
}

run().catch(e => { console.error(e); process.exit(1) })
