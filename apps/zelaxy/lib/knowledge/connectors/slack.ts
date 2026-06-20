/**
 * Slack connector. Syncs messages from a channel into the knowledge base.
 *
 * Config: { channelId }
 * Credential: a Slack bot token.
 */

import { createLogger } from '@/lib/logs/console/logger'
import type { ConnectorContext, ConnectorDefinition, FetchedDocument } from './types'

const logger = createLogger('SlackConnector')

const MAX_DOCS = 500

export const slackConnector: ConnectorDefinition = {
  type: 'slack',
  displayName: 'Slack',
  requiresCredential: true,

  async fetchDocuments(ctx: ConnectorContext): Promise<FetchedDocument[]> {
    const token = ctx.credential
    if (!token) {
      throw new Error('Slack connector requires a credential (bot token)')
    }
    const { channelId } = ctx.config || {}
    if (!channelId) {
      throw new Error('Slack connector requires "channelId" in config')
    }

    const url = `https://slack.com/api/conversations.history?channel=${encodeURIComponent(channelId)}&limit=200`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Slack history fetch failed (${res.status}): ${text.slice(0, 200)}`)
    }
    const data = (await res.json()) as {
      ok?: boolean
      error?: string
      messages?: Array<{ ts?: string; text?: string; bot_id?: string; subtype?: string }>
    }
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error || 'unknown'}`)
    }

    const messages = (data.messages || []).slice(0, MAX_DOCS)
    logger.info(`Fetching ${messages.length} Slack messages from ${channelId}`)

    const docs: FetchedDocument[] = []
    for (const msg of messages) {
      // Skip bot messages and empty content.
      if (msg.bot_id) continue
      const ts = msg.ts
      const content = (msg.text || '').trim()
      if (!ts || !content) continue
      docs.push({
        externalId: ts,
        filename: `slack-${ts}.txt`,
        content,
        mimeType: 'text/plain',
      })
    }
    return docs
  },
}
