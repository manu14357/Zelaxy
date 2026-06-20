/**
 * Zendesk connector. Syncs Help Center articles into the knowledge base.
 *
 * Config: { subdomain }
 * Credential: `email/token:apiToken` (used as HTTP Basic auth).
 */

import { createLogger } from '@/lib/logs/console/logger'
import type { ConnectorContext, ConnectorDefinition, FetchedDocument } from './types'

const logger = createLogger('ZendeskConnector')

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

export const zendeskConnector: ConnectorDefinition = {
  type: 'zendesk',
  displayName: 'Zendesk',
  requiresCredential: true,

  async fetchDocuments(ctx: ConnectorContext): Promise<FetchedDocument[]> {
    const credential = ctx.credential
    if (!credential) {
      throw new Error('Zendesk connector requires a credential (email/token:apiToken)')
    }
    const { subdomain } = ctx.config || {}
    if (!subdomain) {
      throw new Error('Zendesk connector requires "subdomain" in config')
    }

    const auth = Buffer.from(credential).toString('base64')
    const url = `https://${subdomain}.zendesk.com/api/v2/help_center/articles.json?per_page=100`
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Zendesk articles fetch failed (${res.status}): ${text.slice(0, 200)}`)
    }
    const data = (await res.json()) as {
      articles?: Array<{ id?: number; title?: string; body?: string; html_url?: string }>
    }

    const articles = (data.articles || []).slice(0, MAX_DOCS)
    logger.info(`Fetching ${articles.length} Zendesk articles from ${subdomain}`)

    const docs: FetchedDocument[] = []
    for (const article of articles) {
      if (article?.id == null) continue
      const content = htmlToText(article.body || '')
      if (!content.trim()) continue
      docs.push({
        externalId: String(article.id),
        filename: article.title || String(article.id),
        content,
        sourceUrl: article.html_url,
        mimeType: 'text/plain',
      })
    }
    return docs
  },
}
