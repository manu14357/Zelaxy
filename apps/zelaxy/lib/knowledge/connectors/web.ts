/**
 * Web connector. Fetches a list of URLs, strips HTML to text, and ingests each as a document.
 *
 * Config: { urls: string[] }
 * Credential: none.
 */

import { createLogger } from '@/lib/logs/console/logger'
import type { ConnectorContext, ConnectorDefinition, FetchedDocument } from './types'

const logger = createLogger('WebConnector')

const MAX_URLS = 100
const MAX_BYTES = 2_000_000

/** Minimal HTML → text: drop script/style, strip tags, collapse whitespace. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
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

export const webConnector: ConnectorDefinition = {
  type: 'web',
  displayName: 'Web pages',
  requiresCredential: false,

  async fetchDocuments(ctx: ConnectorContext): Promise<FetchedDocument[]> {
    const rawUrls = ctx.config?.urls
    const urls: string[] = Array.isArray(rawUrls)
      ? rawUrls
      : typeof rawUrls === 'string'
        ? rawUrls.split(/[\n,]/).map((u: string) => u.trim())
        : []
    const valid = urls.filter((u) => /^https?:\/\//i.test(u)).slice(0, MAX_URLS)
    if (valid.length === 0) throw new Error('Web connector requires at least one http(s) URL')

    const docs: FetchedDocument[] = []
    for (const url of valid) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Zelaxy-KB-Connector' } })
        if (!res.ok) {
          logger.warn(`Skipping ${url}: ${res.status}`)
          continue
        }
        const raw = (await res.text()).slice(0, MAX_BYTES)
        const contentType = res.headers.get('content-type') || ''
        const content = contentType.includes('html') ? htmlToText(raw) : raw
        if (!content.trim()) continue
        let name: string
        try {
          const u = new URL(url)
          name = `${u.hostname}${u.pathname}`.replace(/\/$/, '') || u.hostname
        } catch {
          name = url
        }
        docs.push({
          externalId: url,
          filename: name.length > 120 ? `${name.slice(0, 117)}...` : name,
          content,
          sourceUrl: url,
          mimeType: 'text/plain',
        })
      } catch (e) {
        logger.warn(`Skipping ${url}: ${e instanceof Error ? e.message : 'fetch error'}`)
      }
    }
    return docs
  },
}
