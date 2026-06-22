import { eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { decryptSecret, encryptSecret } from '@/lib/utils'
import { db } from '@/db'
import { environment } from '@/db/schema'

const logger = createLogger('EnvironmentUtils')

/**
 * Merge + encrypt + upsert a user's environment variables IN-PROCESS (no HTTP round-trip).
 * Only new/changed values are re-encrypted; unchanged ones keep their existing ciphertext.
 * Shared by the /api/environment/variables PUT route and the copilot set_environment_variables tool.
 */
export async function setEnvironmentVariablesForUser(
  userId: string,
  variables: Record<string, string>
): Promise<{
  variableNames: string[]
  addedVariables: string[]
  updatedVariables: string[]
  totalVariableCount: number
}> {
  const existingData = await db
    .select()
    .from(environment)
    .where(eq(environment.userId, userId))
    .limit(1)

  const existingEncrypted = (existingData[0]?.variables as Record<string, string>) || {}

  const toEncrypt: Record<string, string> = {}
  const addedVariables: string[] = []
  const updatedVariables: string[] = []

  for (const [key, newValue] of Object.entries(variables)) {
    if (!(key in existingEncrypted)) {
      toEncrypt[key] = newValue
      addedVariables.push(key)
      continue
    }
    try {
      const { decrypted: existingValue } = await decryptSecret(existingEncrypted[key])
      if (existingValue !== newValue) {
        toEncrypt[key] = newValue
        updatedVariables.push(key)
      }
    } catch (decryptError) {
      logger.warn(`Could not decrypt existing variable ${key}, re-encrypting`, {
        error: decryptError,
      })
      toEncrypt[key] = newValue
      updatedVariables.push(key)
    }
  }

  const newlyEncrypted: Record<string, string> = {}
  for (const [key, value] of Object.entries(toEncrypt)) {
    const { encrypted } = await encryptSecret(value)
    newlyEncrypted[key] = encrypted
  }

  const finalEncrypted = { ...existingEncrypted, ...newlyEncrypted }

  await db
    .insert(environment)
    .values({
      id: crypto.randomUUID(),
      userId,
      variables: finalEncrypted,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [environment.userId],
      set: { variables: finalEncrypted, updatedAt: new Date() },
    })

  return {
    variableNames: Object.keys(variables),
    addedVariables,
    updatedVariables,
    totalVariableCount: Object.keys(finalEncrypted).length,
  }
}

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
