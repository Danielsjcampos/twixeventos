-- ============================================================
-- TwixEventos — schema completo (self-hosted / Portainer)
-- GERADO do schema Drizzle (lib/db/schema.ts) — fonte da verdade.
-- Regerar: DATABASE_URL=postgres://x:x@localhost/x npx drizzle-kit export > /tmp/s.sql
--          e re-adicionar a seção SEEDS abaixo.
-- ============================================================

CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"nome" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);

CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" text NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"rotulo" text,
	"session_id" text,
	"device" text,
	"pais" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "brinquedos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"descricao" text,
	"categoria" text NOT NULL,
	"faixa_etaria" text NOT NULL,
	"capacidade" text NOT NULL,
	"dimensoes" text NOT NULL,
	"energia" text,
	"fotos" text[] DEFAULT '{}',
	"foto_destaque" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'publicado' NOT NULL,
	"destaque" boolean DEFAULT false NOT NULL,
	"ordem_destaque" integer DEFAULT 0 NOT NULL,
	"preco_referencia" numeric(10, 2),
	"monitores_necessarios" integer DEFAULT 1 NOT NULL,
	"tags" text[] DEFAULT '{}',
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" text,
	"video_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brinquedos_slug_unique" UNIQUE("slug")
);

CREATE TABLE "cashback_transacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"evento_id" uuid,
	"tipo" text NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"percentual_aplicado" numeric(5, 2),
	"descricao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"telefone" text NOT NULL,
	"email" text,
	"cpf" text,
	"data_nascimento" date,
	"endereco" text,
	"cidade" text,
	"origem" text DEFAULT 'site',
	"tipo_cliente" text DEFAULT 'fisica',
	"nome_empresa" text,
	"observacoes" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"total_eventos" integer DEFAULT 0 NOT NULL,
	"ultimo_evento" date,
	"codigo_acesso" text,
	"cashback_saldo" numeric(10, 2) DEFAULT '0' NOT NULL,
	"cashback_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"giros_bonus" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_telefone_unique" UNIQUE("telefone"),
	CONSTRAINT "clientes_codigo_acesso_unique" UNIQUE("codigo_acesso")
);

CREATE TABLE "configuracoes" (
	"chave" text PRIMARY KEY NOT NULL,
	"valor" text,
	"descricao" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "datas_comemorativas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"relacao" text NOT NULL,
	"data_nasc" date NOT NULL,
	"ano_nasc" integer,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "evento_monitores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"monitor_id" uuid NOT NULL,
	"valor_pago" numeric(10, 2),
	"confirmado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"nome_cliente" text NOT NULL,
	"telefone_cliente" text NOT NULL,
	"email_cliente" text,
	"data_evento" date NOT NULL,
	"horario_inicio" time NOT NULL,
	"horario_fim" time,
	"endereco_completo" text NOT NULL,
	"regiao_evento" text,
	"brinquedos_contratados" uuid[] DEFAULT '{}',
	"valor_total" numeric(10, 2),
	"valor_entrada" numeric(10, 2) DEFAULT '0',
	"valor_restante" numeric(10, 2) DEFAULT '0',
	"forma_pagamento" text DEFAULT 'pix',
	"status_pagamento" text DEFAULT 'pendente' NOT NULL,
	"custo_monitores" numeric(10, 2) DEFAULT '0',
	"custo_transporte" numeric(10, 2) DEFAULT '0',
	"custos_extras" numeric(10, 2) DEFAULT '0',
	"checklist_montagem" jsonb DEFAULT '[]'::jsonb,
	"checklist_desmontagem" jsonb DEFAULT '[]'::jsonb,
	"origem_cliente" text,
	"tipo_cliente" text,
	"status" text DEFAULT 'orcamento' NOT NULL,
	"observacoes" text,
	"valores_extras" jsonb DEFAULT '[]'::jsonb,
	"fotos_montagem" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "glossario_termos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"termo" text NOT NULL,
	"slug" text NOT NULL,
	"letra" text NOT NULL,
	"nicho" text NOT NULL,
	"conteudo" text,
	"status" text DEFAULT 'pendente' NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "glossario_termos_slug_unique" UNIQUE("slug")
);

CREATE TABLE "interacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"conteudo" text NOT NULL,
	"status_anterior" text,
	"status_novo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "lancamentos_financeiros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid,
	"monitor_id" uuid,
	"tipo" text NOT NULL,
	"descricao" text NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"forma" text DEFAULT 'pix',
	"status" text DEFAULT 'pago' NOT NULL,
	"data" date NOT NULL,
	"categoria" text,
	"comprovante" text,
	"observacoes" text,
	"criado_por" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"telefone" text NOT NULL,
	"email" text,
	"data_evento" date,
	"horario_evento" text,
	"endereco_evento" text,
	"regiao_evento" text,
	"brinquedos_interesse" text[] DEFAULT '{}',
	"mensagem" text,
	"origem" text DEFAULT 'site' NOT NULL,
	"status" text DEFAULT 'novo' NOT NULL,
	"motivo_perda" text,
	"valor_proposto" numeric(10, 2),
	"valor_sinal" numeric(10, 2),
	"prioridade" text DEFAULT 'normal' NOT NULL,
	"ultima_interacao" timestamp with time zone DEFAULT now() NOT NULL,
	"proximo_followup" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "monitores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"telefone" text NOT NULL,
	"cpf" text,
	"pix" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"valor_dia" numeric(10, 2),
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "pagamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento_id" uuid NOT NULL,
	"descricao" text NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"tipo" text DEFAULT 'receita' NOT NULL,
	"forma" text DEFAULT 'pix',
	"status" text DEFAULT 'pendente' NOT NULL,
	"data_prevista" date,
	"data_recebido" date,
	"comprovante" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "roleta_giros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"premio_nome" text NOT NULL,
	"premio_desc" text,
	"premio_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "usuarios_sistema" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"cargo" text,
	"role" text DEFAULT 'operador' NOT NULL,
	"permissoes" jsonb DEFAULT '{}'::jsonb,
	"ativo" boolean DEFAULT true NOT NULL,
	"ultimo_acesso" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_sistema_email_unique" UNIQUE("email")
);

ALTER TABLE "cashback_transacoes" ADD CONSTRAINT "cashback_transacoes_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cashback_transacoes" ADD CONSTRAINT "cashback_transacoes_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "datas_comemorativas" ADD CONSTRAINT "datas_comemorativas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "evento_monitores" ADD CONSTRAINT "evento_monitores_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "evento_monitores" ADD CONSTRAINT "evento_monitores_monitor_id_monitores_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitores"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "interacoes" ADD CONSTRAINT "interacoes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "lancamentos_financeiros_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "lancamentos_financeiros_monitor_id_monitores_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitores"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_evento_id_eventos_id_fk" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "roleta_giros" ADD CONSTRAINT "roleta_giros_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "analytics_tipo_idx" ON "analytics_events" USING btree ("tipo");
CREATE INDEX "analytics_path_idx" ON "analytics_events" USING btree ("path");
CREATE INDEX "analytics_created_idx" ON "analytics_events" USING btree ("created_at");
CREATE INDEX "idx_brinquedos_ativo" ON "brinquedos" USING btree ("ativo");
CREATE INDEX "idx_brinquedos_destaque" ON "brinquedos" USING btree ("destaque","ordem_destaque");
CREATE INDEX "idx_brinquedos_categoria" ON "brinquedos" USING btree ("categoria");
CREATE INDEX "idx_cashback_cliente" ON "cashback_transacoes" USING btree ("cliente_id");
CREATE INDEX "idx_cashback_evento" ON "cashback_transacoes" USING btree ("evento_id");
CREATE INDEX "idx_clientes_telefone" ON "clientes" USING btree ("telefone");
CREATE INDEX "idx_clientes_nome" ON "clientes" USING btree ("nome");
CREATE INDEX "idx_clientes_ativo" ON "clientes" USING btree ("ativo");
CREATE INDEX "idx_clientes_codigo" ON "clientes" USING btree ("codigo_acesso");
CREATE INDEX "idx_dc_cliente" ON "datas_comemorativas" USING btree ("cliente_id");
CREATE INDEX "idx_dc_data" ON "datas_comemorativas" USING btree ("data_nasc");
CREATE INDEX "idx_em_evento" ON "evento_monitores" USING btree ("evento_id");
CREATE INDEX "idx_em_monitor" ON "evento_monitores" USING btree ("monitor_id");
CREATE INDEX "idx_eventos_data" ON "eventos" USING btree ("data_evento");
CREATE INDEX "idx_eventos_status" ON "eventos" USING btree ("status");
CREATE INDEX "idx_eventos_status_pag" ON "eventos" USING btree ("status_pagamento");
CREATE INDEX "idx_glossario_letra" ON "glossario_termos" USING btree ("letra");
CREATE INDEX "idx_glossario_status" ON "glossario_termos" USING btree ("status");
CREATE INDEX "idx_glossario_slug" ON "glossario_termos" USING btree ("slug");
CREATE INDEX "idx_interacoes_lead" ON "interacoes" USING btree ("lead_id","created_at");
CREATE INDEX "idx_lf_data" ON "lancamentos_financeiros" USING btree ("data");
CREATE INDEX "idx_lf_tipo" ON "lancamentos_financeiros" USING btree ("tipo");
CREATE INDEX "idx_lf_evento" ON "lancamentos_financeiros" USING btree ("evento_id");
CREATE INDEX "idx_lf_status" ON "lancamentos_financeiros" USING btree ("status");
CREATE INDEX "idx_leads_status" ON "leads" USING btree ("status");
CREATE INDEX "idx_leads_data_evento" ON "leads" USING btree ("data_evento");
CREATE INDEX "idx_leads_ultima_interacao" ON "leads" USING btree ("ultima_interacao");
CREATE INDEX "idx_monitores_ativo" ON "monitores" USING btree ("ativo");
CREATE INDEX "idx_pag_evento" ON "pagamentos" USING btree ("evento_id");
CREATE INDEX "idx_pag_status" ON "pagamentos" USING btree ("status");
CREATE INDEX "idx_pag_tipo" ON "pagamentos" USING btree ("tipo");
CREATE INDEX "idx_roleta_cliente" ON "roleta_giros" USING btree ("cliente_id");
CREATE INDEX "idx_usuarios_email" ON "usuarios_sistema" USING btree ("email");
CREATE INDEX "idx_usuarios_role" ON "usuarios_sistema" USING btree ("role");

-- ============================================================
-- SEEDS
-- ============================================================

-- Configurações iniciais + flags das funcionalidades
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('nome_empresa',            'Twix Eventos', 'Nome da empresa'),
  ('whatsapp',                '',             'Número WhatsApp'),
  ('email_contato',           '',             'E-mail de contato'),
  ('cashback_percentual',     '5',            'Percentual de cashback'),
  ('site_ativo',              'true',         'Site público ativo'),
  ('tracking_ativo',          'true',         'Tracking de analytics first-party'),
  ('glossario_leitura_ativo', 'true',         'Modo de leitura ditada no glossário'),
  ('glossario_ads_ativo',     'true',         'CTAs in-content no glossário')
ON CONFLICT (chave) DO NOTHING;

-- Usuário admin inicial — login: daniel@twixeventos.com / senha: admin123
-- (troque a senha depois; hash bcrypt de 'admin123')
INSERT INTO admin_users (email, password_hash, nome) VALUES
  ('daniel@twixeventos.com', '$2b$10$j9qlALMrm9aQ0M35Erf3GudOxsKGwxPurNMZ4GdcB8pemOtXAU99m', 'Daniel Marques')
ON CONFLICT (email) DO NOTHING;
