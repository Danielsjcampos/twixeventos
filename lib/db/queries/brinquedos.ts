import { db } from '../index'
import { brinquedos } from '../schema'
import { eq, and, asc, inArray, sql } from 'drizzle-orm'

// Colunas para listas — exclui fotos[] (base64 pesado) para reduzir tráfego
const listCols = {
  id:                   brinquedos.id,
  nome:                 brinquedos.nome,
  slug:                 brinquedos.slug,
  descricao:            brinquedos.descricao,
  categoria:            brinquedos.categoria,
  faixaEtaria:          brinquedos.faixaEtaria,
  capacidade:           brinquedos.capacidade,
  dimensoes:            brinquedos.dimensoes,
  energia:              brinquedos.energia,
  fotoDestaque:         brinquedos.fotoDestaque,
  ativo:                brinquedos.ativo,
  status:               brinquedos.status,
  destaque:             brinquedos.destaque,
  ordemDestaque:        brinquedos.ordemDestaque,
  precoReferencia:      brinquedos.precoReferencia,
  monitoresNecessarios: brinquedos.monitoresNecessarios,
  createdAt:            brinquedos.createdAt,
  updatedAt:            brinquedos.updatedAt,
}

export const getBrinquedosAtivos = () =>
  db.select(listCols).from(brinquedos).where(eq(brinquedos.status, 'publicado')).orderBy(asc(brinquedos.nome))

export const getBrinquedosDestaque = () =>
  db.select(listCols).from(brinquedos)
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
  db.select(listCols).from(brinquedos)
    .where(and(eq(brinquedos.status, 'publicado'), eq(brinquedos.categoria, categoria)))
    .orderBy(asc(brinquedos.nome))

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
