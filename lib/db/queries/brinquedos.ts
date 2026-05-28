import { db } from '../index'
import { brinquedos } from '../schema'
import { eq, and, asc, inArray, sql } from 'drizzle-orm'

// Colunas para listas PÚBLICAS — sem fotos/fotoDestaque (base64, muito pesado)
// Imagens são servidas via /api/public/img/[id] com Cache-Control adequado
const publicListCols = {
  id:                   brinquedos.id,
  nome:                 brinquedos.nome,
  slug:                 brinquedos.slug,
  descricao:            brinquedos.descricao,
  categoria:            brinquedos.categoria,
  faixaEtaria:          brinquedos.faixaEtaria,
  capacidade:           brinquedos.capacidade,
  dimensoes:            brinquedos.dimensoes,
  energia:              brinquedos.energia,
  ativo:                brinquedos.ativo,
  status:               brinquedos.status,
  destaque:             brinquedos.destaque,
  ordemDestaque:        brinquedos.ordemDestaque,
  precoReferencia:      brinquedos.precoReferencia,
  monitoresNecessarios: brinquedos.monitoresNecessarios,
  tags:                 brinquedos.tags,
  seoTitle:             brinquedos.seoTitle,
  seoDescription:       brinquedos.seoDescription,
  seoKeywords:          brinquedos.seoKeywords,
  createdAt:            brinquedos.createdAt,
  updatedAt:            brinquedos.updatedAt,
}

// Colunas para listas ADMIN — inclui fotoDestaque para thumbnail no painel
const listCols = {
  ...publicListCols,
  fotoDestaque: brinquedos.fotoDestaque,
}

export const getBrinquedosAtivos = () =>
  db.select(publicListCols).from(brinquedos).where(eq(brinquedos.status, 'publicado')).orderBy(asc(brinquedos.nome))

export const getBrinquedosDestaque = () =>
  db.select(publicListCols).from(brinquedos)
    .where(and(eq(brinquedos.status, 'publicado'), eq(brinquedos.destaque, true)))
    .orderBy(asc(brinquedos.ordemDestaque))

export const getBrinquedoBySlug = async (slug: string) =>
  db.select().from(brinquedos)
    .where(and(eq(brinquedos.slug, slug), inArray(brinquedos.status, ['publicado', 'invisivel'])))
    .limit(1).then(r => r[0] ?? null)

export const getBrinquedoById = async (id: string) =>
  db.select().from(brinquedos).where(eq(brinquedos.id, id)).limit(1).then(r => r[0] ?? null)

export const getAllBrinquedosAdmin = () =>
  db.select(listCols).from(brinquedos).orderBy(asc(brinquedos.nome))

export const toggleDestaque = (id: string, value: boolean) =>
  db.update(brinquedos).set({ destaque: value, updatedAt: new Date() }).where(eq(brinquedos.id, id))

export const toggleAtivo = (id: string, value: boolean) =>
  db.update(brinquedos).set({ ativo: value, updatedAt: new Date() }).where(eq(brinquedos.id, id))

export const createBrinquedo = (data: typeof brinquedos.$inferInsert) =>
  db.insert(brinquedos).values(data).returning().then(r => r[0])

export const updateBrinquedo = (id: string, data: Partial<typeof brinquedos.$inferInsert>) =>
  db.update(brinquedos).set({ ...data, updatedAt: new Date() }).where(eq(brinquedos.id, id)).returning().then(r => r[0])

export const deleteBrinquedo = (id: string) =>
  db.delete(brinquedos).where(eq(brinquedos.id, id))

export const getBrinquedosByCategoria = (categoria: string) =>
  db.select(publicListCols).from(brinquedos)
    .where(and(eq(brinquedos.status, 'publicado'), eq(brinquedos.categoria, categoria)))
    .orderBy(asc(brinquedos.nome))

export const getBrinquedosChartData = async () => {
  const [maisLocados, maisReceita, maisLeads, maisOrcamentos] = await Promise.all([
    // Top 8 mais locados (eventos realizados/confirmados)
    db.execute(sql`
      SELECT b.nome, COUNT(*)::int AS total
      FROM eventos e
      CROSS JOIN LATERAL unnest(e.brinquedos_contratados) AS toy_id
      JOIN brinquedos b ON b.id = toy_id
      WHERE e.status IN ('realizado', 'confirmado')
      GROUP BY b.nome ORDER BY total DESC LIMIT 8
    `),
    // Top 8 maior receita gerada por brinquedo
    db.execute(sql`
      SELECT b.nome,
        ROUND(COALESCE(SUM(
          e.valor_total::numeric / NULLIF(array_length(e.brinquedos_contratados,1),0)
        ), 0))::int AS total
      FROM eventos e
      CROSS JOIN LATERAL unnest(e.brinquedos_contratados) AS toy_id
      JOIN brinquedos b ON b.id = toy_id
      WHERE e.status IN ('realizado', 'confirmado')
      GROUP BY b.nome ORDER BY total DESC LIMIT 8
    `),
    // Top 8 mais aparece nos leads (brinquedos_interesse)
    db.execute(sql`
      SELECT b_nome, COUNT(*)::int AS total
      FROM leads, LATERAL unnest(brinquedos_interesse) AS b_nome
      GROUP BY b_nome ORDER BY total DESC LIMIT 8
    `),
    // Top 8 mais aparece em leads ativos (não perdidos)
    db.execute(sql`
      SELECT b_nome, COUNT(*)::int AS total
      FROM leads, LATERAL unnest(brinquedos_interesse) AS b_nome
      WHERE status NOT IN ('perdido', 'cancelado')
      GROUP BY b_nome ORDER BY total DESC LIMIT 8
    `),
  ])
  return {
    maisLocados:    maisLocados    as unknown as { nome: string; total: number }[],
    maisReceita:    maisReceita    as unknown as { nome: string; total: number }[],
    maisLeads:      maisLeads      as unknown as { nome: string; total: number }[],
    maisOrcamentos: maisOrcamentos as unknown as { nome: string; total: number }[],
  }
}

export const getBrinquedoHistorico = async (brinquedoId: string) => {
  const [locacoes, topClientes] = await Promise.all([
    db.execute(sql`
      SELECT id, nome_cliente, telefone_cliente, data_evento, valor_total, status
      FROM eventos
      WHERE ${brinquedoId}::uuid = ANY(brinquedos_contratados)
      ORDER BY data_evento DESC
      LIMIT 20
    `),
    db.execute(sql`
      SELECT nome_cliente, telefone_cliente, COUNT(*)::int as total
      FROM eventos
      WHERE ${brinquedoId}::uuid = ANY(brinquedos_contratados)
      GROUP BY nome_cliente, telefone_cliente
      ORDER BY total DESC
      LIMIT 5
    `),
  ])
  return { locacoes: locacoes as unknown[], topClientes: topClientes as unknown[] }
}
