import { db } from '../lib/db'
import { configuracoes } from '../lib/db/schema'

async function main() {
  console.log("Buscando configurações no banco de dados...")
  try {
    const list = await db.select().from(configuracoes)
    console.log("Configurações encontradas:")
    list.forEach(c => {
      console.log(`- ${c.chave}: "${c.valor}"`)
    })
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
  }
}

main()
