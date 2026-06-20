/**
 * Enrichment cascade runner (server-only — imports executeTool which pulls in tool/DB code).
 *
 * Tries each provider in order; the first to return a non-empty mapped result wins. A provider is
 * skipped when buildParams returns null (insufficient inputs). The provider's API key is injected
 * from ctx.credentials[provider.id]. When every provider that ran errored, `error` is set so the
 * caller can distinguish an infra failure from a clean "no match".
 */

import type { EnrichmentConfig, EnrichmentRunContext } from '@/lib/enrichments/types'
import { createLogger } from '@/lib/logs/console/logger'
import { executeTool } from '@/tools'

const logger = createLogger('Enrichments')

export interface EnrichmentRunOutcome {
  result: Record<string, unknown>
  error: string | null
  provider: string | null
}

function hasResult(result: Record<string, unknown>): boolean {
  return Object.values(result).some((v) => v !== undefined && v !== null && v !== '')
}

export async function runEnrichment(
  enrichment: EnrichmentConfig,
  inputs: Record<string, unknown>,
  ctx: EnrichmentRunContext
): Promise<EnrichmentRunOutcome> {
  let ranCount = 0
  let errorCount = 0
  let lastError: string | null = null

  for (const provider of enrichment.providers) {
    if (ctx.signal?.aborted) break
    const params = provider.buildParams(inputs)
    if (!params) continue
    ranCount++
    try {
      const apiKey = ctx.credentials?.[provider.id]
      const response = await executeTool(
        provider.toolId,
        {
          ...params,
          ...(apiKey ? { apiKey } : {}),
          ...(ctx.workspaceId ? { _context: { workspaceId: ctx.workspaceId } } : {}),
        },
        true
      )
      if (!response.success) {
        const status = (response.output as { status?: unknown } | undefined)?.status
        if (status === 404) continue // clean no-match
        throw new Error(response.error ?? `${provider.toolId} failed`)
      }
      const result = provider.mapOutput(response.output as Record<string, unknown>)
      if (result && hasResult(result)) {
        logger.info('Enrichment hit', { enrichmentId: enrichment.id, provider: provider.id })
        return { result, error: null, provider: provider.label }
      }
    } catch (err) {
      errorCount++
      lastError = err instanceof Error ? err.message : String(err)
      logger.warn('Enrichment provider failed; trying next', {
        enrichmentId: enrichment.id,
        provider: provider.id,
        error: lastError,
      })
    }
  }

  const error = ranCount > 0 && errorCount === ranCount ? lastError : null
  return { result: {}, error, provider: null }
}
