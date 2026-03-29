import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { Logger } from '@/lib/logs/console/logger'
import { hasProcessedMessage, markMessageAsProcessed } from '@/lib/redis'
import { getBaseUrl } from '@/lib/urls/utils'
import { getOAuthToken } from '@/app/api/auth/oauth/utils'
import { db } from '@/db'
import { webhook } from '@/db/schema'

const logger = new Logger('OutlookPollingService')

/**
 * Converts HTML content to plain text, preserving line breaks and spacing.
 * Used to derive full bodyText from the Graph API body.content (HTML)
 * instead of the truncated bodyPreview (~255 chars).
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, '\u2019')
    .replace(/&lsquo;/gi, '\u2018')
    .replace(/&rdquo;/gi, '\u201C')
    .replace(/&ldquo;/gi, '\u201D')
    .replace(/&mdash;/gi, '\u2014')
    .replace(/&ndash;/gi, '\u2013')
    .replace(/&#\d+;/gi, (match) => {
      const code = Number.parseInt(match.replace(/&#|;/g, ''), 10)
      return Number.isNaN(code) ? match : String.fromCharCode(code)
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface OutlookWebhookConfig {
  credentialId: string
  folderIds?: string[] // e.g., ['inbox', 'sent']
  folderFilterBehavior?: 'INCLUDE' | 'EXCLUDE'
  markAsRead?: boolean
  maxEmailsPerPoll?: number
  lastCheckedTimestamp?: string
  processedEmailIds?: string[]
  pollingInterval?: number
  includeRawEmail?: boolean
}

interface OutlookEmail {
  id: string
  conversationId: string
  subject: string
  bodyPreview: string
  body: {
    contentType: string
    content: string
  }
  from: {
    emailAddress: {
      name: string
      address: string
    }
  }
  toRecipients: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  ccRecipients?: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  receivedDateTime: string
  sentDateTime: string
  hasAttachments: boolean
  isRead: boolean
  parentFolderId: string
}

export interface OutlookAttachmentMeta {
  id: string
  name: string
  contentType: string
  size: number
  /** Extracted text content for document attachments (PDF, CAD, DOCX, etc.) */
  content?: string
}

export interface SimplifiedOutlookEmail {
  id: string
  conversationId: string
  subject: string
  from: string
  to: string
  cc: string
  date: string
  bodyText: string
  bodyHtml: string
  hasAttachments: boolean
  attachments: OutlookAttachmentMeta[]
  isRead: boolean
  folderId: string
  // Thread support fields
  messageId: string // Same as id, but explicit for threading
  threadId: string // Same as conversationId, but explicit for threading
}

export interface OutlookWebhookPayload {
  email: SimplifiedOutlookEmail
  timestamp: string
  rawEmail?: OutlookEmail // Only included when includeRawEmail is true
}

export async function pollOutlookWebhooks() {
  logger.debug('Starting Outlook webhook polling')

  try {
    // Get all active Outlook webhooks
    const activeWebhooks = await db
      .select()
      .from(webhook)
      .where(and(eq(webhook.provider, 'outlook'), eq(webhook.isActive, true)))

    if (!activeWebhooks.length) {
      logger.debug('No active Outlook webhooks found')
      return { total: 0, successful: 0, failed: 0, details: [] }
    }

    logger.info(`Found ${activeWebhooks.length} active Outlook webhooks`)

    // Limit concurrency to avoid exhausting connections
    const CONCURRENCY = 10
    const running: Promise<any>[] = []
    const results: any[] = []

    const enqueue = async (webhookData: (typeof activeWebhooks)[number]) => {
      const webhookId = webhookData.id
      const requestId = nanoid()

      try {
        logger.info(`[${requestId}] Processing Outlook webhook: ${webhookId}`)

        // Extract user ID from webhook metadata if available
        const metadata = webhookData.providerConfig as any
        const userId = metadata?.userId

        logger.debug(`[${requestId}] Webhook ${webhookId} userId: ${userId}`)

        if (!userId) {
          logger.error(`[${requestId}] No user ID found for webhook ${webhookId}`)
          logger.debug(`[${requestId}] No userId found in providerConfig for webhook ${webhookId}`)
          return { success: false, webhookId, error: 'No user ID' }
        }

        // Get OAuth token for Outlook API
        const accessToken = await getOAuthToken(userId, 'outlook')

        if (!accessToken) {
          logger.debug(`[${requestId}] No Outlook access token for webhook ${webhookId}`)
          return { success: false, webhookId, error: 'No access token' }
        }

        // Get webhook configuration
        const config = webhookData.providerConfig as unknown as OutlookWebhookConfig

        const now = new Date()

        // Fetch new emails
        const fetchResult = await fetchNewOutlookEmails(accessToken, config, requestId)
        const { emails } = fetchResult

        if (!emails || !emails.length) {
          // Update last checked timestamp
          await updateWebhookLastChecked(webhookId, now.toISOString())
          logger.info(`[${requestId}] No new emails found for webhook ${webhookId}`)
          return { success: true, webhookId, status: 'no_emails' }
        }

        logger.info(`[${requestId}] Found ${emails.length} emails for webhook ${webhookId}`)

        // Filter out already processed emails
        const processedEmailIds = config.processedEmailIds || []
        const newEmails = emails.filter((email) => !processedEmailIds.includes(email.id))

        if (!newEmails.length) {
          logger.info(`[${requestId}] All emails already processed for webhook ${webhookId}`)
          await updateWebhookLastChecked(webhookId, now.toISOString())
          return { success: true, webhookId, status: 'all_processed' }
        }

        logger.info(
          `[${requestId}] Processing ${newEmails.length} new emails for webhook ${webhookId}`
        )

        // Process emails
        const processed = await processOutlookEmails(
          newEmails,
          webhookData,
          config,
          accessToken,
          requestId
        )

        // Record which email IDs have been processed
        const newProcessedIds = [...processedEmailIds, ...newEmails.map((email) => email.id)]
        // Keep only the most recent 100 IDs to prevent the list from growing too large
        const trimmedProcessedIds = newProcessedIds.slice(-100)

        // Update webhook with latest timestamp and processed email IDs
        await updateWebhookData(webhookId, now.toISOString(), trimmedProcessedIds)

        return {
          success: true,
          webhookId,
          emailsFound: emails.length,
          newEmails: newEmails.length,
          emailsProcessed: processed,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`[${requestId}] Error processing Outlook webhook ${webhookId}:`, error)
        return { success: false, webhookId, error: errorMessage }
      }
    }

    for (const webhookData of activeWebhooks) {
      running.push(enqueue(webhookData))

      if (running.length >= CONCURRENCY) {
        const result = await Promise.race(running)
        running.splice(running.indexOf(result), 1)
        results.push(result)
      }
    }

    while (running.length) {
      const result = await Promise.race(running)
      running.splice(running.indexOf(result), 1)
      results.push(result)
    }

    // Calculate summary
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    if (failed > 0) {
      logger.warn(`Outlook polling completed: ${successful} successful, ${failed} failed`)
    } else if (successful > 0) {
      logger.info(`Outlook polling completed: ${successful} successful`)
    }

    return {
      total: activeWebhooks.length,
      successful,
      failed,
      details: results,
    }
  } catch (error) {
    logger.error('Error during Outlook webhook polling:', error)
    throw error
  }
}

async function fetchNewOutlookEmails(
  accessToken: string,
  config: OutlookWebhookConfig,
  requestId: string
) {
  try {
    // Build the Microsoft Graph API URL
    const apiUrl = 'https://graph.microsoft.com/v1.0/me/messages'
    const params = new URLSearchParams()

    // Add select parameters to get the fields we need
    params.append(
      '$select',
      'id,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,hasAttachments,isRead,parentFolderId'
    )

    // Add ordering (newest first)
    params.append('$orderby', 'receivedDateTime desc')

    // Limit results
    params.append('$top', (config.maxEmailsPerPoll || 25).toString())

    // Add time filter if we have a last checked timestamp
    if (config.lastCheckedTimestamp) {
      const lastChecked = new Date(config.lastCheckedTimestamp)
      // Add a small buffer to avoid missing emails due to clock differences
      const bufferTime = new Date(lastChecked.getTime() - 60000) // 1 minute buffer
      params.append('$filter', `receivedDateTime gt ${bufferTime.toISOString()}`)
    }

    const fullUrl = `${apiUrl}?${params.toString()}`

    logger.info(`[${requestId}] Fetching emails from: ${fullUrl}`)

    const response = await fetch(fullUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      logger.error(`[${requestId}] Microsoft Graph API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })
      return { emails: [] }
    }

    const data = await response.json()
    const emails = data.value || []

    // Filter by folder if configured
    const filteredEmails = filterEmailsByFolder(emails, config)

    logger.info(
      `[${requestId}] Fetched ${emails.length} emails, ${filteredEmails.length} after filtering`
    )

    return { emails: filteredEmails }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`[${requestId}] Error fetching new Outlook emails:`, errorMessage)
    return { emails: [] }
  }
}

function filterEmailsByFolder(
  emails: OutlookEmail[],
  config: OutlookWebhookConfig
): OutlookEmail[] {
  if (!config.folderIds || !config.folderIds.length) {
    return emails
  }

  return emails.filter((email) => {
    const emailFolderId = email.parentFolderId
    const hasMatchingFolder = config.folderIds!.some((configFolder) =>
      emailFolderId.toLowerCase().includes(configFolder.toLowerCase())
    )

    return config.folderFilterBehavior === 'INCLUDE'
      ? hasMatchingFolder // Include emails from matching folders
      : !hasMatchingFolder // Exclude emails from matching folders
  })
}

async function processOutlookEmails(
  emails: OutlookEmail[],
  webhookData: any,
  config: OutlookWebhookConfig,
  accessToken: string,
  requestId: string
) {
  let processedCount = 0

  for (const email of emails) {
    try {
      // Check if we've already processed this email (Redis-based deduplication)
      const redisKey = `outlook-email-${email.id}`
      const alreadyProcessed = await hasProcessedMessage(redisKey)

      if (alreadyProcessed) {
        logger.debug(`[${requestId}] Email ${email.id} already processed, skipping`)
        continue
      }

      // Fetch attachments (including content) if the email has attachments
      let attachments: OutlookAttachmentMeta[] = []
      if (email.hasAttachments) {
        attachments = await fetchAttachmentsWithContent(accessToken, email.id, requestId)
      }

      // Convert to simplified format
      const simplifiedEmail: SimplifiedOutlookEmail = {
        id: email.id,
        conversationId: email.conversationId,
        subject: email.subject || '(No Subject)',
        from: email.from?.emailAddress?.address || '',
        to: email.toRecipients?.map((r) => r.emailAddress.address).join(', ') || '',
        cc: email.ccRecipients?.map((r) => r.emailAddress.address).join(', ') || '',
        date: email.receivedDateTime,
        bodyText: email.body?.content
          ? htmlToPlainText(email.body.content)
          : email.bodyPreview || '',
        bodyHtml: email.body?.content || '',
        hasAttachments: email.hasAttachments,
        attachments,
        isRead: email.isRead,
        folderId: email.parentFolderId,
        // Thread support fields
        messageId: email.id,
        threadId: email.conversationId,
      }

      // Create webhook payload
      const payload: OutlookWebhookPayload = {
        email: simplifiedEmail,
        timestamp: new Date().toISOString(),
      }

      // Include raw email if configured
      if (config.includeRawEmail) {
        payload.rawEmail = email
      }

      logger.info(
        `[${requestId}] Processing email: ${email.subject} from ${email.from?.emailAddress?.address}`
      )

      // Trigger the webhook
      const webhookUrl = `${getBaseUrl()}/api/webhooks/trigger/${webhookData.path}`

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhookData.secret || '',
          'User-Agent': 'Zelaxy/1.0',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        logger.error(
          `[${requestId}] Failed to trigger webhook for email ${email.id}:`,
          response.status,
          await response.text()
        )
        continue
      }

      // Mark email as read if configured
      if (config.markAsRead) {
        await markOutlookEmailAsRead(accessToken, email.id)
      }

      // Mark as processed in Redis (expires after 7 days)
      await markMessageAsProcessed(redisKey, 7 * 24 * 60 * 60)

      processedCount++
      logger.info(`[${requestId}] Successfully processed email ${email.id}`)
    } catch (error) {
      logger.error(`[${requestId}] Error processing email ${email.id}:`, error)
    }
  }

  return processedCount
}

/**
 * Fetch attachment metadata and binary content for a message.
 * Downloads contentBytes from Microsoft Graph, then runs file parsers
 * to extract text — matching the Gmail polling service behaviour.
 *
 * For very large attachments (>10 MB) only metadata is returned to avoid
 * excessive memory usage during polling.
 */
async function fetchAttachmentsWithContent(
  accessToken: string,
  messageId: string,
  requestId: string
): Promise<OutlookAttachmentMeta[]> {
  const MAX_PARSE_SIZE = 10 * 1024 * 1024 // 10 MB

  try {
    const encodedId = encodeURIComponent(messageId)

    // Step 1: Fetch attachment metadata only (do NOT request contentBytes on
    // the list endpoint — Graph API returns 400 for item/reference attachments
    // or certain mailbox configurations when contentBytes is in $select).
    const listUrl = `https://graph.microsoft.com/v1.0/me/messages/${encodedId}/attachments?$select=id,name,contentType,size,isInline`
    const listResponse = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!listResponse.ok) {
      const errorBody = await listResponse.text().catch(() => '(no body)')
      logger.error(
        `[${requestId}] Failed to fetch attachments for message ${messageId}: ${listResponse.status} — ${errorBody}`
      )
      return []
    }

    const data = await listResponse.json()
    const allAttachments = data.value || []

    // Filter out inline attachments (embedded images in email body/signatures)
    const fileAttachments = allAttachments.filter(
      (att: any) => !att.isInline && att['@odata.type'] !== '#microsoft.graph.itemAttachment'
    )

    logger.debug(
      `[${requestId}] Attachments for ${messageId}: ${allAttachments.length} total, ${fileAttachments.length} after filtering inline/item`
    )

    const results: OutlookAttachmentMeta[] = []

    for (const att of fileAttachments) {
      const meta: OutlookAttachmentMeta = {
        id: att.id,
        name: att.name,
        contentType: att.contentType,
        size: att.size,
      }

      // Step 2: Fetch individual attachment to get contentBytes
      if (att.size <= MAX_PARSE_SIZE) {
        try {
          const attUrl = `https://graph.microsoft.com/v1.0/me/messages/${encodedId}/attachments/${encodeURIComponent(att.id)}`
          const attResponse = await fetch(attUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          })

          if (!attResponse.ok) {
            logger.warn(
              `[${requestId}] Failed to fetch attachment ${att.name} (${att.id}): ${attResponse.status}`
            )
            meta.content = `[${att.name}: ${att.size} bytes — download failed]`
            results.push(meta)
            continue
          }

          const attData = await attResponse.json()
          const contentBytes = attData.contentBytes

          if (contentBytes) {
            const fileBuffer = Buffer.from(contentBytes, 'base64')
            const ext = att.name?.toLowerCase().split('.').pop() || ''

            const { parseBuffer, isSupportedFileType } = await import('@/lib/file-parsers')

            if (isSupportedFileType(ext)) {
              const result = await parseBuffer(fileBuffer, ext)
              meta.content = result.content
              logger.info(
                `[${requestId}] Extracted text from attachment ${att.name} (${result.content.length} chars)`
              )
            } else {
              // For unsupported but text-ish types, try UTF-8
              const textMimeTypes = [
                'text/',
                'application/json',
                'application/xml',
                'application/csv',
              ]
              const isText = textMimeTypes.some((t) => att.contentType?.startsWith(t))
              if (isText) {
                meta.content = fileBuffer.toString('utf-8')
              } else {
                meta.content = `[Binary file: ${att.name}, ${att.contentType}, ${att.size} bytes]`
              }
            }
          } else {
            meta.content = `[${att.name}: no content bytes available]`
          }
        } catch (parseError) {
          logger.warn(`[${requestId}] Failed to parse attachment ${att.name}:`, parseError)
          meta.content = `[${att.name}: ${att.size} bytes — content extraction failed]`
        }
      } else {
        meta.content = `[${att.name}: ${att.size} bytes — file too large for inline extraction]`
      }

      results.push(meta)
    }

    return results
  } catch (error) {
    logger.error(`[${requestId}] Error fetching attachments for ${messageId}:`, error)
    return []
  }
}

async function markOutlookEmailAsRead(accessToken: string, messageId: string) {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(messageId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isRead: true,
        }),
      }
    )

    if (!response.ok) {
      logger.error(
        `Failed to mark email ${messageId} as read:`,
        response.status,
        await response.text()
      )
    }
  } catch (error) {
    logger.error(`Error marking email ${messageId} as read:`, error)
  }
}

async function updateWebhookLastChecked(webhookId: string, timestamp: string) {
  try {
    // Get current config first
    const currentWebhook = await db
      .select({ providerConfig: webhook.providerConfig })
      .from(webhook)
      .where(eq(webhook.id, webhookId))
      .limit(1)

    if (!currentWebhook.length) {
      logger.error(`Webhook ${webhookId} not found`)
      return
    }

    const currentConfig = (currentWebhook[0].providerConfig as any) || {}
    const updatedConfig = {
      ...currentConfig, // Preserve ALL existing config including userId
      lastCheckedTimestamp: timestamp,
    }

    await db
      .update(webhook)
      .set({
        providerConfig: updatedConfig,
        updatedAt: new Date(),
      })
      .where(eq(webhook.id, webhookId))
  } catch (error) {
    logger.error(`Error updating webhook ${webhookId} last checked timestamp:`, error)
  }
}

async function updateWebhookData(
  webhookId: string,
  timestamp: string,
  processedEmailIds: string[]
) {
  try {
    const currentWebhook = await db
      .select({ providerConfig: webhook.providerConfig })
      .from(webhook)
      .where(eq(webhook.id, webhookId))
      .limit(1)

    if (!currentWebhook.length) {
      logger.error(`Webhook ${webhookId} not found`)
      return
    }

    const currentConfig = (currentWebhook[0].providerConfig as any) || {}
    const updatedConfig = {
      ...currentConfig, // Preserve ALL existing config including userId
      lastCheckedTimestamp: timestamp,
      processedEmailIds,
    }

    await db
      .update(webhook)
      .set({
        providerConfig: updatedConfig,
        updatedAt: new Date(),
      })
      .where(eq(webhook.id, webhookId))
  } catch (error) {
    logger.error(`Error updating webhook ${webhookId} data:`, error)
  }
}
