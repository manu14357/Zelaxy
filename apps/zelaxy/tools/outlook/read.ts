import type {
  OutlookAttachment,
  OutlookMessage,
  OutlookMessagesResponse,
  OutlookReadParams,
  OutlookReadResponse,
  OutlookReadSingleMetadata,
} from '@/tools/outlook/types'
import type { ToolConfig } from '@/tools/types'

/**
 * Process a single Outlook message into the standardized output format
 * matching Gmail's output structure: { content, metadata, attachments }
 */
async function processOutlookMessage(
  message: OutlookMessage,
  params?: OutlookReadParams
): Promise<OutlookReadResponse> {
  const from = message.from?.emailAddress
    ? `${message.from.emailAddress.name || ''} <${message.from.emailAddress.address}>`.trim()
    : ''
  const to = (message.toRecipients || [])
    .map((r) => `${r.emailAddress?.name || ''} <${r.emailAddress?.address}>`.trim())
    .join(', ')
  const cc = (message.ccRecipients || [])
    .map((r) => `${r.emailAddress?.name || ''} <${r.emailAddress?.address}>`.trim())
    .join(', ')

  // Extract body text — prefer text/plain, fall back to HTML stripped
  let bodyContent = ''
  if (message.body?.contentType === 'text') {
    bodyContent = message.body.content || ''
  } else if (message.body?.content) {
    // Strip HTML tags for plain text content output
    bodyContent = message.body.content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Always extract attachment info from expanded data (since we $expand=attachments on all URLs)
  // Filter out inline attachments (signature images, embedded logos, etc.)
  const rawAttachments = ((message as any).attachments || []) as any[]
  const nonInlineAttachments = rawAttachments.filter((att: any) => !att.isInline)

  const attachments: OutlookAttachment[] = []
  const attachmentNames = nonInlineAttachments.map((att: any) => att.name || 'unknown')

  // Only populate the attachments array with full data when includeAttachments is ON
  // FileToolProcessor requires each attachment to have 'data' (Buffer/base64) or 'url'
  if (params?.includeAttachments && params.accessToken) {
    for (const att of nonInlineAttachments) {
      const isFile = att['@odata.type'] === '#microsoft.graph.fileAttachment'

      if (isFile && att.contentBytes) {
        // Expanded data includes contentBytes — use directly
        attachments.push({
          name: att.name || 'unknown',
          mimeType: att.contentType || 'application/octet-stream',
          size: att.size || 0,
          data: Buffer.from(att.contentBytes, 'base64'),
          content:
            att.contentType?.startsWith('text/') && att.contentBytes
              ? Buffer.from(att.contentBytes, 'base64').toString('utf-8')
              : undefined,
        })
      } else if (isFile && att.id) {
        // Large file — contentBytes missing from $expand, fetch individually
        try {
          const attResponse = await fetch(
            `https://graph.microsoft.com/v1.0/me/messages/${message.id}/attachments/${att.id}`,
            { headers: { Authorization: `Bearer ${params.accessToken}` } }
          )
          if (attResponse.ok) {
            const attDetail = await attResponse.json()
            if (attDetail.contentBytes) {
              attachments.push({
                name: att.name || 'unknown',
                mimeType: att.contentType || 'application/octet-stream',
                size: att.size || 0,
                data: Buffer.from(attDetail.contentBytes, 'base64'),
                content:
                  att.contentType?.startsWith('text/') && attDetail.contentBytes
                    ? Buffer.from(attDetail.contentBytes, 'base64').toString('utf-8')
                    : undefined,
              })
            }
          }
        } catch {
          // Skip individual attachment errors
        }
      }
      // Skip non-file attachments (itemAttachment, referenceAttachment) — they can't be downloaded as binary
    }

    // Fallback: if expanded data was empty but message says it has attachments, fetch all
    if (attachments.length === 0 && message.hasAttachments) {
      try {
        const attResponse = await fetch(
          `https://graph.microsoft.com/v1.0/me/messages/${message.id}/attachments`,
          { headers: { Authorization: `Bearer ${params.accessToken}` } }
        )
        if (attResponse.ok) {
          const attData = await attResponse.json()
          for (const att of (attData.value || []).filter((a: any) => !a.isInline)) {
            if (att['@odata.type'] === '#microsoft.graph.fileAttachment' && att.contentBytes) {
              attachments.push({
                name: att.name || 'unknown',
                mimeType: att.contentType || 'application/octet-stream',
                size: att.size || 0,
                data: Buffer.from(att.contentBytes, 'base64'),
                content:
                  att.contentType?.startsWith('text/') && att.contentBytes
                    ? Buffer.from(att.contentBytes, 'base64').toString('utf-8')
                    : undefined,
              })
            }
          }
        }
      } catch {
        // Continue without attachments rather than failing
      }
    }
  }

  const attachmentCount = nonInlineAttachments.length

  return {
    success: true,
    output: {
      content: bodyContent || 'No content found in email',
      metadata: {
        id: message.id || '',
        conversationId: message.conversationId,
        from,
        to,
        cc,
        subject: message.subject || '',
        date: message.receivedDateTime || message.sentDateTime || '',
        hasAttachments: message.hasAttachments ?? false,
        attachmentCount,
        attachmentNames,
        isRead: message.isRead,
        importance: message.importance,
        bodyPreview: message.bodyPreview,
      } satisfies OutlookReadSingleMetadata,
      attachments: attachments || [],
    },
  }
}

export const outlookReadTool: ToolConfig<OutlookReadParams, OutlookReadResponse> = {
  id: 'outlook_read',
  name: 'Outlook Read',
  description: 'Read emails from Outlook',
  version: '1.0.0',

  oauth: {
    required: true,
    provider: 'outlook',
  },

  params: {
    accessToken: {
      type: 'string',
      required: true,
      visibility: 'hidden',
      description: 'OAuth access token for Outlook',
    },
    folder: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Folder ID to read emails from (default: Inbox)',
    },
    maxResults: {
      type: 'number',
      required: false,
      visibility: 'user-only',
      description: 'Maximum number of emails to retrieve (default: 1)',
    },
    messageId: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      description: 'Specific message ID to fetch (overrides folder)',
    },
    includeAttachments: {
      type: 'boolean',
      required: false,
      visibility: 'user-only',
      description: 'Download and include email attachments',
    },
  },

  request: {
    url: (params) => {
      // If a specific message ID is provided, fetch that message directly
      if (params.messageId) {
        return `https://graph.microsoft.com/v1.0/me/messages/${params.messageId}?$expand=attachments`
      }

      const maxResults = params.maxResults ? Math.max(1, Math.abs(params.maxResults)) : 1

      // If folder is provided, read from that specific folder
      if (params.folder) {
        return `https://graph.microsoft.com/v1.0/me/mailFolders/${params.folder}/messages?$top=${maxResults}&$orderby=createdDateTime desc&$expand=attachments`
      }

      // Otherwise fetch from all messages (default behavior)
      return `https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$orderby=createdDateTime desc&$expand=attachments`
    },
    method: 'GET',
    headers: (params) => {
      // Validate access token
      if (!params.accessToken) {
        throw new Error('Access token is required')
      }

      return {
        Authorization: `Bearer ${params.accessToken}`,
      }
    },
  },

  transformResponse: async (response: Response, params?: OutlookReadParams) => {
    const data = await response.json()

    // If fetching by messageId, the response is a single message
    if (params?.messageId) {
      return await processOutlookMessage(data as OutlookMessage, params)
    }

    // Microsoft Graph API returns messages in a 'value' array
    const messages = (data as OutlookMessagesResponse).value || []

    if (messages.length === 0) {
      return {
        success: true,
        output: {
          content: 'No mail found.',
          metadata: {
            id: '',
            from: '',
            to: '',
            cc: '',
            subject: '',
            date: '',
            hasAttachments: false,
            attachmentCount: 0,
          },
          attachments: [],
        },
      }
    }

    // For single message (maxResults = 1), return full structured output
    if (messages.length === 1) {
      return await processOutlookMessage(messages[0], params)
    }

    // For multiple messages, build a clean summary matching Gmail's format
    // and include metadata for all messages
    const processedSummaries = messages.map((msg: OutlookMessage) => {
      const from = msg.from?.emailAddress
        ? `${msg.from.emailAddress.name || ''} <${msg.from.emailAddress.address}>`.trim()
        : ''
      return {
        id: msg.id,
        conversationId: msg.conversationId || '',
        subject: msg.subject || '(No Subject)',
        from,
        date: msg.receivedDateTime || msg.sentDateTime || '',
        snippet: msg.bodyPreview || '',
      }
    })

    let summary = `Found ${messages.length} messages:\n\n`
    processedSummaries.forEach((msg, index) => {
      summary += `${index + 1}. Subject: ${msg.subject}\n`
      summary += `   From: ${msg.from}\n`
      summary += `   Date: ${msg.date}\n`
      summary += `   Preview: ${msg.snippet}\n\n`
    })
    summary += `To read full content of a specific message, use the outlook_read tool with messageId: ${processedSummaries.map((m) => m.id).join(', ')}`

    return {
      success: true,
      output: {
        content: summary,
        metadata: {
          results: processedSummaries.map((msg) => ({
            id: msg.id,
            conversationId: msg.conversationId,
            subject: msg.subject,
            from: msg.from,
            date: msg.date,
          })),
        },
        attachments: [],
      },
    }
  },

  outputs: {
    content: { type: 'string', description: 'Email body text content' },
    metadata: { type: 'json', description: 'Email metadata (id, from, to, subject, date, etc.)' },
    attachments: { type: 'file[]', description: 'Email attachments array' },
  },
}
