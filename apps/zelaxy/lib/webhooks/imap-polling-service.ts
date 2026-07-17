import { and, eq } from 'drizzle-orm'
import { ImapFlow } from 'imapflow'
import { nanoid } from 'nanoid'
import { Logger } from '@/lib/logs/console/logger'
import { hasProcessedMessage, markMessageAsProcessed } from '@/lib/redis'
import { getBaseUrl } from '@/lib/urls/utils'
import { db } from '@/db'
import { webhook } from '@/db/schema'

const logger = new Logger('ImapPollingService')

/** Never fire more than this many emails from a single poll of one mailbox. */
const MAX_EMAILS_PER_POLL = 25

interface ImapWebhookConfig {
  host?: string
  port?: number
  secure?: boolean
  username?: string
  password?: string
  mailbox?: string
  markAsRead?: boolean
  /** Highest UID already handled, per mailbox. */
  lastUidByMailbox?: Record<string, number>
  /**
   * IMAP UIDVALIDITY per mailbox. If a server changes this value, every UID it previously issued
   * is meaningless and must not be compared against the stored cursor.
   */
  uidValidityByMailbox?: Record<string, string>
  lastCheckedAt?: string
  initialized?: boolean
}

export async function pollImapWebhooks() {
  logger.debug('Starting IMAP webhook polling')

  const activeWebhooks = await db
    .select()
    .from(webhook)
    .where(and(eq(webhook.provider, 'imap'), eq(webhook.isActive, true)))

  if (!activeWebhooks.length) {
    logger.debug('No active IMAP webhooks found')
    return { total: 0, successful: 0, failed: 0, details: [] }
  }

  logger.info(`Found ${activeWebhooks.length} active IMAP webhooks`)

  // Each mailbox needs its own TCP connection, so keep parallelism low
  const CONCURRENCY = 3
  const details: any[] = []

  for (let i = 0; i < activeWebhooks.length; i += CONCURRENCY) {
    const batch = activeWebhooks.slice(i, i + CONCURRENCY)
    const settled = await Promise.allSettled(batch.map((w) => pollOneMailbox(w)))
    for (const r of settled) {
      details.push(r.status === 'fulfilled' ? r.value : { success: false, error: String(r.reason) })
    }
  }

  const successful = details.filter((d) => d.success).length

  return { total: details.length, successful, failed: details.length - successful, details }
}

async function pollOneMailbox(webhookData: typeof webhook.$inferSelect) {
  const requestId = nanoid()
  const webhookId = webhookData.id
  const config = (webhookData.providerConfig || {}) as ImapWebhookConfig

  const { host, username, password } = config
  if (!host || !username || !password) {
    logger.warn(`[${requestId}] IMAP webhook ${webhookId} is missing host/username/password`)
    return { success: false, webhookId, error: 'Incomplete IMAP configuration' }
  }

  const mailbox = config.mailbox || 'INBOX'

  const client = new ImapFlow({
    host,
    port: config.port || 993,
    secure: config.secure !== false,
    auth: { user: username, pass: password },
    // imapflow logs verbosely on its own channel; keep it quiet and report through our logger
    logger: false,
  })

  let lock: Awaited<ReturnType<ImapFlow['getMailboxLock']>> | undefined

  try {
    await client.connect()
    lock = await client.getMailboxLock(mailbox)

    const status = client.mailbox
    if (!status || typeof status === 'boolean') {
      return { success: false, webhookId, error: `Could not open mailbox ${mailbox}` }
    }

    const uidValidity = String(status.uidValidity)
    const previousValidity = config.uidValidityByMailbox?.[mailbox]
    // A changed UIDVALIDITY means the server reissued its UIDs — the stored cursor now points at
    // unrelated messages, so it must be discarded rather than compared against.
    const uidReset = previousValidity !== undefined && previousValidity !== uidValidity
    const lastUid = uidReset ? 0 : config.lastUidByMailbox?.[mailbox] || 0

    if (uidReset) {
      logger.warn(
        `[${requestId}] UIDVALIDITY changed for ${mailbox} on webhook ${webhookId} (${previousValidity} -> ${uidValidity}); resyncing without replaying mail`
      )
    }

    // First connection, or a UID reset: record where the mailbox is and trigger nothing. Otherwise
    // connecting a mailbox would fire the workflow once for every message already in it.
    if (!config.initialized || uidReset) {
      const highest = await highestUid(client)
      await saveState(webhookId, config, mailbox, highest, uidValidity)
      logger.info(
        `[${requestId}] Seeded IMAP webhook ${webhookId} at UID ${highest} in ${mailbox} (no runs triggered)`
      )
      return { success: true, webhookId, status: uidReset ? 'resynced' : 'initialized' }
    }

    const emails: any[] = []
    // UID ranges are inclusive, so start one past the cursor
    for await (const msg of client.fetch(
      { uid: `${lastUid + 1}:*` },
      { uid: true, envelope: true, bodyStructure: true }
    )) {
      // A `n:*` range always returns at least one message even when none are newer
      if (msg.uid <= lastUid) continue
      emails.push(msg)
      if (emails.length >= MAX_EMAILS_PER_POLL) break
    }

    if (!emails.length) {
      await saveState(webhookId, config, mailbox, lastUid, uidValidity)
      return { success: true, webhookId, status: 'no_new_emails' }
    }

    emails.sort((a, b) => a.uid - b.uid)

    let triggered = 0
    let highestHandled = lastUid

    for (const msg of emails) {
      const dedupeKey = `imap:${webhookId}:${uidValidity}:${msg.uid}`
      try {
        if (await hasProcessedMessage(dedupeKey)) {
          highestHandled = Math.max(highestHandled, msg.uid)
          continue
        }
      } catch (err) {
        logger.warn(`[${requestId}] Redis dedupe check failed for UID ${msg.uid}, continuing`, err)
      }

      const env = msg.envelope || ({} as any)
      const payload = {
        mailbox,
        email: {
          uid: msg.uid,
          messageId: env.messageId || '',
          subject: env.subject || '',
          from: env.from?.[0] ? { address: env.from[0].address, name: env.from[0].name } : null,
          to: (env.to || []).map((a: any) => a.address).filter(Boolean),
          cc: (env.cc || []).map((a: any) => a.address).filter(Boolean),
          date: env.date ? new Date(env.date).toISOString() : '',
          hasAttachments: hasAttachments(msg.bodyStructure),
        },
      }

      try {
        const response = await fetch(`${getBaseUrl()}/api/webhooks/trigger/${webhookData.path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'Zelaxy/1.0' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          logger.error(`[${requestId}] Failed to trigger workflow for UID ${msg.uid}`)
          // Stop advancing the cursor here so this email is retried next poll
          break
        }

        triggered++
        highestHandled = Math.max(highestHandled, msg.uid)

        try {
          await markMessageAsProcessed(dedupeKey)
        } catch {
          // Best-effort; the UID cursor below is the durable guard
        }

        if (config.markAsRead) {
          try {
            await client.messageFlagsAdd({ uid: String(msg.uid) }, ['\\Seen'], { uid: true })
          } catch (err) {
            logger.warn(`[${requestId}] Could not mark UID ${msg.uid} as read`, err)
          }
        }
      } catch (error) {
        logger.error(`[${requestId}] Error triggering workflow for UID ${msg.uid}`, error)
        break
      }
    }

    await saveState(webhookId, config, mailbox, highestHandled, uidValidity)
    logger.info(`[${requestId}] Triggered ${triggered} run(s) for IMAP webhook ${webhookId}`)

    return { success: true, webhookId, status: 'triggered', triggered }
  } catch (error) {
    // Dropped connections and throttling are normal for IMAP; log and retry next poll rather than
    // failing loudly or advancing the cursor past mail that was never delivered.
    logger.warn(`[${requestId}] IMAP polling failed for webhook ${webhookId}`, error)
    return {
      success: false,
      webhookId,
      error: error instanceof Error ? error.message : 'IMAP error',
    }
  } finally {
    try {
      lock?.release()
    } catch {
      // ignore
    }
    try {
      await client.logout()
    } catch {
      // The server may already have dropped the connection
    }
  }
}

/** Highest existing UID in the open mailbox, or 0 when it is empty. */
async function highestUid(client: ImapFlow): Promise<number> {
  let highest = 0
  for await (const msg of client.fetch({ uid: '1:*' }, { uid: true })) {
    if (msg.uid > highest) highest = msg.uid
  }
  return highest
}

function hasAttachments(structure: any): boolean {
  if (!structure) return false
  if (structure.disposition === 'attachment') return true
  if (Array.isArray(structure.childNodes)) {
    return structure.childNodes.some((child: any) => hasAttachments(child))
  }
  return false
}

async function saveState(
  webhookId: string,
  config: ImapWebhookConfig,
  mailbox: string,
  uid: number,
  uidValidity: string
) {
  await db
    .update(webhook)
    .set({
      providerConfig: {
        ...config,
        lastUidByMailbox: { ...(config.lastUidByMailbox || {}), [mailbox]: uid },
        uidValidityByMailbox: { ...(config.uidValidityByMailbox || {}), [mailbox]: uidValidity },
        initialized: true,
        lastCheckedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    })
    .where(eq(webhook.id, webhookId))
}
