import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function run() {
  console.log('Adding column valores_extras to eventos table...')
  await sql`ALTER TABLE eventos ADD COLUMN IF NOT EXISTS valores_extras jsonb DEFAULT '[]'::jsonb`
  console.log('✅ Column valores_extras successfully created!')
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
