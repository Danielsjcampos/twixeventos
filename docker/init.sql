-- =============================================================
-- TwixEventos — Inicialização do banco de dados
-- Executado automaticamente pelo PostgreSQL na primeira vez
-- =============================================================

-- UUID gerado pelo banco
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- brinquedos
-- =============================================================
CREATE TABLE IF NOT EXISTS brinquedos (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                  TEXT        NOT NULL,
  slug                  TEXT        NOT NULL UNIQUE,
  descricao             TEXT,
  categoria             TEXT        NOT NULL,
  faixa_etaria          TEXT        NOT NULL,
  capacidade            TEXT        NOT NULL,
  dimensoes             TEXT        NOT NULL,
  energia               TEXT,
  fotos                 TEXT[]      DEFAULT '{}',
  foto_destaque         TEXT,
  ativo                 BOOLEAN     NOT NULL DEFAULT true,
  status                TEXT        NOT NULL DEFAULT 'publicado',
  destaque              BOOLEAN     NOT NULL DEFAULT false,
  ordem_destaque        INTEGER     NOT NULL DEFAULT 0,
  preco_referencia      DECIMAL(10,2),
  monitores_necessarios INTEGER     NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_brinquedos_ativo     ON brinquedos (ativo);
CREATE INDEX IF NOT EXISTS idx_brinquedos_destaque  ON brinquedos (destaque, ordem_destaque);
CREATE INDEX IF NOT EXISTS idx_brinquedos_categoria ON brinquedos (categoria);

-- =============================================================
-- leads
-- =============================================================
CREATE TABLE IF NOT EXISTS leads (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                 TEXT        NOT NULL,
  telefone             TEXT        NOT NULL,
  email                TEXT,
  data_evento          DATE,
  horario_evento       TEXT,
  endereco_evento      TEXT,
  regiao_evento        TEXT,
  brinquedos_interesse TEXT[]      DEFAULT '{}',
  mensagem             TEXT,
  origem               TEXT        NOT NULL DEFAULT 'site',
  status               TEXT        NOT NULL DEFAULT 'novo',
  motivo_perda         TEXT,
  valor_proposto       DECIMAL(10,2),
  valor_sinal          DECIMAL(10,2),
  prioridade           TEXT        NOT NULL DEFAULT 'normal',
  ultima_interacao     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  proximo_followup     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_status          ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_data_evento     ON leads (data_evento);
CREATE INDEX IF NOT EXISTS idx_leads_ultima_interacao ON leads (ultima_interacao);

-- =============================================================
-- interacoes
-- =============================================================
CREATE TABLE IF NOT EXISTS interacoes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo            TEXT        NOT NULL,
  conteudo        TEXT        NOT NULL,
  status_anterior TEXT,
  status_novo     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_interacoes_lead ON interacoes (lead_id, created_at);

-- =============================================================
-- monitores
-- =============================================================
CREATE TABLE IF NOT EXISTS monitores (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT        NOT NULL,
  telefone    TEXT        NOT NULL,
  cpf         TEXT,
  pix         TEXT,
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  valor_dia   DECIMAL(10,2),
  observacoes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_monitores_ativo ON monitores (ativo);

-- =============================================================
-- eventos
-- =============================================================
CREATE TABLE IF NOT EXISTS eventos (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                 UUID        REFERENCES leads(id),
  nome_cliente            TEXT        NOT NULL,
  telefone_cliente        TEXT        NOT NULL,
  email_cliente           TEXT,
  data_evento             DATE        NOT NULL,
  horario_inicio          TIME        NOT NULL,
  horario_fim             TIME,
  endereco_completo       TEXT        NOT NULL,
  regiao_evento           TEXT,
  brinquedos_contratados  UUID[]      DEFAULT '{}',
  valor_total             DECIMAL(10,2),
  valor_entrada           DECIMAL(10,2) DEFAULT 0,
  valor_restante          DECIMAL(10,2) DEFAULT 0,
  forma_pagamento         TEXT        DEFAULT 'pix',
  status_pagamento        TEXT        NOT NULL DEFAULT 'pendente',
  custo_monitores         DECIMAL(10,2) DEFAULT 0,
  custo_transporte        DECIMAL(10,2) DEFAULT 0,
  custos_extras           DECIMAL(10,2) DEFAULT 0,
  checklist_montagem      JSONB       DEFAULT '[]',
  checklist_desmontagem   JSONB       DEFAULT '[]',
  origem_cliente          TEXT,
  tipo_cliente            TEXT,
  status                  TEXT        NOT NULL DEFAULT 'orcamento',
  observacoes             TEXT,
  fotos_montagem          TEXT[]      DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eventos_data       ON eventos (data_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_status     ON eventos (status);
CREATE INDEX IF NOT EXISTS idx_eventos_status_pag ON eventos (status_pagamento);

-- =============================================================
-- evento_monitores
-- =============================================================
CREATE TABLE IF NOT EXISTS evento_monitores (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id   UUID        NOT NULL REFERENCES eventos(id)   ON DELETE CASCADE,
  monitor_id  UUID        NOT NULL REFERENCES monitores(id) ON DELETE CASCADE,
  valor_pago  DECIMAL(10,2),
  confirmado  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_em_evento  ON evento_monitores (evento_id);
CREATE INDEX IF NOT EXISTS idx_em_monitor ON evento_monitores (monitor_id);

-- =============================================================
-- pagamentos
-- =============================================================
CREATE TABLE IF NOT EXISTS pagamentos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id     UUID        NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  descricao     TEXT        NOT NULL,
  valor         DECIMAL(10,2) NOT NULL,
  tipo          TEXT        NOT NULL DEFAULT 'receita',
  forma         TEXT        DEFAULT 'pix',
  status        TEXT        NOT NULL DEFAULT 'pendente',
  data_prevista DATE,
  data_recebido DATE,
  comprovante   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pag_evento ON pagamentos (evento_id);
CREATE INDEX IF NOT EXISTS idx_pag_status ON pagamentos (status);
CREATE INDEX IF NOT EXISTS idx_pag_tipo   ON pagamentos (tipo);

-- =============================================================
-- usuarios_sistema
-- =============================================================
CREATE TABLE IF NOT EXISTS usuarios_sistema (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  nome          TEXT        NOT NULL,
  cargo         TEXT,
  role          TEXT        NOT NULL DEFAULT 'operador',
  permissoes    JSONB       DEFAULT '{}',
  ativo         BOOLEAN     NOT NULL DEFAULT true,
  ultimo_acesso TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios_sistema (email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role  ON usuarios_sistema (role);

-- =============================================================
-- configuracoes
-- =============================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  chave      TEXT        PRIMARY KEY,
  valor      TEXT,
  descricao  TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurações padrão
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('nome_empresa',       'Twix Eventos',          'Nome da empresa'),
  ('whatsapp',           '',                       'Número WhatsApp'),
  ('email_contato',      '',                       'E-mail de contato'),
  ('cashback_percentual','5',                      'Percentual de cashback'),
  ('site_ativo',         'true',                   'Site público ativo')
ON CONFLICT (chave) DO NOTHING;

-- =============================================================
-- clientes
-- =============================================================
CREATE TABLE IF NOT EXISTS clientes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             TEXT        NOT NULL,
  telefone         TEXT        NOT NULL UNIQUE,
  email            TEXT,
  cpf              TEXT,
  data_nascimento  DATE,
  endereco         TEXT,
  cidade           TEXT,
  origem           TEXT        DEFAULT 'site',
  tipo_cliente     TEXT        DEFAULT 'fisica',
  nome_empresa     TEXT,
  observacoes      TEXT,
  ativo            BOOLEAN     NOT NULL DEFAULT true,
  total_eventos    INTEGER     NOT NULL DEFAULT 0,
  ultimo_evento    DATE,
  codigo_acesso    TEXT        UNIQUE,
  cashback_saldo   DECIMAL(10,2) NOT NULL DEFAULT 0,
  cashback_total   DECIMAL(10,2) NOT NULL DEFAULT 0,
  giros_bonus      INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes (telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_nome     ON clientes (nome);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo    ON clientes (ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_codigo   ON clientes (codigo_acesso);

-- =============================================================
-- datas_comemorativas
-- =============================================================
CREATE TABLE IF NOT EXISTS datas_comemorativas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID        NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome        TEXT        NOT NULL,
  relacao     TEXT        NOT NULL,
  data_nasc   DATE        NOT NULL,
  ano_nasc    INTEGER,
  observacoes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dc_cliente ON datas_comemorativas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_dc_data    ON datas_comemorativas (data_nasc);

-- =============================================================
-- lancamentos_financeiros
-- =============================================================
CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id   UUID        REFERENCES eventos(id)   ON DELETE SET NULL,
  monitor_id  UUID        REFERENCES monitores(id) ON DELETE SET NULL,
  tipo        TEXT        NOT NULL,
  descricao   TEXT        NOT NULL,
  valor       DECIMAL(10,2) NOT NULL,
  forma       TEXT        DEFAULT 'pix',
  status      TEXT        NOT NULL DEFAULT 'pago',
  data        DATE        NOT NULL,
  categoria   TEXT,
  comprovante TEXT,
  observacoes TEXT,
  criado_por  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lf_data    ON lancamentos_financeiros (data);
CREATE INDEX IF NOT EXISTS idx_lf_tipo    ON lancamentos_financeiros (tipo);
CREATE INDEX IF NOT EXISTS idx_lf_evento  ON lancamentos_financeiros (evento_id);
CREATE INDEX IF NOT EXISTS idx_lf_status  ON lancamentos_financeiros (status);

-- =============================================================
-- admin_users
-- =============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  nome          TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- cashback_transacoes
-- =============================================================
CREATE TABLE IF NOT EXISTS cashback_transacoes (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id          UUID        NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  evento_id           UUID        REFERENCES eventos(id) ON DELETE SET NULL,
  tipo                TEXT        NOT NULL,
  valor               DECIMAL(10,2) NOT NULL,
  percentual_aplicado DECIMAL(5,2),
  descricao           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cashback_cliente ON cashback_transacoes (cliente_id);
CREATE INDEX IF NOT EXISTS idx_cashback_evento  ON cashback_transacoes (evento_id);

-- =============================================================
-- roleta_giros
-- =============================================================
CREATE TABLE IF NOT EXISTS roleta_giros (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID        NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  premio_nome TEXT        NOT NULL,
  premio_desc TEXT,
  premio_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_roleta_cliente ON roleta_giros (cliente_id);
