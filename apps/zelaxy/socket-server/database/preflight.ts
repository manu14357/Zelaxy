import { sql } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'

const logger = createLogger('SocketPreflight')

// Postgres SQLSTATE codes that mean the running schema is incompatible with this build
// (a missing column/table/function). These are NOT transient — retrying will never fix them, so
// the process should fail fast and let the orchestrator hold the old version until migrations run.
const SCHEMA_MISMATCH_CODES = new Set(['42703', '42P01', '42883'])

const MAX_ATTEMPTS = 5
const BASE_BACKOFF_MS = 500

function findSqlStateCode(error: unknown): string | undefined {
  let current: any = error
  const seen = new Set<any>()
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    if (typeof current.code === 'string') return current.code
    current = current.cause
  }
  return undefined
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Run a representative query against a table this server writes to, before it starts accepting
 * connections. If the schema is incompatible (missing column/table), fail fast so a half-migrated
 * deploy can't corrupt live collaboration. Transient connection errors are retried with backoff.
 *
 * Deliberately NOT part of the /health check — a momentary DB blip should not mass-terminate a
 * running fleet; this is a one-time startup gate only.
 */
export async function assertSchemaCompatibility(): Promise<void> {
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // Touch the columns the socket server actually reads/writes on the hot path.
      await db.execute(sql`SELECT id, workspace_id, variables, updated_at FROM workflow LIMIT 1`)
      await db.execute(sql`SELECT id, workflow_id, sub_blocks FROM workflow_blocks LIMIT 1`)
      logger.info('Schema preflight passed — workflow tables are compatible')
      return
    } catch (error) {
      lastError = error
      const code = findSqlStateCode(error)

      if (code && SCHEMA_MISMATCH_CODES.has(code)) {
        logger.error(
          `Schema preflight FAILED (SQLSTATE ${code}): the database schema is incompatible with this build. Run migrations (bun run db:push / db:migrate) before starting the socket server.`,
          error
        )
        throw new Error(`Socket-server schema preflight failed: SQLSTATE ${code}`)
      }

      // Transient/connection error — retry with backoff.
      if (attempt < MAX_ATTEMPTS) {
        const delay = BASE_BACKOFF_MS * 2 ** (attempt - 1)
        logger.warn(
          `Schema preflight attempt ${attempt}/${MAX_ATTEMPTS} failed (transient), retrying in ${delay}ms`,
          error
        )
        await sleep(delay)
      }
    }
  }

  logger.error('Schema preflight could not reach the database after retries', lastError)
  throw new Error('Socket-server schema preflight failed: database unreachable')
}
