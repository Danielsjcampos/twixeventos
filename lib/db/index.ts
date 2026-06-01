import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

// VERSÃO PORTAINER / SELF-HOSTED
// Conecta a um PostgreSQL padrão via TCP (postgres-js), em vez do driver
// serverless da Neon (neon-http), que só fala com o endpoint HTTP da Neon.
//
// postgres-js é "lazy": só abre conexão na primeira query. Por isso o build
// (next build, sem DATABASE_URL) não quebra ao apenas importar este módulo.
const connectionString =
  process.env.DATABASE_URL ?? 'postgres://build:build@localhost:5432/build'

const client = postgres(connectionString)
const rawDb = drizzle(client, { schema })

// Compatibilidade: garante que db.execute(...) retorne um Array e exponha .rows,
// mantendo o comportamento esperado em toda a aplicação.
const originalExecute = rawDb.execute.bind(rawDb)
rawDb.execute = (async (query: any) => {
  const result: any = await originalExecute(query)
  const rows = Array.isArray(result) ? result : (result?.rows ?? result)
  if (Array.isArray(rows) && !('rows' in rows)) {
    Object.defineProperty(rows, 'rows', { value: rows, enumerable: false })
  }
  return rows
}) as any

export const db = rawDb as unknown as Omit<typeof rawDb, 'execute'> & {
  execute: <T = any>(query: any) => Promise<T[] & { rows: T[] }>
}

export type DB = typeof db
