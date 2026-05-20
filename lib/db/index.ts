import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

// Singleton para evitar múltiplas conexões em dev (hot reload)
const globalForDb = globalThis as unknown as { pgClient: postgres.Sql | undefined }

const client = globalForDb.pgClient ?? postgres(process.env.DATABASE_URL!, {
  max: 10,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? 'require' : false,
})

if (process.env.NODE_ENV !== 'production') globalForDb.pgClient = client

export const db = drizzle(client, { schema })
export const rawSql = client   // para queries SQL puras (ex: getBrinquedoHistorico)
export type DB = typeof db
