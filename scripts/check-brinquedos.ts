import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function run() {
  console.log('Querying brinquedos from Neon...')
  const data = await sql`SELECT id, nome, slug, status, ativo FROM brinquedos ORDER BY nome`
  
  console.log('\n--- Brinquedos & Slugs ---')
  for (const item of data) {
    const hasSpaces = item.slug.includes(' ') || item.slug.includes('%20')
    const startOrEndHyphen = item.slug.startsWith('-') || item.slug.endsWith('-')
    const hasStatusIssue = !['publicado', 'rascunho', 'invisivel'].includes(item.status)
    
    let statusText = 'OK'
    if (hasSpaces) statusText = '❌ CONTAINS SPACES/URLEncoded'
    else if (startOrEndHyphen) statusText = '⚠️ START/END HYPHEN'
    
    console.log(`- Nome: "${item.nome}"`)
    console.log(`  Slug: "${item.slug}" [${statusText}]`)
    console.log(`  ID: ${item.id} | Status: ${item.status} | Ativo: ${item.ativo}`)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
