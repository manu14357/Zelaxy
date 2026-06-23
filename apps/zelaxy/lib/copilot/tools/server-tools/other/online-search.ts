import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { executeTool } from '@/tools'
import { BaseCopilotTool } from '../base'

interface OnlineSearchParams {
  query: string
  num?: number
  type?: string
  gl?: string
  hl?: string
  /** Workspace-configured API keys injected by the arena route (win over process env). */
  _env?: Record<string, string | undefined>
}

interface OnlineSearchResult {
  results: any[]
  query: string
  type: string
  totalResults: number
}

class OnlineSearchTool extends BaseCopilotTool<OnlineSearchParams, OnlineSearchResult> {
  readonly id = 'search_online'
  readonly displayName = 'Searching online'

  protected async executeImpl(params: OnlineSearchParams): Promise<OnlineSearchResult> {
    return onlineSearch(params)
  }
}

// Export the tool instance
export const onlineSearchTool = new OnlineSearchTool()

// Implementation function
async function onlineSearch(params: OnlineSearchParams): Promise<OnlineSearchResult> {
  const logger = createLogger('OnlineSearch')
  const { query, num = 10, type = 'search', gl, hl } = params
  const exaKey = params._env?.EXA_API_KEY || env.EXA_API_KEY
  const serperKey = params._env?.SERPER_API_KEY || env.SERPER_API_KEY || ''

  logger.info('Performing online search', { query, num, type, gl, hl })

  // Primary: Exa AI (the provider the reference research agent uses). Falls back to Serper (Google)
  // when no Exa key is configured or Exa returns nothing — the reference's exact fallback order.
  if (exaKey) {
    try {
      const exa = await executeTool('exa_search', {
        query,
        numResults: num,
        type: 'auto',
        apiKey: exaKey,
      })
      const exaResults = exa.success ? exa.output?.results : undefined
      if (Array.isArray(exaResults) && exaResults.length > 0) {
        const results = exaResults.map((r: any) => ({
          title: r.title,
          link: r.url,
          url: r.url,
          snippet: r.summary ?? r.text ?? '',
          publishedDate: r.publishedDate,
          author: r.author,
        }))
        return { results, query, type, totalResults: results.length }
      }
      logger.warn('Exa search returned no results; falling back to Serper', { error: exa.error })
    } catch (error) {
      logger.warn('Exa search failed; falling back to Serper', { error })
    }
  }

  // Fallback: Serper (Google search).
  const result = await executeTool('serper_search', {
    query,
    num,
    type,
    gl,
    hl,
    apiKey: serperKey,
  })

  if (!result.success) {
    throw new Error(result.error || 'Search failed')
  }

  // The serper tool already formats the results properly
  return {
    results: result.output.searchResults || [],
    query,
    type,
    totalResults: result.output.searchResults?.length || 0,
  }
}
