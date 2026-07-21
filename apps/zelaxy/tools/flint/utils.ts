import type { FlintBaseParams } from '@/tools/flint/types'
import type { ToolConfig } from '@/tools/types'

/**
 * Base URL for the Flint Agent Tasks API as documented at https://www.flint.com/docs/api.
 */
export const FLINT_API_BASE_URL = 'https://app.tryflint.com/api/v1'

/**
 * Returns a shallow copy of the object with every `undefined` value removed,
 * so optional request-body fields that were never set are not sent to Flint.
 */
export function filterUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Builds the authentication headers required by every Flint endpoint.
 * Flint authenticates with an API key sent as a bearer token.
 */
export function flintHeaders(params: FlintBaseParams): Record<string, string> {
  return {
    Authorization: `Bearer ${params.apiKey.trim()}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Shared credential param definitions reused across all Flint tools.
 */
export const flintBaseParamFields = {
  apiKey: {
    type: 'string',
    required: true,
    visibility: 'user-only',
    description: 'Flint API key (found in Flint team settings, starts with ak_)',
  },
} satisfies ToolConfig['params']
