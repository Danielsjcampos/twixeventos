import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// Copy of improved slugify function to ensure correctness
function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function run() {
  console.log('Querying all brinquedos to check slugs...')
  const toys = await sql`SELECT id, nome, slug FROM brinquedos`
  
  let fixedCount = 0
  
  for (const toy of toys) {
    const clean = slugify(toy.slug || toy.nome)
    
    if (toy.slug !== clean) {
      console.log(`\nFound mismatch for: "${toy.nome}"`)
      console.log(`- Current: "${toy.slug}"`)
      console.log(`- Clean:   "${clean}"`)
      
      console.log(`Updating in database...`)
      await sql`UPDATE brinquedos SET slug = ${clean}, updated_at = NOW() WHERE id = ${toy.id}`
      console.log(`✅ Success!`)
      fixedCount++
    }
  }
  
  console.log(`\nDone! Total slugs fixed: ${fixedCount}`)
}

run().catch(e => { console.error(e); process.exit(1) })
