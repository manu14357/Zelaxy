import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { executeTool } from '@/tools'
import { BaseCopilotTool } from '../base'

/**
 * Research tools for the workspace agent: read a specific page, and crawl a site. These let the
 * agent "figure out the best approach" to research — combined with `search_online` (web search) and
 * `search_documentation` (technical docs).
 */

const logger = createLogger('ResearchTools')

// ── scrape_page: read a single page's main content ────────────────────────────
interface ScrapePageParams {
  url: string
  /** Workspace-configured API keys injected by the arena route (win over process env). */
  _env?: Record<string, string | undefined>
}
interface ScrapePageResult {
  url: string
  content: string
  title?: string
}

class ScrapePageTool extends BaseCopilotTool<ScrapePageParams, ScrapePageResult> {
  readonly id = 'scrape_page'
  readonly displayName = 'Getting page contents'

  protected async executeImpl(params: ScrapePageParams): Promise<ScrapePageResult> {
    const { url } = params
    if (!url?.trim()) throw new Error('A url is required to read a page')
    const exaKey = params._env?.EXA_API_KEY || env.EXA_API_KEY
    const jinaKey = params._env?.JINA_API_KEY || env.JINA_API_KEY || ''

    // Primary: Exa `get_contents` (the same provider the reference research agent uses) — returns
    // the page's extracted text + a summary. Falls back to Jina Reader when no Exa key is set.
    if (exaKey) {
      try {
        logger.info('Getting page contents via Exa', { url })
        const exa = await executeTool('exa_get_contents', {
          urls: url,
          text: true,
          summaryQuery: '',
          apiKey: exaKey,
        })
        const first = exa.success ? exa.output?.results?.[0] : undefined
        const text = first?.text ?? first?.summary ?? ''
        if (exa.success && typeof text === 'string' && text.trim()) {
          return { url, content: text, title: first?.title }
        }
        logger.warn('Exa get_contents returned no text; falling back to Jina', {
          url,
          error: exa.error,
        })
      } catch (error) {
        logger.warn('Exa get_contents failed; falling back to Jina', { url, error })
      }
    }

    // Fallback: Jina Reader (r.jina.ai) returns clean markdown and works without a key for basic use.
    logger.info('Getting page contents via Jina', { url })
    const result = await executeTool('jina_read_url', {
      url,
      apiKey: jinaKey,
    })
    if (!result.success) throw new Error(result.error || 'Failed to read the page')

    const content = result.output?.content ?? result.output?.text ?? ''
    return {
      url,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      title: result.output?.title,
    }
  }
}
export const scrapePageTool = new ScrapePageTool()

// ── crawl_website: crawl a site for multiple pages ────────────────────────────
interface CrawlWebsiteParams {
  url: string
  limit?: number
  /** Workspace-configured API keys injected by the arena route (win over process env). */
  _env?: Record<string, string | undefined>
}
interface CrawlWebsiteResult {
  url: string
  pages: any[]
  totalPages: number
}

class CrawlWebsiteTool extends BaseCopilotTool<CrawlWebsiteParams, CrawlWebsiteResult> {
  readonly id = 'crawl_website'
  readonly displayName = 'Crawling site'

  protected async executeImpl(params: CrawlWebsiteParams): Promise<CrawlWebsiteResult> {
    const { url, limit = 20 } = params
    if (!url?.trim()) throw new Error('A url is required to crawl a site')
    const firecrawlKey = params._env?.FIRECRAWL_API_KEY || env.FIRECRAWL_API_KEY
    if (!firecrawlKey) {
      throw new Error(
        'Crawling needs a FIRECRAWL_API_KEY. Set it in environment variables, or use scrape_page to read a single page instead.'
      )
    }

    logger.info('Crawling site', { url, limit })
    const result = await executeTool('firecrawl_crawl', {
      url,
      limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
      onlyMainContent: true,
      apiKey: firecrawlKey,
    })
    if (!result.success) throw new Error(result.error || 'Failed to crawl the site')

    const pages = result.output?.pages ?? result.output?.data ?? result.output?.results ?? []
    return {
      url,
      pages: Array.isArray(pages) ? pages : [],
      totalPages: Array.isArray(pages) ? pages.length : 0,
    }
  }
}
export const crawlWebsiteTool = new CrawlWebsiteTool()
