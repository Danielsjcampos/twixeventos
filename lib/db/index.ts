import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const client = neon(process.env.DATABASE_URL!)
const rawDb = drizzle(client, { schema })

// Proxy db.execute para retornar as linhas diretamente como um Array (compatível com postgres-js)
// evitando erros de tipagem e quebras em consultas diretas por toda a aplicação
const originalExecute = rawDb.execute.bind(rawDb)
rawDb.execute = (async (query: any) => {
  const result = await originalExecute(query)
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray(result.rows)) {
    const rows = result.rows
    Object.defineProperties(rows, {
      rows: { value: rows, enumerable: false },
      fields: { value: (result as any).fields, enumerable: false },
      command: { value: (result as any).command, enumerable: false },
      rowCount: { value: (result as any).rowCount, enumerable: false },
    })
    return rows as any
  }
  return result
}) as any

export const db = rawDb as unknown as Omit<typeof rawDb, 'execute'> & {
  execute: <T = any>(query: any) => Promise<T[] & {
    rows: T[]
    fields: any[]
    command: string
    rowCount: number
  }>
}

export type DB = typeof db
