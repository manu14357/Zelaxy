import { eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { decryptSecret } from '@/lib/utils'
import { db } from '@/db'
import { environment } from '@/db/schema'

const logger = createLogger('EnvironmentUtils')

/**
 * Load a user's environment variables with values decrypted. Used server-side to resolve provider
 * API keys (and pass env vars into provider/tool execution).
 */
export async function getDecryptedEnvironmentVariables(
  userId: string
): Promise<Record<string, string>> {
  try {
    const result = await db
      .select()
      .from(environment)
      .where(eq(environment.userId, userId))
      .limit(1)

    if (!result.length || !result[0].variables) return {}

    const encrypted = result[0].variables as Record<string, string>
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(encrypted)) {
      try {
        const { decrypted } = await decryptSecret(value)
        out[key] = decrypted
      } catch (error) {
        logger.error(`Failed to decrypt env var ${key}`, { error })
      }
    }
    return out
  } catch (error) {
    logger.error('Error loading decrypted environment variables:', error)
    return {}
  }
}

/**
 * Get environment variable keys for a user
 * Returns only the variable names, not their values
 */
export async function getEnvironmentVariableKeys(userId: string): Promise<{
  variableNames: string[]
  count: number
}> {
  try {
    const result = await db
      .select()
      .from(environment)
      .where(eq(environment.userId, userId))
      .limit(1)

    if (!result.length || !result[0].variables) {
      return {
        variableNames: [],
        count: 0,
      }
    }

    // Get the keys (variable names) without decrypting values
    const encryptedVariables = result[0].variables as Record<string, string>
    const variableNames = Object.keys(encryptedVariables)

    return {
      variableNames,
      count: variableNames.length,
    }
  } catch (error) {
    logger.error('Error getting environment variable keys:', error)
    throw new Error('Failed to get environment variables')
  }
}
