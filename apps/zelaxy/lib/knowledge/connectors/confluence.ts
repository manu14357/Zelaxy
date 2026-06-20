/**
 * Confluence connector. Syncs pages from a space into the knowledge base.
 *
 * Config: { baseUrl (e.g. https://x.atlassian.net/wiki), spaceKey }
 * Credential: `email:apiToken` (used as HTTP Basic auth).
 */

import { createLogger } from '@/lib/logs/console/logger'
import type { ConnectorContext, ConnectorDefinition, FetchedDocument } from './types'

const logger = createLogger('ConfluenceConnector')

const MAX_DOCS = 500

/** Minimal HTML → text: strip tags and decode a few common entities. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|section|article|h[1-6]|li|br|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export const confluenceConnector: ConnectorDefinition = {
  type: 'confluence',
  displayName: 'Confluence',
  requiresCredential: true,

  async fetchDocuments(ctx: ConnectorContext): Promise<FetchedDocument[]> {
    const credential = ctx.credential
    if (!credential) {
      throw new Error('Confluence connector requires a credential (email:apiToken)')
    }
    const { baseUrl, spaceKey } = ctx.config || {}
    if (!baseUrl || !spaceKey) {
      throw new Error('Confluence connector requires "baseUrl" and "spaceKey" in config')
    }

    const base = String(baseUrl).replace(/\/+$/, '')
    const auth = Buffer.from(credential).toString('base64')
    const url = `${base}/rest/api/content?spaceKey=${encodeURIComponent(spaceKey)}&expand=body.storage&limit=100`
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Confluence content fetch failed (${res.status}): ${text.slice(0, 200)}`)
    }
    const data = (await res.json()) as {
      results?: Array<{ id?: string; title?: string; body?: { storage?: { value?: string } } }>
    }

    const pages = (data.results || []).slice(0, MAX_DOCS)
    logger.info(`Fetching ${pages.length} Confluence pages from ${spaceKey}`)

    const docs: FetchedDocument[] = []
    for (const page of pages) {
      const id = page?.id
      if (!id) continue
      const content = htmlToText(page.body?.storage?.value || '')
      if (!content.trim()) continue
      docs.push({
        externalId: id,
        filename: page.title || id,
        content,
        sourceUrl: `${base}/pages/${id}`,
        mimeType: 'text/plain',
      })
    }
    return docs
  },
}
