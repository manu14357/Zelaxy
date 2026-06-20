/**
 * Notion connector. Syncs Notion pages into the knowledge base.
 *
 * Config: { databaseId? } OR { pageIds?: string[] }
 * Credential: a Notion internal integration token.
 */

import { createLogger } from '@/lib/logs/console/logger'
import type { ConnectorContext, ConnectorDefinition, FetchedDocument } from './types'

const logger = createLogger('NotionConnector')

const NOTION_VERSION = '2022-06-28'
const MAX_DOCS = 500

function notionHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

/** Pull a human-readable title out of a page's properties. */
function pageTitle(page: any): string | undefined {
  const props = page?.properties
  if (!props || typeof props !== 'object') return undefined
  for (const value of Object.values<any>(props)) {
    if (value?.type === 'title' && Array.isArray(value.title)) {
      const text = value.title
        .map((t: any) => t?.plain_text || '')
        .join('')
        .trim()
      if (text) return text
    }
  }
  return undefined
}

/** Concatenate plain text from a block's rich_text payload. */
function blockText(block: any): string {
  const type = block?.type
  const data = type ? block[type] : undefined
  const rich = data?.rich_text
  if (!Array.isArray(rich)) return ''
  return rich.map((t: any) => t?.plain_text || '').join('')
}

export const notionConnector: ConnectorDefinition = {
  type: 'notion',
  displayName: 'Notion',
  requiresCredential: true,

  async fetchDocuments(ctx: ConnectorContext): Promise<FetchedDocument[]> {
    const token = ctx.credential
    if (!token) {
      throw new Error('Notion connector requires a credential (integration token)')
    }
    const { databaseId, pageIds } = ctx.config || {}
    if (!databaseId && !(Array.isArray(pageIds) && pageIds.length > 0)) {
      throw new Error('Notion connector requires "databaseId" or "pageIds" in config')
    }

    // 1. Resolve the list of pages to ingest.
    let pages: any[] = []
    if (databaseId) {
      const queryUrl = `https://api.notion.com/v1/databases/${databaseId}/query`
      const res = await fetch(queryUrl, {
        method: 'POST',
        headers: notionHeaders(token),
        body: JSON.stringify({ page_size: 100 }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Notion database query failed (${res.status}): ${text.slice(0, 200)}`)
      }
      const data = (await res.json()) as { results?: any[] }
      pages = (data.results || []).slice(0, MAX_DOCS)
    } else {
      pages = (pageIds as string[]).slice(0, MAX_DOCS).map((id) => ({ id }))
    }

    logger.info(`Fetching ${pages.length} Notion pages`)

    // 2. Fetch block children for each page and concatenate plain text.
    const docs: FetchedDocument[] = []
    for (const page of pages) {
      const pageId = page?.id
      if (!pageId) continue
      try {
        const blocksUrl = `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`
        const res = await fetch(blocksUrl, { headers: notionHeaders(token) })
        if (!res.ok) {
          logger.warn(`Skipping page ${pageId}: blocks fetch ${res.status}`)
          continue
        }
        const data = (await res.json()) as { results?: any[] }
        const content = (data.results || [])
          .map((b) => blockText(b))
          .filter((t) => t)
          .join('\n')
        if (!content.trim()) continue
        const title = pageTitle(page) || pageId
        docs.push({
          externalId: pageId,
          filename: title,
          content,
          sourceUrl: `https://www.notion.so/${String(pageId).replace(/-/g, '')}`,
          mimeType: 'text/plain',
        })
      } catch (e) {
        logger.warn(`Skipping page ${pageId}: ${e instanceof Error ? e.message : 'fetch error'}`)
      }
    }
    return docs
  },
}
