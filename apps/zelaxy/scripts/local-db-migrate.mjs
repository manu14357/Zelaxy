// One-time local migration WITHOUT pgvector.
// Applies all Drizzle migrations to the local `zelaxy` DB, but stores embedding
// columns as `jsonb` (instead of `vector(N)`) and skips the HNSW vector indexes,
// because pgvector cannot be installed on this machine (no admin / no compiler).
// Records each migration in drizzle.__drizzle_migrations so `db:migrate` is a no-op.
//
// Run from apps/zelaxy:  bun run scripts/local-db-migrate.mjs
//
// To restore real vector columns later: install pgvector, then
//   ALTER TABLE docs_embeddings ALTER COLUMN embedding TYPE vector(1536) USING embedding::text::vector;
//   (and the embedding/image_embedding tables) + recreate the HNSW indexes.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const MIG = path.join(process.cwd(), 'db', 'migrations')
const journal = JSON.parse(readFileSync(path.join(MIG, 'meta', '_journal.json'), 'utf8'))

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '12345',
  database: 'zelaxy',
})

await client.connect()
console.log('connected to zelaxy as postgres')

await client.query('CREATE SCHEMA IF NOT EXISTS drizzle')
await client.query(
  'CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)'
)

let applied = 0
let skipped = 0

for (const entry of [...journal.entries].sort((a, b) => a.idx - b.idx)) {
  const original = readFileSync(path.join(MIG, `${entry.tag}.sql`), 'utf8')
  const hash = createHash('sha256').update(original).digest('hex')

  const { rows } = await client.query(
    'SELECT 1 FROM drizzle."__drizzle_migrations" WHERE hash = $1',
    [hash]
  )
  if (rows.length) {
    console.log(`skip   ${entry.tag} (already recorded)`)
    skipped++
    continue
  }

  // Neutralize pgvector-specific DDL for a local DB without the extension.
  const patched = original
    .replace(/vector\(\d+\)/g, 'jsonb')
    .split('\n')
    .filter((line) => !/USING hnsw/i.test(line))
    .join('\n')
    .replace(/--> statement-breakpoint/g, '')

  try {
    await client.query(patched) // multi-statement = single implicit transaction
    await client.query(
      'INSERT INTO drizzle."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
      [hash, entry.when]
    )
    console.log(`apply  ${entry.tag}`)
    applied++
  } catch (e) {
    console.error(`\nFAILED on ${entry.tag}:\n${e.message}`)
    await client.end()
    process.exit(1)
  }
}

const tables = await client.query(
  "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'"
)
console.log(`\nDone. applied=${applied} skipped=${skipped} | public tables: ${tables.rows[0].n}`)
await client.end()
