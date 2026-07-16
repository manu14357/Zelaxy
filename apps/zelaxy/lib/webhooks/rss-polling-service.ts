import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { Logger } from '@/lib/logs/console/logger'
import { hasProcessedMessage, markMessageAsProcessed } from '@/lib/redis'
import { getBaseUrl } from '@/lib/urls/utils'
import { db } from '@/db'
import { webhook } from '@/db/schema'
import { parseFeedItemsWithIds } from '@/tools/rss/parse'

const logger = new Logger('RssPollingService')

/** Cap on remembered item ids per feed, so providerConfig cannot grow without bound. */
const MAX_SEEN_IDS = 200

/** Never fire more than this many items from a single poll of one feed. */
const MAX_ITEMS_PER_POLL = 10

interface RssWebhookConfig {
  feedUrl?: string
  seenItemIds?: string[]
  lastCheckedAt?: string
  /** Set once the first poll has seeded the cursor; guards against replaying feed history. */
  initialized?: boolean
}

export async function pollRssWebhooks() {
  logger.debug('Starting RSS webhook polling')

  const activeWebhooks = await db
    .select()
    .from(webhook)
    .where(and(eq(webhook.provider, 'rss'), eq(webhook.isActive, true)))

  if (!activeWebhooks.length) {
    logger.debug('No active RSS webhooks found')
    return { total: 0, successful: 0, failed: 0, details: [] }
  }

  logger.info(`Found ${activeWebhooks.length} active RSS webhooks`)

  // Bound parallelism so a large number of feeds cannot exhaust outbound sockets or the DB pool
  const CONCURRENCY = 5
  const details: any[] = []

  for (let i = 0; i < activeWebhooks.length; i += CONCURRENCY) {
    const batch = activeWebhooks.slice(i, i + CONCURRENCY)
    const settled = await Promise.allSettled(batch.map((w) => pollOneFeed(w)))
    for (const r of settled) {
      details.push(r.status === 'fulfilled' ? r.value : { success: false, error: String(r.reason) })
    }
  }

  const successful = details.filter((d) => d.success).length

  return { total: details.length, successful, failed: details.length - successful, details }
}

async function pollOneFeed(webhookData: typeof webhook.$inferSelect) {
  const requestId = nanoid()
  const webhookId = webhookData.id
  const config = (webhookData.providerConfig || {}) as RssWebhookConfig
  const feedUrl = config.feedUrl

  if (!feedUrl) {
    logger.warn(`[${requestId}] RSS webhook ${webhookId} has no feedUrl configured`)
    return { success: false, webhookId, error: 'No feedUrl' }
  }

  let xml: string
  try {
    const response = await fetch(feedUrl, {
      headers: {
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
        'User-Agent': 'Zelaxy/1.0',
      },
    })

    if (!response.ok) {
      logger.warn(`[${requestId}] Feed ${feedUrl} returned ${response.status}`)
      return { success: false, webhookId, error: `Feed returned ${response.status}` }
    }

    xml = await response.text()
  } catch (error) {
    logger.warn(`[${requestId}] Failed to fetch feed ${feedUrl}`, error)
    return { success: false, webhookId, error: 'Fetch failed' }
  }

  const items = parseFeedItemsWithIds(xml).filter((item) => item.id)
  const seen = new Set(config.seenItemIds || [])

  // First poll only seeds the cursor. Without this, connecting a feed would immediately fire the
  // workflow once for every item already published — which is never what someone wants.
  if (!config.initialized) {
    await saveConfig(
      webhookId,
      config,
      items.map((i) => i.id)
    )
    logger.info(
      `[${requestId}] Seeded RSS webhook ${webhookId} with ${items.length} existing items (no runs triggered)`
    )
    return { success: true, webhookId, status: 'initialized', seeded: items.length }
  }

  // Feeds list newest first; process oldest-first so runs happen in publication order
  const newItems = items
    .filter((item) => !seen.has(item.id))
    .reverse()
    .slice(0, MAX_ITEMS_PER_POLL)

  if (!newItems.length) {
    await saveConfig(
      webhookId,
      config,
      items.map((i) => i.id)
    )
    return { success: true, webhookId, status: 'no_new_items' }
  }

  let triggered = 0
  for (const item of newItems) {
    // Guards against two cron runs overlapping on the same feed
    const dedupeKey = `rss:${webhookId}:${item.id}`
    try {
      if (await hasProcessedMessage(dedupeKey)) {
        continue
      }
    } catch (err) {
      logger.warn(`[${requestId}] Redis dedupe check failed for ${item.id}, continuing`, err)
    }

    try {
      const response = await fetch(`${getBaseUrl()}/api/webhooks/trigger/${webhookData.path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Zelaxy/1.0' },
        body: JSON.stringify({ feedUrl, item }),
      })

      if (!response.ok) {
        logger.error(`[${requestId}] Failed to trigger workflow for item ${item.id}`)
        continue
      }

      triggered++
      try {
        await markMessageAsProcessed(dedupeKey)
      } catch {
        // Dedupe is best-effort; the seenItemIds cursor below is the durable guard
      }
    } catch (error) {
      logger.error(`[${requestId}] Error triggering workflow for item ${item.id}`, error)
    }
  }

  await saveConfig(
    webhookId,
    config,
    items.map((i) => i.id)
  )
  logger.info(`[${requestId}] Triggered ${triggered} run(s) for RSS webhook ${webhookId}`)

  return { success: true, webhookId, status: 'triggered', triggered }
}

/**
 * Persists the cursor. Remembers current feed ids plus recent history, so an item that briefly
 * drops out of the feed window and reappears is not treated as new.
 */
async function saveConfig(webhookId: string, config: RssWebhookConfig, currentIds: string[]) {
  const merged = [...currentIds, ...(config.seenItemIds || [])]
  const deduped = Array.from(new Set(merged)).slice(0, MAX_SEEN_IDS)

  await db
    .update(webhook)
    .set({
      providerConfig: {
        ...config,
        seenItemIds: deduped,
        initialized: true,
        lastCheckedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    })
    .where(eq(webhook.id, webhookId))
}
