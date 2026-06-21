// One-off: add the `artifacts` JSON column to arena_chat (idempotent).
// Run with: bun run scripts/add-arena-artifacts-column.mjs   (bun auto-loads .env)
// We do a targeted ALTER instead of `drizzle-kit push` because push tries to reconcile the entire
// schema and aborts on unrelated pre-existing drift (e.g. a chunk_id primary key).
import postgres from 'postgres'

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL
if (!url) {
  console.error('No POSTGRES_URL / DATABASE_URL in env')
  process.exit(1)
}

const sql = postgres(url, { max: 1 })
try {
  await sql`ALTER TABLE arena_chat ADD COLUMN IF NOT EXISTS artifacts json NOT NULL DEFAULT '[]'::json`
  console.log('✓ arena_chat.artifacts column ensured')
} catch (e) {
  console.error('✗ failed:', e.message)
  process.exitCode = 1
} finally {
  await sql.end()
}
