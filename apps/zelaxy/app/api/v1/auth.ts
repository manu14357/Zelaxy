import { eq } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { apiKey as apiKeyTable } from '@/db/schema'

const logger = createLogger('V1Auth')

export interface AuthResult {
  authenticated: boolean
  userId?: string
  error?: string
}

/**
 * Authenticate a v1 API request.
 * Priority: x-api-key header → session cookie (dev fallback).
 */
export async function authenticateV1Request(request: NextRequest): Promise<AuthResult> {
  const apiKey = request.headers.get('x-api-key')

  if (apiKey) {
    try {
      const [record] = await db
        .select({ id: apiKeyTable.id, userId: apiKeyTable.userId })
        .from(apiKeyTable)
        .where(eq(apiKeyTable.key, apiKey))
        .limit(1)

      if (!record) {
        logger.warn('Invalid API key attempted', { keyPrefix: apiKey.slice(0, 8) })
        return { authenticated: false, error: 'Invalid API key' }
      }

      // Update lastUsed asynchronously — do not block the response
      db.update(apiKeyTable)
        .set({ lastUsed: new Date() })
        .where(eq(apiKeyTable.id, record.id))
        .catch((err) => logger.error('Failed to update API key lastUsed', { err }))

      return { authenticated: true, userId: record.userId }
    } catch (error) {
      logger.error('API key authentication error', { error })
      return { authenticated: false, error: 'Authentication failed' }
    }
  }

  // Fall back to session cookie for browser-based access
  try {
    const session = await getSession()
    if (session?.user?.id) {
      return { authenticated: true, userId: session.user.id }
    }
  } catch {
    // Session check failed — not an error, just no session
  }

  return { authenticated: false, error: 'API key required. Provide the x-api-key header.' }
}
