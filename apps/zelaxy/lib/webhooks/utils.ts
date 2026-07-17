import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { getOAuthToken } from '@/app/api/auth/oauth/utils'
import { db } from '@/db'
import { webhook } from '@/db/schema'

const logger = createLogger('WebhookUtils')

/**
 * Handle WhatsApp verification requests
 */
export async function handleWhatsAppVerification(
  requestId: string,
  path: string,
  mode: string | null,
  token: string | null,
  challenge: string | null
): Promise<NextResponse | null> {
  if (mode && token && challenge) {
    // This is a WhatsApp verification request
    logger.info(`[${requestId}] WhatsApp verification request received for path: ${path}`)

    if (mode !== 'subscribe') {
      logger.warn(`[${requestId}] Invalid WhatsApp verification mode: ${mode}`)
      return new NextResponse('Invalid mode', { status: 400 })
    }

    // Find all active WhatsApp webhooks
    const webhooks = await db
      .select()
      .from(webhook)
      .where(and(eq(webhook.provider, 'whatsapp'), eq(webhook.isActive, true)))

    // Check if any webhook has a matching verification token
    for (const wh of webhooks) {
      const providerConfig = (wh.providerConfig as Record<string, any>) || {}
      const verificationToken = providerConfig.verificationToken

      if (!verificationToken) {
        logger.debug(`[${requestId}] Webhook ${wh.id} has no verification token, skipping`)
        continue
      }

      if (token === verificationToken) {
        logger.info(`[${requestId}] WhatsApp verification successful for webhook ${wh.id}`)
        // Return ONLY the challenge as plain text (exactly as WhatsApp expects)
        return new NextResponse(challenge, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      }
    }

    logger.warn(`[${requestId}] No matching WhatsApp verification token found`)
    return new NextResponse('Verification failed', { status: 403 })
  }

  return null
}

/**
 * Handle Slack verification challenges
 */
export function handleSlackChallenge(body: any): NextResponse | null {
  if (body.type === 'url_verification' && body.challenge) {
    return NextResponse.json({ challenge: body.challenge })
  }

  return null
}

/**
 * Validates a Slack webhook request signature using HMAC SHA-256
 * @param signingSecret - Slack signing secret for validation
 * @param signature - X-Slack-Signature header value
 * @param timestamp - X-Slack-Request-Timestamp header value
 * @param body - Raw request body string
 * @returns Whether the signature is valid
 */

export async function validateSlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  try {
    // Basic validation first
    if (!signingSecret || !signature || !timestamp || !body) {
      return false
    }

    // Check if the timestamp is too old (> 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000)
    if (Math.abs(currentTime - Number.parseInt(timestamp)) > 300) {
      return false
    }

    // Compute the signature
    const encoder = new TextEncoder()
    const baseString = `v0:${timestamp}:${body}`

    // Create the HMAC with the signing secret
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(signingSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(baseString))

    // Convert the signature to hex
    const signatureHex = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Prepare the expected signature format
    const computedSignature = `v0=${signatureHex}`

    // Constant-time comparison to prevent timing attacks
    if (computedSignature.length !== signature.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < computedSignature.length; i++) {
      result |= computedSignature.charCodeAt(i) ^ signature.charCodeAt(i)
    }

    return result === 0
  } catch (error) {
    console.error('Error validating Slack signature:', error)
    return false
  }
}

/**
 * Format webhook input based on provider
 */
export function formatWebhookInput(
  foundWebhook: any,
  foundWorkflow: any,
  body: any,
  request: NextRequest
): any {
  if (foundWebhook.provider === 'whatsapp') {
    // WhatsApp input formatting logic
    const data = body?.entry?.[0]?.changes?.[0]?.value
    const messages = data?.messages || []

    if (messages.length > 0) {
      const message = messages[0]
      const phoneNumberId = data.metadata?.phone_number_id
      const from = message.from
      const messageId = message.id
      const timestamp = message.timestamp
      const text = message.text?.body

      return {
        whatsapp: {
          data: {
            messageId,
            from,
            phoneNumberId,
            text,
            timestamp,
            raw: message,
          },
        },
        webhook: {
          data: {
            provider: 'whatsapp',
            path: foundWebhook.path,
            providerConfig: foundWebhook.providerConfig,
            payload: body,
            headers: Object.fromEntries(request.headers.entries()),
            method: request.method,
          },
        },
        workflowId: foundWorkflow.id,
      }
    }
    return null
  }

  if (foundWebhook.provider === 'telegram') {
    // Telegram input formatting logic
    const message =
      body?.message || body?.edited_message || body?.channel_post || body?.edited_channel_post

    if (message) {
      // Extract message text with fallbacks for different content types
      let input = ''

      if (message.text) {
        input = message.text
      } else if (message.caption) {
        input = message.caption
      } else if (message.photo) {
        input = 'Photo message'
      } else if (message.document) {
        input = `Document: ${message.document.file_name || 'file'}`
      } else if (message.audio) {
        input = `Audio: ${message.audio.title || 'audio file'}`
      } else if (message.video) {
        input = 'Video message'
      } else if (message.voice) {
        input = 'Voice message'
      } else if (message.sticker) {
        input = `Sticker: ${message.sticker.emoji || '🎭'}`
      } else if (message.location) {
        input = 'Location shared'
      } else if (message.contact) {
        input = `Contact: ${message.contact.first_name || 'contact'}`
      } else if (message.poll) {
        input = `Poll: ${message.poll.question}`
      } else {
        input = 'Message received'
      }

      // Create the message object for easier access
      const messageObj = {
        id: message.message_id,
        text: message.text,
        caption: message.caption,
        date: message.date,
        messageType: message.photo
          ? 'photo'
          : message.document
            ? 'document'
            : message.audio
              ? 'audio'
              : message.video
                ? 'video'
                : message.voice
                  ? 'voice'
                  : message.sticker
                    ? 'sticker'
                    : message.location
                      ? 'location'
                      : message.contact
                        ? 'contact'
                        : message.poll
                          ? 'poll'
                          : 'text',
        raw: message,
        // Backward-compatible flat aliases matching original trigger schema
        // These allow {{webhook1.message.chat_id}} etc. to resolve correctly
        update_id: body.update_id,
        message_id: message.message_id,
        from_id: message.from?.id ?? null,
        from_username: message.from?.username ?? null,
        from_first_name: message.from?.first_name ?? null,
        from_last_name: message.from?.last_name ?? null,
        chat_id: message.chat?.id ?? null,
        chat_type: message.chat?.type ?? null,
        chat_title: message.chat?.title ?? null,
      }

      // Create sender object
      const senderObj = message.from
        ? {
            id: message.from.id,
            firstName: message.from.first_name,
            lastName: message.from.last_name,
            username: message.from.username,
            languageCode: message.from.language_code,
            isBot: message.from.is_bot,
          }
        : null

      // Create chat object
      const chatObj = message.chat
        ? {
            id: message.chat.id,
            type: message.chat.type,
            title: message.chat.title,
            username: message.chat.username,
            firstName: message.chat.first_name,
            lastName: message.chat.last_name,
          }
        : null

      return {
        input, // Primary workflow input - the message content
        chatId: chatObj?.id ?? null, // Top-level shortcut — always use this as chatId in Telegram blocks

        // NEW: Top-level properties for backward compatibility with <blockName.message> syntax
        message: messageObj,
        sender: senderObj,
        chat: chatObj,
        updateId: body.update_id,
        updateType: body.message
          ? 'message'
          : body.edited_message
            ? 'edited_message'
            : body.channel_post
              ? 'channel_post'
              : body.edited_channel_post
                ? 'edited_channel_post'
                : 'unknown',

        // Keep the nested structure for the new telegram.message.text syntax
        telegram: {
          message: messageObj,
          sender: senderObj,
          chat: chatObj,
          updateId: body.update_id,
          updateType: body.message
            ? 'message'
            : body.edited_message
              ? 'edited_message'
              : body.channel_post
                ? 'channel_post'
                : body.edited_channel_post
                  ? 'edited_channel_post'
                  : 'unknown',
        },
        webhook: {
          data: {
            provider: 'telegram',
            path: foundWebhook.path,
            providerConfig: foundWebhook.providerConfig,
            payload: body,
            headers: Object.fromEntries(request.headers.entries()),
            method: request.method,
          },
        },
        workflowId: foundWorkflow.id,
      }
    }

    // Fallback for unknown Telegram update types
    logger.warn('Unknown Telegram update type', {
      updateId: body.update_id,
      bodyKeys: Object.keys(body || {}),
    })

    return {
      input: 'Telegram update received',
      telegram: {
        updateId: body.update_id,
        updateType: 'unknown',
        raw: body,
      },
      webhook: {
        data: {
          provider: 'telegram',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'gmail') {
    if (body && typeof body === 'object' && 'email' in body) {
      return body // { email: {...}, timestamp: ... }
    }
    return body
  }

  if (foundWebhook.provider === 'outlook') {
    if (body && typeof body === 'object' && 'email' in body) {
      return body // { email: {...}, timestamp: ... }
    }
    return body
  }

  if (foundWebhook.provider === 'microsoftteams') {
    // Microsoft Teams outgoing webhook - Teams sending data to us
    const messageText = body?.text || ''
    const messageId = body?.id || ''
    const timestamp = body?.timestamp || body?.localTimestamp || ''
    const from = body?.from || {}
    const conversation = body?.conversation || {}

    return {
      input: messageText, // Primary workflow input - the message text

      // Top-level properties for backward compatibility with <blockName.text> syntax
      type: body?.type || 'message',
      id: messageId,
      timestamp,
      localTimestamp: body?.localTimestamp || '',
      serviceUrl: body?.serviceUrl || '',
      channelId: body?.channelId || '',
      from_id: from.id || '',
      from_name: from.name || '',
      conversation_id: conversation.id || '',
      text: messageText,

      microsoftteams: {
        message: {
          id: messageId,
          text: messageText,
          timestamp,
          type: body?.type || 'message',
          serviceUrl: body?.serviceUrl,
          channelId: body?.channelId,
          raw: body,
        },
        from: {
          id: from.id,
          name: from.name,
          aadObjectId: from.aadObjectId,
        },
        conversation: {
          id: conversation.id,
          name: conversation.name,
          conversationType: conversation.conversationType,
          tenantId: conversation.tenantId,
        },
        activity: {
          type: body?.type,
          id: body?.id,
          timestamp: body?.timestamp,
          localTimestamp: body?.localTimestamp,
          serviceUrl: body?.serviceUrl,
          channelId: body?.channelId,
        },
      },
      webhook: {
        data: {
          provider: 'microsoftteams',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'slack') {
    // Slack input formatting logic - check for valid event
    const event = body?.event

    if (event && body?.type === 'event_callback') {
      // Extract event text with fallbacks for different event types
      let input = ''

      if (event.text) {
        input = event.text
      } else if (event.type === 'app_mention') {
        input = 'App mention received'
      } else {
        input = 'Slack event received'
      }

      // Create the event object for easier access
      const eventObj = {
        event_type: event.type || '',
        channel: event.channel || '',
        channel_name: '', // Could be resolved via additional API calls if needed
        user: event.user || '',
        user_name: '', // Could be resolved via additional API calls if needed
        text: event.text || '',
        timestamp: event.ts || event.event_ts || '',
        team_id: body.team_id || event.team || '',
        event_id: body.event_id || '',
      }

      return {
        input, // Primary workflow input - the event content

        // // // Top-level properties for backward compatibility with <blockName.event> syntax
        event: eventObj,

        // Keep the nested structure for the new slack.event.text syntax
        slack: {
          event: eventObj,
        },
        webhook: {
          data: {
            provider: 'slack',
            path: foundWebhook.path,
            providerConfig: foundWebhook.providerConfig,
            payload: body,
            headers: Object.fromEntries(request.headers.entries()),
            method: request.method,
          },
        },
        workflowId: foundWorkflow.id,
      }
    }

    // Fallback for unknown Slack event types
    logger.warn('Unknown Slack event type', {
      type: body?.type,
      hasEvent: !!body?.event,
      bodyKeys: Object.keys(body || {}),
    })

    return {
      input: 'Slack webhook received',
      slack: {
        event: {
          event_type: body?.event?.type || body?.type || 'unknown',
          channel: body?.event?.channel || '',
          user: body?.event?.user || '',
          text: body?.event?.text || '',
          timestamp: body?.event?.ts || '',
          team_id: body?.team_id || '',
          event_id: body?.event_id || '',
        },
      },
      webhook: {
        data: {
          provider: 'slack',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'github') {
    // GitHub webhook input formatting logic
    const eventType = request.headers.get('x-github-event') || 'unknown'
    const delivery = request.headers.get('x-github-delivery') || ''

    // Extract common GitHub properties
    const repository = body?.repository || {}
    const sender = body?.sender || {}
    const action = body?.action || ''

    // Build GitHub-specific variables based on the trigger config outputs
    const githubData = {
      // Event metadata
      event_type: eventType,
      action: action,
      delivery_id: delivery,

      // Repository information (avoid 'repository' to prevent conflict with the object)
      repository_full_name: repository.full_name || '',
      repository_name: repository.name || '',
      repository_owner: repository.owner?.login || '',
      repository_id: repository.id || '',
      repository_url: repository.html_url || '',

      // Sender information (avoid 'sender' to prevent conflict with the object)
      sender_login: sender.login || '',
      sender_id: sender.id || '',
      sender_type: sender.type || '',
      sender_url: sender.html_url || '',

      // Event-specific data
      ...(body?.ref && {
        ref: body.ref,
        branch: body.ref?.replace('refs/heads/', '') || '',
      }),
      ...(body?.before && { before: body.before }),
      ...(body?.after && { after: body.after }),
      ...(body?.commits && {
        commits: JSON.stringify(body.commits),
        commit_count: body.commits.length || 0,
      }),
      ...(body?.head_commit && {
        commit_message: body.head_commit.message || '',
        commit_author: body.head_commit.author?.name || '',
        commit_sha: body.head_commit.id || '',
        commit_url: body.head_commit.url || '',
      }),
      ...(body?.pull_request && {
        pull_request: JSON.stringify(body.pull_request),
        pr_number: body.pull_request.number || '',
        pr_title: body.pull_request.title || '',
        pr_state: body.pull_request.state || '',
        pr_url: body.pull_request.html_url || '',
      }),
      ...(body?.issue && {
        issue: JSON.stringify(body.issue),
        issue_number: body.issue.number || '',
        issue_title: body.issue.title || '',
        issue_state: body.issue.state || '',
        issue_url: body.issue.html_url || '',
      }),
      ...(body?.comment && {
        comment: JSON.stringify(body.comment),
        comment_body: body.comment.body || '',
        comment_url: body.comment.html_url || '',
      }),
    }

    // Set input based on event type for workflow processing
    let input = ''
    switch (eventType) {
      case 'push':
        input = `Push to ${githubData.branch || githubData.ref}: ${githubData.commit_message || 'No commit message'}`
        break
      case 'pull_request':
        input = `${action} pull request: ${githubData.pr_title || 'No title'}`
        break
      case 'issues':
        input = `${action} issue: ${githubData.issue_title || 'No title'}`
        break
      case 'issue_comment':
      case 'pull_request_review_comment':
        input = `Comment ${action}: ${githubData.comment_body?.slice(0, 100) || 'No comment body'}${(githubData.comment_body?.length || 0) > 100 ? '...' : ''}`
        break
      default:
        input = `GitHub ${eventType} event${action ? ` (${action})` : ''}`
    }

    return {
      input, // Primary workflow input

      // Top-level properties for backward compatibility
      ...githubData,

      // GitHub data structured for trigger handler to extract
      github: {
        // Processed convenience variables
        ...githubData,
        // Raw GitHub webhook payload for direct field access
        ...body,
      },

      webhook: {
        data: {
          provider: 'github',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'gitlab') {
    // GitLab webhook input formatting logic.
    // Fields are flattened to the top level so the trigger handler lifts them to the block's
    // root output (it only auto-copies objects for non-GitHub providers, so scalars must be here).
    const eventType = request.headers.get('x-gitlab-event') || 'unknown'
    const objectAttributes = body?.object_attributes || {}
    const project = body?.project || {}

    const gitlabData = {
      // Event metadata
      event_type: eventType,
      object_kind: body?.object_kind || '',
      event_name: body?.event_name || '',
      action: objectAttributes.action || '',

      // Project information (avoid 'project' to prevent conflict with the object)
      project_id: body?.project_id || project.id || '',
      project_name: project.name || '',
      project_path: project.path_with_namespace || '',
      project_url: project.web_url || '',

      // User information (GitLab sends these flat on push, nested on other events)
      user_id: body?.user_id || body?.user?.id || '',
      user_name: body?.user_name || body?.user?.name || '',
      user_username: body?.user_username || body?.user?.username || '',
      user_email: body?.user_email || '',
      user_avatar: body?.user_avatar || body?.user?.avatar_url || '',

      // Event-specific data
      ...(body?.ref && {
        ref: body.ref,
        branch: body.ref?.replace('refs/heads/', '') || '',
      }),
      ...(body?.before && { before: body.before }),
      ...(body?.after && { after: body.after }),
      ...(body?.checkout_sha && { checkout_sha: body.checkout_sha }),
      ...(body?.total_commits_count !== undefined && {
        total_commits_count: body.total_commits_count,
      }),
      ...(body?.commits && {
        commits: body.commits,
        commit_message: body.commits[0]?.message || '',
        commit_author: body.commits[0]?.author?.name || '',
        commit_url: body.commits[0]?.url || '',
      }),
      ...(body?.object_attributes && {
        object_attributes: objectAttributes,
        title: objectAttributes.title || '',
        state: objectAttributes.state || '',
        url: objectAttributes.url || '',
      }),
      ...(body?.project && { project }),
      ...(body?.repository && { repository: body.repository }),
      ...(body?.user && { user: body.user }),
    }

    // Human-readable summary used as the primary workflow input
    let input: string
    switch (body?.object_kind) {
      case 'push':
        input = `Push to ${gitlabData.branch || gitlabData.ref}: ${gitlabData.commit_message || 'No commit message'}`
        break
      case 'merge_request':
        input = `${objectAttributes.action || 'updated'} merge request: ${objectAttributes.title || 'No title'}`
        break
      case 'issue':
        input = `${objectAttributes.action || 'updated'} issue: ${objectAttributes.title || 'No title'}`
        break
      case 'pipeline':
        input = `Pipeline ${objectAttributes.status || 'updated'} for ${gitlabData.project_path || 'project'}`
        break
      case 'note':
        input = `Comment: ${objectAttributes.note?.slice(0, 100) || 'No comment body'}`
        break
      default:
        input = `GitLab ${eventType} event`
    }

    return {
      input,

      // Top-level properties for direct access
      ...gitlabData,

      // GitLab data structured for the trigger handler to extract
      gitlab: {
        ...gitlabData,
        // Raw GitLab webhook payload for direct field access
        ...body,
      },

      webhook: {
        data: {
          provider: 'gitlab',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'typeform') {
    // Typeform webhook input formatting logic.
    // Typeform nests everything under `form_response`; flatten it to the top level so the
    // declared trigger outputs resolve (see the GitLab case above for why this is required).
    const formResponse = body?.form_response || {}
    const definition = formResponse.definition || {}
    const answers = Array.isArray(formResponse.answers) ? formResponse.answers : []

    // Map field id -> question title so answers can be keyed by the question people recognise
    const fieldTitles: Record<string, string> = {}
    if (Array.isArray(definition.fields)) {
      for (const field of definition.fields) {
        if (field?.id) {
          fieldTitles[field.id] = field.title || field.ref || field.id
        }
      }
    }

    // Unwrap each answer to a plain value (Typeform keys the value by the answer's type)
    const fields: Record<string, any> = {}
    for (const answer of answers) {
      const fieldId = answer?.field?.id
      const key = (fieldId && fieldTitles[fieldId]) || answer?.field?.ref || fieldId
      if (!key) continue

      switch (answer?.type) {
        case 'choice':
          fields[key] = answer.choice?.label ?? answer.choice?.other ?? ''
          break
        case 'choices':
          fields[key] = answer.choices?.labels ?? []
          break
        case 'payment':
          fields[key] = answer.payment ?? null
          break
        default:
          // text, email, number, boolean, date, url, file_url, phone_number, ...
          fields[key] = answer?.[answer?.type] ?? null
      }
    }

    const typeformData = {
      event_id: body?.event_id || '',
      event_type: body?.event_type || '',
      form_id: formResponse.form_id || '',
      form_title: definition.title || '',
      token: formResponse.token || '',
      submitted_at: formResponse.submitted_at || '',
      landed_at: formResponse.landed_at || '',
      answers,
      fields,
      answer_count: answers.length,
      hidden: formResponse.hidden || {},
      definition,
      ...(formResponse.variables && { variables: formResponse.variables }),
      ...(formResponse.calculated && { calculated: formResponse.calculated }),
      ...(formResponse.ending && { ending: formResponse.ending }),
      raw: body,
    }

    return {
      input: `Typeform submission: ${definition.title || formResponse.form_id || 'form'}`,

      // Top-level properties for direct access
      ...typeformData,

      // Typeform data structured for the trigger handler to extract
      typeform: {
        ...typeformData,
        ...body,
      },

      webhook: {
        data: {
          provider: 'typeform',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'sentry') {
    // Sentry webhook input formatting. Sentry nests the interesting fields under data.issue /
    // data.error; flatten them so the declared trigger outputs resolve.
    const resource = request.headers.get('sentry-hook-resource') || ''
    const data = body?.data || {}
    const issue = data.issue || {}
    const error = data.error || data.event || {}

    const sentryData = {
      action: body?.action || '',
      resource,
      actor_name: body?.actor?.name || '',
      data,
      ...(data.issue && {
        issue_id: issue.id || '',
        issue_title: issue.title || '',
        issue_url: issue.permalink || issue.web_url || '',
        short_id: issue.shortId || '',
        culprit: issue.culprit || '',
        level: issue.level || '',
        status: issue.status || '',
        event_count: issue.count || '',
        user_count: issue.userCount ?? 0,
        first_seen: issue.firstSeen || '',
        last_seen: issue.lastSeen || '',
        project_slug: issue.project?.slug || '',
      }),
      ...((data.error || data.event) && {
        error_id: error.event_id || error.id || '',
        error_message: error.message || error.title || '',
        environment: error.environment || '',
        ...(!data.issue && { issue_url: error.web_url || '' }),
      }),
      raw: body,
    }

    return {
      input: `Sentry ${body?.action || 'event'}: ${issue.title || error.message || resource || 'event'}`,
      ...sentryData,
      sentry: { ...sentryData, ...body },
      webhook: {
        data: {
          provider: 'sentry',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'calendly') {
    // Calendly webhook input formatting. Everything useful is under payload / payload.scheduled_event.
    const payload = body?.payload || {}
    const scheduledEvent = payload.scheduled_event || {}
    const qAndA = Array.isArray(payload.questions_and_answers) ? payload.questions_and_answers : []

    // Key booking answers by their question text for direct access
    const answers: Record<string, any> = {}
    for (const entry of qAndA) {
      if (entry?.question) {
        answers[entry.question] = entry.answer ?? ''
      }
    }

    const calendlyData = {
      event: body?.event || '',
      invitee_name: payload.name || '',
      invitee_email: payload.email || '',
      invitee_timezone: payload.timezone || '',
      invitee_status: payload.status || '',
      invitee_uri: payload.uri || '',
      reschedule_url: payload.reschedule_url || '',
      cancel_url: payload.cancel_url || '',
      rescheduled: payload.rescheduled ?? false,
      event_name: scheduledEvent.name || '',
      event_uri: scheduledEvent.uri || '',
      event_status: scheduledEvent.status || '',
      start_time: scheduledEvent.start_time || '',
      end_time: scheduledEvent.end_time || '',
      location: scheduledEvent.location || {},
      join_url: scheduledEvent.location?.join_url || '',
      questions_and_answers: qAndA,
      answers,
      ...(payload.cancellation && {
        cancellation: payload.cancellation,
        cancel_reason: payload.cancellation.reason || '',
      }),
      ...(payload.tracking && { tracking: payload.tracking }),
      payload,
      raw: body,
    }

    return {
      input: `Calendly ${body?.event || 'event'}: ${payload.name || payload.email || 'invitee'} — ${scheduledEvent.name || 'meeting'}`,
      ...calendlyData,
      calendly: { ...calendlyData, ...body },
      webhook: {
        data: {
          provider: 'calendly',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'pagerduty') {
    // PagerDuty v3 webhook input formatting. The incident lives at event.data.
    const event = body?.event || {}
    const incident = event.data || {}
    const assignees = Array.isArray(incident.assignees) ? incident.assignees : []

    const pagerdutyData = {
      event_type: event.event_type || '',
      event_id: event.id || '',
      occurred_at: event.occurred_at || '',
      agent_name: event.agent?.summary || '',
      incident_id: incident.id || '',
      incident_number: incident.number ?? 0,
      title: incident.title || '',
      status: incident.status || '',
      urgency: incident.urgency || '',
      priority: incident.priority?.summary || '',
      html_url: incident.html_url || '',
      created_at: incident.created_at || '',
      service_id: incident.service?.id || '',
      service_name: incident.service?.summary || '',
      escalation_policy: incident.escalation_policy?.summary || '',
      assignees,
      assignee_names: assignees.map((a: any) => a?.summary || '').filter(Boolean),
      incident,
      raw: body,
    }

    return {
      input: `PagerDuty ${event.event_type || 'event'}: ${incident.title || 'incident'}`,
      ...pagerdutyData,
      pagerduty: { ...pagerdutyData, ...body },
      webhook: {
        data: {
          provider: 'pagerduty',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'vercel') {
    // Vercel webhook input formatting. Deployment/project details live under payload.
    const payload = body?.payload || {}
    const deployment = payload.deployment || {}
    const meta = deployment.meta || {}

    const vercelData = {
      event_type: body?.type || '',
      event_id: body?.id || '',
      created_at: body?.createdAt ?? 0,
      region: body?.region || '',
      deployment_id: deployment.id || '',
      deployment_url: deployment.url || '',
      deployment_name: deployment.name || '',
      target: deployment.target || '',
      inspector_url: deployment.inspectorUrl || '',
      project_id: payload.project?.id || '',
      project_name: payload.project?.name || deployment.name || '',
      team_id: payload.team?.id || '',
      user_id: payload.user?.id || '',
      // Vercel keys git metadata by provider (github/gitlab/bitbucket); fall back across them
      git_branch: meta.githubCommitRef || meta.gitlabCommitRef || meta.bitbucketCommitRef || '',
      git_sha: meta.githubCommitSha || meta.gitlabCommitSha || meta.bitbucketCommitSha || '',
      git_message:
        meta.githubCommitMessage || meta.gitlabCommitMessage || meta.bitbucketCommitMessage || '',
      payload,
      raw: body,
    }

    return {
      input: `Vercel ${body?.type || 'event'}: ${vercelData.project_name || 'project'}${vercelData.git_branch ? ` (${vercelData.git_branch})` : ''}`,
      ...vercelData,
      vercel: { ...vercelData, ...body },
      webhook: {
        data: {
          provider: 'vercel',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'zoom') {
    // Zoom webhook input formatting. Meeting/recording details live under payload.object.
    const payload = body?.payload || {}
    const object = payload.object || {}
    const participant = object.participant || {}

    const zoomData = {
      event_type: body?.event || '',
      event_ts: body?.event_ts ?? 0,
      account_id: payload.account_id || '',
      meeting_id: object.id || '',
      meeting_uuid: object.uuid || '',
      topic: object.topic || '',
      host_id: object.host_id || '',
      start_time: object.start_time || '',
      end_time: object.end_time || '',
      duration: object.duration ?? 0,
      join_url: object.join_url || '',
      ...(object.participant && {
        participant_name: participant.user_name || '',
        participant_email: participant.email || '',
        participant_id: participant.user_id || '',
        join_time: participant.join_time || '',
        leave_time: participant.leave_time || '',
      }),
      ...(object.recording_files && {
        recording_files: object.recording_files,
        share_url: object.share_url || '',
      }),
      object,
      raw: body,
    }

    return {
      input: `Zoom ${body?.event || 'event'}: ${object.topic || 'meeting'}`,
      ...zoomData,
      zoom: { ...zoomData, ...body },
      webhook: {
        data: {
          provider: 'zoom',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'clerk') {
    // Clerk webhook input formatting. Clerk wraps the record in `data` and names the event `type`.
    const data = body?.data || {}
    const primaryEmail = Array.isArray(data.email_addresses)
      ? data.email_addresses.find((e: any) => e?.id === data.primary_email_address_id) ||
        data.email_addresses[0]
      : undefined

    const clerkData = {
      event_type: body?.type || '',
      object_id: data.id || '',
      ...(data.email_addresses && {
        email: primaryEmail?.email_address || '',
      }),
      ...(data.first_name !== undefined && {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        full_name: [data.first_name, data.last_name].filter(Boolean).join(' '),
      }),
      ...(data.username !== undefined && { username: data.username || '' }),
      ...(data.image_url !== undefined && { image_url: data.image_url || '' }),
      ...(data.user_id !== undefined && { user_id: data.user_id || '' }),
      ...(data.organization !== undefined && { organization: data.organization }),
      ...(data.name !== undefined && { name: data.name || '' }),
      ...(data.slug !== undefined && { slug: data.slug || '' }),
      created_at: data.created_at ?? 0,
      updated_at: data.updated_at ?? 0,
      data,
      raw: body,
    }

    return {
      input: `Clerk ${body?.type || 'event'}: ${clerkData.email || clerkData.name || data.id || ''}`,
      ...clerkData,
      clerk: { ...clerkData, ...body },
      webhook: {
        data: {
          provider: 'clerk',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'calcom') {
    // Cal.com webhook input formatting. Booking details live under payload.
    const payload = body?.payload || {}
    const attendee = Array.isArray(payload.attendees) ? payload.attendees[0] || {} : {}
    const responses = payload.responses || {}

    // Cal.com wraps each booking-question response as { label, value }; unwrap to plain values
    const answers: Record<string, any> = {}
    for (const [key, entry] of Object.entries<any>(responses)) {
      answers[key] = entry && typeof entry === 'object' && 'value' in entry ? entry.value : entry
    }

    const calcomData = {
      event_type: body?.triggerEvent || '',
      booking_id: payload.bookingId ?? payload.uid ?? '',
      uid: payload.uid || '',
      title: payload.title || '',
      event_type_name: payload.eventType?.title || payload.type || '',
      start_time: payload.startTime || '',
      end_time: payload.endTime || '',
      organizer_name: payload.organizer?.name || '',
      organizer_email: payload.organizer?.email || '',
      attendee_name: attendee.name || '',
      attendee_email: attendee.email || '',
      attendee_timezone: attendee.timeZone || '',
      attendees: payload.attendees || [],
      location: payload.location || '',
      status: payload.status || '',
      cancellation_reason: payload.cancellationReason || '',
      meeting_url: payload.videoCallData?.url || payload.metadata?.videoCallUrl || '',
      answers,
      responses,
      payload,
      raw: body,
    }

    return {
      input: `Cal.com ${body?.triggerEvent || 'event'}: ${payload.title || 'booking'}`,
      ...calcomData,
      calcom: { ...calcomData, ...body },
      webhook: {
        data: {
          provider: 'calcom',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'resend') {
    // Resend webhook input formatting. Email details live under data.
    const data = body?.data || {}
    const toList = Array.isArray(data.to) ? data.to : data.to ? [data.to] : []

    const resendData = {
      event_type: body?.type || '',
      created_at: body?.created_at || '',
      email_id: data.email_id || '',
      from: data.from || '',
      to: toList,
      to_email: toList[0] || '',
      subject: data.subject || '',
      ...(data.click && {
        click_link: data.click.link || '',
        click_timestamp: data.click.timestamp || '',
      }),
      ...(data.bounce && {
        bounce_type: data.bounce.type || '',
        bounce_message: data.bounce.message || '',
      }),
      ...(data.failed && { failure_reason: data.failed.reason || '' }),
      data,
      raw: body,
    }

    return {
      input: `Resend ${body?.type || 'event'}: ${data.subject || resendData.to_email || 'email'}`,
      ...resendData,
      resend: { ...resendData, ...body },
      webhook: {
        data: {
          provider: 'resend',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'twilio' || foundWebhook.provider === 'twilio_voice') {
    // Twilio posts flat form fields (already decoded into `body` by the route), using PascalCase
    // keys. Expose snake_case aliases so references match the rest of the trigger surface, and
    // collect the numbered Media* fields MMS spreads across separate keys.
    const numMedia = Number.parseInt(body?.NumMedia ?? '0', 10) || 0
    const media = Array.from({ length: numMedia }, (_, i) => ({
      url: body?.[`MediaUrl${i}`] || '',
      content_type: body?.[`MediaContentType${i}`] || '',
    })).filter((m) => m.url)

    const twilioData = {
      message_sid: body?.MessageSid || body?.SmsSid || '',
      call_sid: body?.CallSid || '',
      account_sid: body?.AccountSid || '',
      from: body?.From || '',
      to: body?.To || '',
      body: body?.Body || '',
      message_status: body?.MessageStatus || body?.SmsStatus || '',
      call_status: body?.CallStatus || '',
      direction: body?.Direction || '',
      from_city: body?.FromCity || '',
      from_state: body?.FromState || '',
      from_country: body?.FromCountry || '',
      num_media: numMedia,
      ...(media.length > 0 && { media }),
      ...(body?.ErrorCode && {
        error_code: body.ErrorCode,
        error_message: body?.ErrorMessage || '',
      }),
      ...(body?.RecordingUrl && {
        recording_url: body.RecordingUrl,
        recording_sid: body?.RecordingSid || '',
        recording_duration: body?.RecordingDuration || '',
      }),
      ...(body?.CallDuration && { call_duration: body.CallDuration }),
      raw: body,
    }

    const isVoice = foundWebhook.provider === 'twilio_voice'

    return {
      input: isVoice
        ? `Twilio call ${twilioData.call_status || 'event'} from ${twilioData.from}`
        : twilioData.body || `Twilio message from ${twilioData.from}`,
      ...twilioData,
      [foundWebhook.provider]: { ...twilioData, ...body },
      webhook: {
        data: {
          provider: foundWebhook.provider,
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'attio') {
    const events = Array.isArray(body?.events) ? body.events : []
    const first = events[0] || {}
    const data = {
      event_type: first?.event_type || '',
      webhook_id: body?.webhook_id || '',
      record_id: first?.id?.record_id || '',
      object_id: first?.id?.object_id || '',
      actor_type: first?.actor?.type || '',
      actor_id: first?.actor?.id || '',
      events: events,
      raw: body,
    }

    return {
      input: `Attio ${data.event_type || 'event'}`,
      ...data,
      attio: { ...data, ...body },
      webhook: {
        data: {
          provider: 'attio',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'azure_devops') {
    const resource = body?.resource || {}
    const data = {
      event_type: body?.eventType || '',
      subscription_id: body?.subscriptionId || '',
      message: body?.message?.text || '',
      detailed_message: body?.detailedMessage?.text || '',
      build_number: resource.buildNumber || '',
      build_status: resource.status || '',
      build_result: resource.result || '',
      work_item_id: resource.id ?? resource.workItemId ?? 0,
      work_item_title: resource.fields?.['System.Title'] || '',
      work_item_state: resource.fields?.['System.State'] || '',
      pull_request_id: resource.pullRequestId ?? 0,
      pull_request_title: resource.title || '',
      project: resource.project?.name || resource.definition?.project?.name || '',
      resource: resource,
      raw: body,
    }

    return {
      input: data.message || `Azure DevOps ${data.event_type || 'event'}`,
      ...data,
      azure_devops: { ...data, ...body },
      webhook: {
        data: {
          provider: 'azure_devops',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'gong') {
    const data = {
      event_type: body?.eventType || '',
      call_id: body?.callId || body?.call?.id || '',
      call_title: body?.title || body?.call?.title || '',
      call_url: body?.url || body?.call?.url || '',
      started: body?.started || '',
      duration: body?.duration ?? 0,
      participants: Array.isArray(body?.participants) ? body.participants : [],
      raw: body,
    }

    return {
      input: `Gong ${data.event_type || 'event'}: ${data.call_title || 'call'}`,
      ...data,
      gong: { ...data, ...body },
      webhook: {
        data: {
          provider: 'gong',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'greenhouse') {
    const application = body?.payload?.application || {}
    const candidate = application.candidate || {}
    const data = {
      event_type: body?.action || '',
      candidate_id: candidate.id ?? 0,
      candidate_name: [candidate.first_name, candidate.last_name].filter(Boolean).join(' '),
      candidate_email: candidate.email_addresses?.[0]?.value || '',
      application_id: application.id ?? 0,
      job_id: application.jobs?.[0]?.id ?? 0,
      job_name: application.jobs?.[0]?.name || '',
      stage: application.current_stage?.name || '',
      status: application.status || '',
      payload: body?.payload || {},
      raw: body,
    }

    return {
      input: `Greenhouse ${data.event_type || 'event'}: ${data.candidate_name || 'candidate'}`,
      ...data,
      greenhouse: { ...data, ...body },
      webhook: {
        data: {
          provider: 'greenhouse',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'ashby') {
    const application = body?.data?.application || {}
    const candidate = application.candidate || {}
    const data = {
      event_type: body?.action || '',
      candidate_id: candidate.id || '',
      candidate_name: candidate.name || '',
      candidate_email: candidate.primaryEmailAddress?.value || '',
      application_id: application.id || '',
      job_id: application.job?.id || '',
      job_title: application.job?.title || '',
      stage: application.currentInterviewStage?.title || '',
      status: application.status || '',
      data: body?.data || {},
      raw: body,
    }

    return {
      input: `Ashby ${data.event_type || 'event'}: ${data.candidate_name || 'candidate'}`,
      ...data,
      ashby: { ...data, ...body },
      webhook: {
        data: {
          provider: 'ashby',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'incidentio') {
    const d = body?.public_data || body?.private_data || body?.data || {}
    const data = {
      event_type: body?.event_type || '',
      incident_id: d.id || '',
      incident_name: d.name || '',
      incident_status: d.incident_status?.name || '',
      severity: d.severity?.name || '',
      summary: d.summary || '',
      permalink: d.permalink || '',
      reference: d.reference || '',
      created_at: body?.created_at || '',
      data: d,
      raw: body,
    }

    return {
      input: `incident.io ${data.event_type || 'event'}: ${data.incident_name || 'incident'}`,
      ...data,
      incidentio: { ...data, ...body },
      webhook: {
        data: {
          provider: 'incidentio',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'rootly') {
    const a = body?.data?.attributes || {}
    const data = {
      event_type: body?.event || '',
      incident_id: body?.data?.id || '',
      incident_title: a.title || '',
      incident_status: a.status || '',
      severity: a.severity?.name || '',
      summary: a.summary || '',
      url: a.url || '',
      created_at: a.created_at || '',
      data: body?.data || {},
      raw: body,
    }

    return {
      input: `Rootly ${data.event_type || 'event'}: ${data.incident_title || 'incident'}`,
      ...data,
      rootly: { ...data, ...body },
      webhook: {
        data: {
          provider: 'rootly',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'revenuecat') {
    const ev = body?.event || {}
    const data = {
      event_type: ev.type || '',
      event_id: ev.id || '',
      app_user_id: ev.app_user_id || '',
      product_id: ev.product_id || '',
      entitlement_ids: Array.isArray(ev.entitlement_ids) ? ev.entitlement_ids : [],
      store: ev.store || '',
      environment: ev.environment || '',
      period_type: ev.period_type || '',
      price: ev.price ?? 0,
      currency: ev.currency || '',
      country_code: ev.country_code || '',
      expiration_at_ms: ev.expiration_at_ms ?? 0,
      purchased_at_ms: ev.purchased_at_ms ?? 0,
      cancel_reason: ev.cancel_reason || '',
      event: ev,
      raw: body,
    }

    return {
      input: `RevenueCat ${data.event_type || 'event'}: ${data.product_id || 'product'}`,
      ...data,
      revenuecat: { ...data, ...body },
      webhook: {
        data: {
          provider: 'revenuecat',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'loops') {
    const d = body?.data || {}
    const data = {
      event_type: body?.type || '',
      email: d.email || '',
      contact_id: d.contactId || '',
      campaign_id: d.campaignId || '',
      campaign_name: d.campaignName || '',
      email_message_id: d.emailMessageId || '',
      link_url: d.linkUrl || d.url || '',
      timestamp: body?.timestamp || '',
      data: d,
      raw: body,
    }

    return {
      input: `Loops ${data.event_type || 'event'}: ${data.email || 'contact'}`,
      ...data,
      loops: { ...data, ...body },
      webhook: {
        data: {
          provider: 'loops',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'fathom') {
    const data = {
      event_type: body?.type || body?.event || '',
      meeting_id: body?.id || body?.meeting?.id || '',
      meeting_title: body?.title || body?.meeting?.title || '',
      recording_url: body?.recording_url || '',
      share_url: body?.share_url || '',
      scheduled_start_time: body?.scheduled_start_time || '',
      summary: body?.summary || '',
      transcript: body?.transcript || '',
      invitees: Array.isArray(body?.invitees) ? body.invitees : [],
      raw: body,
    }

    return {
      input: `Fathom meeting: ${data.meeting_title || 'meeting'}`,
      ...data,
      fathom: { ...data, ...body },
      webhook: {
        data: {
          provider: 'fathom',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'grain') {
    const d = body?.data || {}
    const data = {
      event_type: body?.type || '',
      recording_id: d.id || '',
      recording_title: d.title || '',
      recording_url: d.url || '',
      highlight_id: d.highlight_id || '',
      highlight_text: d.text || '',
      start_datetime: d.start_datetime || '',
      end_datetime: d.end_datetime || '',
      participants: Array.isArray(d.participants) ? d.participants : [],
      data: d,
      raw: body,
    }

    return {
      input: `Grain ${data.event_type || 'event'}: ${data.recording_title || 'recording'}`,
      ...data,
      grain: { ...data, ...body },
      webhook: {
        data: {
          provider: 'grain',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'instantly') {
    const data = {
      event_type: body?.event_type || '',
      campaign_id: body?.campaign_id || '',
      campaign_name: body?.campaign_name || '',
      lead_email: body?.lead_email || '',
      lead_first_name: body?.firstName || '',
      lead_last_name: body?.lastName || '',
      lead_company: body?.companyName || '',
      email_account: body?.email_account || '',
      reply_text: body?.reply_text || body?.reply_text_snippet || '',
      reply_subject: body?.reply_subject || '',
      timestamp: body?.timestamp || '',
      raw: body,
    }

    return {
      input: `Instantly ${data.event_type || 'event'}: ${data.lead_email || 'lead'}`,
      ...data,
      instantly: { ...data, ...body },
      webhook: {
        data: {
          provider: 'instantly',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'lemlist') {
    const data = {
      event_type: body?.type || '',
      campaign_id: body?.campaignId || '',
      campaign_name: body?.campaignName || '',
      lead_email: body?.leadEmail || '',
      lead_first_name: body?.leadFirstName || '',
      lead_last_name: body?.leadLastName || '',
      lead_company: body?.companyName || '',
      sequence_step: body?.sequenceStep ?? 0,
      text: body?.text || '',
      created_at: body?.createdAt || '',
      raw: body,
    }

    return {
      input: `lemlist ${data.event_type || 'event'}: ${data.lead_email || 'lead'}`,
      ...data,
      lemlist: { ...data, ...body },
      webhook: {
        data: {
          provider: 'lemlist',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'linq') {
    const data = {
      event_type: body?.type || body?.event || '',
      message_id: body?.messageId || body?.id || '',
      status: body?.status || '',
      from: body?.from || '',
      to: body?.to || '',
      body: body?.body || body?.text || '',
      error_message: body?.errorMessage || '',
      timestamp: body?.timestamp || '',
      raw: body,
    }

    return {
      input: data.body || `Linq ${data.event_type || 'event'}`,
      ...data,
      linq: { ...data, ...body },
      webhook: {
        data: {
          provider: 'linq',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'circleback') {
    const m = body?.meeting || {}
    const data = {
      event_type: body?.type || '',
      meeting_id: m.id || '',
      meeting_name: m.name || '',
      meeting_url: m.url || '',
      start_time: m.startTime || '',
      end_time: m.endTime || '',
      notes: m.notes || '',
      action_items: Array.isArray(m.actionItems) ? m.actionItems : [],
      attendees: Array.isArray(m.attendees) ? m.attendees : [],
      raw: body,
    }

    return {
      input: `Circleback ${data.event_type || 'event'}: ${data.meeting_name || 'meeting'}`,
      ...data,
      circleback: { ...data, ...body },
      webhook: {
        data: {
          provider: 'circleback',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'emailbison') {
    const data = {
      event_type: body?.event || body?.event_type || '',
      campaign_id: body?.campaign_id || '',
      campaign_name: body?.campaign_name || '',
      lead_email: body?.lead_email || '',
      email_account: body?.email_account || '',
      subject: body?.subject || '',
      reply_text: body?.reply_text || '',
      timestamp: body?.timestamp || '',
      raw: body,
    }

    return {
      input: `EmailBison ${data.event_type || 'event'}: ${data.lead_email || 'lead'}`,
      ...data,
      emailbison: { ...data, ...body },
      webhook: {
        data: {
          provider: 'emailbison',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'sendblue') {
    const data = {
      event_type: body?.is_outbound ? 'message.status_updated' : 'message.received',
      message_handle: body?.message_handle || '',
      from_number: body?.from_number || body?.number || '',
      to_number: body?.to_number || '',
      content: body?.content || '',
      status: body?.status || '',
      error_message: body?.error_message || '',
      is_outbound: body?.is_outbound ?? false,
      media_url: body?.media_url || '',
      date_sent: body?.date_sent || '',
      raw: body,
    }

    return {
      input: data.content || `Sendblue ${data.event_type || 'event'}`,
      ...data,
      sendblue: { ...data, ...body },
      webhook: {
        data: {
          provider: 'sendblue',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'rss') {
    // RSS is polled rather than pushed: the polling service posts { feedUrl, item } back to this
    // route so feed runs go through the same pipeline as real webhooks.
    const item = body?.item || {}

    const rssData = {
      title: item.title || '',
      link: item.link || '',
      description: item.description || '',
      pub_date: item.pubDate || '',
      item_id: item.id || '',
      feed_url: body?.feedUrl || '',
      item,
      raw: body,
    }

    return {
      input: item.title || item.link || 'New RSS item',
      ...rssData,
      rss: { ...rssData, ...body },
      webhook: {
        data: {
          provider: 'rss',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'google_forms') {
    // Posted by the Apps Script the user installs on their form.
    const answers = body?.answers || {}

    const formsData = {
      form_id: body?.formId || '',
      response_id: body?.responseId || '',
      create_time: body?.createTime || '',
      last_submitted_time: body?.lastSubmittedTime || '',
      answers,
      answer_count: Object.keys(answers).length,
      raw: body,
    }

    return {
      input: `Google Forms response: ${body?.formId || 'form'}`,
      ...formsData,
      google_forms: { ...formsData, ...body },
      webhook: {
        data: {
          provider: 'google_forms',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'imap') {
    // IMAP is polled: the polling service posts { mailbox, email } back to this route so mail runs
    // go through the same pipeline as real webhooks.
    const email = body?.email || {}

    const imapData = {
      message_id: email.messageId || '',
      uid: email.uid ?? 0,
      subject: email.subject || '',
      from: email.from?.address || '',
      from_name: email.from?.name || '',
      to: Array.isArray(email.to) ? email.to : [],
      cc: Array.isArray(email.cc) ? email.cc : [],
      date: email.date || '',
      body_text: email.bodyText || '',
      mailbox: body?.mailbox || '',
      has_attachments: email.hasAttachments ?? false,
      raw: body,
    }

    return {
      input: email.subject || `Email from ${imapData.from || 'unknown sender'}`,
      ...imapData,
      imap: { ...imapData, ...body },
      webhook: {
        data: {
          provider: 'imap',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  if (foundWebhook.provider === 'jira_service_management') {
    // Jira posts the issue under `issue.fields`; flatten the fields a service desk workflow
    // actually reaches for so callers do not walk the envelope.
    const issue = body?.issue || {}
    const f = issue.fields || {}
    const comment = body?.comment || f.comment

    const jsmData = {
      event_type: body?.webhookEvent || '',
      issue_event_type: body?.issue_event_type_name || '',
      issue_key: issue.key || '',
      issue_id: issue.id || '',
      summary: f.summary || '',
      description: typeof f.description === 'string' ? f.description : '',
      status: f.status?.name || '',
      priority: f.priority?.name || '',
      request_type: f.customfield_10010?.requestType?.name || f.requestType?.name || '',
      reporter_name: f.reporter?.displayName || '',
      reporter_email: f.reporter?.emailAddress || '',
      assignee_name: f.assignee?.displayName || '',
      project_key: f.project?.key || '',
      user_name: body?.user?.displayName || '',
      timestamp: body?.timestamp ?? 0,
      ...(comment && {
        comment_body: comment.body || '',
        comment_author: comment.author?.displayName || '',
        // JSM marks customer-visible comments with this property; absent means internal
        comment_public: comment.jsdPublic ?? true,
      }),
      ...(body?.changelog && { changelog: body.changelog }),
      issue,
      raw: body,
    }

    return {
      input: f.summary || `Jira Service Management ${body?.webhookEvent || 'event'}`,
      ...jsmData,
      jira_service_management: { ...jsmData, ...body },
      webhook: {
        data: {
          provider: 'jira_service_management',
          path: foundWebhook.path,
          providerConfig: foundWebhook.providerConfig,
          payload: body,
          headers: Object.fromEntries(request.headers.entries()),
          method: request.method,
        },
      },
      workflowId: foundWorkflow.id,
    }
  }

  // Generic format for other providers
  return {
    webhook: {
      data: {
        path: foundWebhook.path,
        provider: foundWebhook.provider,
        providerConfig: foundWebhook.providerConfig,
        payload: body,
        headers: Object.fromEntries(request.headers.entries()),
        method: request.method,
      },
    },
    workflowId: foundWorkflow.id,
  }
}

/**
 * Validates a Microsoft Teams outgoing webhook request signature using HMAC SHA-256
 * @param hmacSecret - Microsoft Teams HMAC secret (base64 encoded)
 * @param signature - Authorization header value (should start with 'HMAC ')
 * @param body - Raw request body string
 * @returns Whether the signature is valid
 */
export function validateMicrosoftTeamsSignature(
  hmacSecret: string,
  signature: string,
  body: string
): boolean {
  try {
    // Basic validation first
    if (!hmacSecret || !signature || !body) {
      return false
    }

    // Check if signature has correct format
    if (!signature.startsWith('HMAC ')) {
      return false
    }

    const providedSignature = signature.substring(5) // Remove 'HMAC ' prefix

    // Compute HMAC SHA256 signature using Node.js crypto
    const crypto = require('crypto')
    const secretBytes = Buffer.from(hmacSecret, 'base64')
    const bodyBytes = Buffer.from(body, 'utf8')
    const computedHash = crypto.createHmac('sha256', secretBytes).update(bodyBytes).digest('base64')

    // Constant-time comparison to prevent timing attacks
    if (computedHash.length !== providedSignature.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash.charCodeAt(i) ^ providedSignature.charCodeAt(i)
    }

    return result === 0
  } catch (error) {
    console.error('Error validating Microsoft Teams signature:', error)
    return false
  }
}

/**
 * Validates a GitLab webhook request's secret token.
 *
 * GitLab does not sign the body; it echoes the configured secret verbatim in the
 * X-Gitlab-Token header, so this is a constant-time equality check rather than an HMAC.
 *
 * @param secretToken - Secret token configured on the trigger
 * @param tokenHeader - X-Gitlab-Token header value from the request
 * @returns Whether the token is valid
 */
export function validateGitLabToken(
  secretToken: string,
  tokenHeader: string | null | undefined
): boolean {
  if (!secretToken || !tokenHeader) {
    return false
  }

  return timingSafeEquals(tokenHeader, secretToken)
}

/**
 * Constant-time comparison of two strings. Returns false on length mismatch.
 */
function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * Validates a Typeform webhook request signature.
 *
 * Typeform signs the raw body with HMAC SHA-256 and sends it base64-encoded in the
 * Typeform-Signature header, prefixed with `sha256=`.
 *
 * @param secret - Webhook secret configured on the Typeform webhook
 * @param signature - Typeform-Signature header value (e.g. `sha256=...`)
 * @param body - Raw request body string
 * @returns Whether the signature is valid
 */
export function validateTypeformSignature(
  secret: string,
  signature: string | null | undefined,
  body: string
): boolean {
  try {
    if (!secret || !signature || !body || !signature.startsWith('sha256=')) {
      return false
    }

    const crypto = require('crypto')
    const computed = `sha256=${crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')}`

    return timingSafeEquals(computed, signature)
  } catch (error) {
    logger.error('Error validating Typeform signature:', error)
    return false
  }
}

/**
 * Validates a Sentry webhook request signature.
 *
 * Sentry signs the raw body with HMAC SHA-256, hex-encoded, in Sentry-Hook-Signature.
 *
 * @param clientSecret - Sentry internal integration client secret
 * @param signature - Sentry-Hook-Signature header value
 * @param body - Raw request body string
 */
export function validateSentrySignature(
  clientSecret: string,
  signature: string | null | undefined,
  body: string
): boolean {
  try {
    if (!clientSecret || !signature || !body) {
      return false
    }

    const crypto = require('crypto')
    const computed = crypto.createHmac('sha256', clientSecret).update(body, 'utf8').digest('hex')

    return timingSafeEquals(computed, signature)
  } catch (error) {
    logger.error('Error validating Sentry signature:', error)
    return false
  }
}

/**
 * Validates a Calendly webhook request signature.
 *
 * Calendly sends `Calendly-Webhook-Signature: t=<timestamp>,v1=<signature>` where the signature
 * is HMAC SHA-256 (hex) over `<timestamp>.<raw body>`.
 *
 * @param signingKey - Signing key returned when the subscription was created
 * @param signatureHeader - Calendly-Webhook-Signature header value
 * @param body - Raw request body string
 */
export function validateCalendlySignature(
  signingKey: string,
  signatureHeader: string | null | undefined,
  body: string
): boolean {
  try {
    if (!signingKey || !signatureHeader || !body) {
      return false
    }

    const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
      const [key, value] = part.split('=')
      if (key && value) {
        acc[key.trim()] = value.trim()
      }
      return acc
    }, {})

    if (!parts.t || !parts.v1) {
      return false
    }

    const crypto = require('crypto')
    const computed = crypto
      .createHmac('sha256', signingKey)
      .update(`${parts.t}.${body}`, 'utf8')
      .digest('hex')

    return timingSafeEquals(computed, parts.v1)
  } catch (error) {
    logger.error('Error validating Calendly signature:', error)
    return false
  }
}

/**
 * Validates a PagerDuty v3 webhook request signature.
 *
 * PagerDuty sends `X-PagerDuty-Signature: v1=<sig>[,v1=<sig>...]` — during a secret rotation more
 * than one signature is sent, and the request is valid if ANY of them matches.
 *
 * @param secret - PagerDuty webhook subscription secret
 * @param signatureHeader - X-PagerDuty-Signature header value
 * @param body - Raw request body string
 */
export function validatePagerDutySignature(
  secret: string,
  signatureHeader: string | null | undefined,
  body: string
): boolean {
  try {
    if (!secret || !signatureHeader || !body) {
      return false
    }

    const crypto = require('crypto')
    const computed = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')

    return signatureHeader
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.startsWith('v1='))
      .some((part) => timingSafeEquals(computed, part.slice(3)))
  } catch (error) {
    logger.error('Error validating PagerDuty signature:', error)
    return false
  }
}

/**
 * Validates a Vercel webhook request signature.
 *
 * Vercel signs the raw body with HMAC SHA-1, hex-encoded, in x-vercel-signature.
 *
 * @param secret - Vercel webhook secret
 * @param signature - x-vercel-signature header value
 * @param body - Raw request body string
 */
export function validateVercelSignature(
  secret: string,
  signature: string | null | undefined,
  body: string
): boolean {
  try {
    if (!secret || !signature || !body) {
      return false
    }

    const crypto = require('crypto')
    const computed = crypto.createHmac('sha1', secret).update(body, 'utf8').digest('hex')

    return timingSafeEquals(computed, signature)
  } catch (error) {
    logger.error('Error validating Vercel signature:', error)
    return false
  }
}

/**
 * Validates a Zoom webhook request signature.
 *
 * Zoom signs `v0:<x-zm-request-timestamp>:<raw body>` with HMAC SHA-256 and sends it hex-encoded
 * in x-zm-signature, prefixed with `v0=`.
 *
 * @param secretToken - Zoom app's Secret Token
 * @param signature - x-zm-signature header value
 * @param timestamp - x-zm-request-timestamp header value
 * @param body - Raw request body string
 */
export function validateZoomSignature(
  secretToken: string,
  signature: string | null | undefined,
  timestamp: string | null | undefined,
  body: string
): boolean {
  try {
    if (!secretToken || !signature || !timestamp || !body) {
      return false
    }

    const crypto = require('crypto')
    const computed = `v0=${crypto
      .createHmac('sha256', secretToken)
      .update(`v0:${timestamp}:${body}`, 'utf8')
      .digest('hex')}`

    return timingSafeEquals(computed, signature)
  } catch (error) {
    logger.error('Error validating Zoom signature:', error)
    return false
  }
}

/**
 * Handles Zoom's endpoint URL validation handshake.
 *
 * When a webhook endpoint is added or re-validated, Zoom POSTs an `endpoint.url_validation` event
 * containing a plainToken, and expects the HMAC SHA-256 of that token echoed back. Without this the
 * endpoint cannot be enabled in Zoom at all, so it runs before any signature check.
 *
 * @returns A NextResponse to reply with, or null when this is not a validation request
 */
export function handleZoomUrlValidation(
  body: any,
  secretToken: string | undefined
): NextResponse | null {
  if (body?.event !== 'endpoint.url_validation') {
    return null
  }

  const plainToken = body?.payload?.plainToken

  if (!plainToken || !secretToken) {
    return new NextResponse('Cannot validate endpoint - missing plainToken or Secret Token', {
      status: 400,
    })
  }

  const crypto = require('crypto')
  const encryptedToken = crypto
    .createHmac('sha256', secretToken)
    .update(plainToken, 'utf8')
    .digest('hex')

  return NextResponse.json({ plainToken, encryptedToken })
}

/**
 * Validates a Svix-signed webhook request (used by Clerk and Resend, among others).
 *
 * Svix signs `<svix-id>.<svix-timestamp>.<raw body>` with HMAC SHA-256 and sends the result
 * base64-encoded in svix-signature as a space-separated list of `v1,<sig>` entries — more than one
 * appears while a secret is being rotated, and any match is valid. The signing secret is
 * `whsec_<base64>`, and the bytes after the prefix are base64-decoded before use.
 *
 * @param signingSecret - Svix signing secret (with or without the `whsec_` prefix)
 * @param svixId - svix-id header value
 * @param svixTimestamp - svix-timestamp header value
 * @param svixSignature - svix-signature header value
 * @param body - Raw request body string
 */
export function validateSvixSignature(
  signingSecret: string,
  svixId: string | null | undefined,
  svixTimestamp: string | null | undefined,
  svixSignature: string | null | undefined,
  body: string
): boolean {
  try {
    if (!signingSecret || !svixId || !svixTimestamp || !svixSignature || !body) {
      return false
    }

    const crypto = require('crypto')
    const secretBytes = Buffer.from(signingSecret.replace(/^whsec_/, ''), 'base64')
    const computed = crypto
      .createHmac('sha256', secretBytes)
      .update(`${svixId}.${svixTimestamp}.${body}`, 'utf8')
      .digest('base64')

    return svixSignature
      .split(' ')
      .map((part) => part.trim())
      .filter((part) => part.startsWith('v1,'))
      .some((part) => timingSafeEquals(computed, part.slice(3)))
  } catch (error) {
    logger.error('Error validating Svix signature:', error)
    return false
  }
}

/**
 * Validates a Cal.com webhook request signature.
 *
 * Cal.com signs the raw body with HMAC SHA-256 and sends it hex-encoded in x-cal-signature-256.
 *
 * @param secret - Cal.com webhook secret
 * @param signature - x-cal-signature-256 header value
 * @param body - Raw request body string
 */
export function validateCalcomSignature(
  secret: string,
  signature: string | null | undefined,
  body: string
): boolean {
  try {
    if (!secret || !signature || !body) {
      return false
    }

    const crypto = require('crypto')
    const computed = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')

    return timingSafeEquals(computed, signature)
  } catch (error) {
    logger.error('Error validating Cal.com signature:', error)
    return false
  }
}

/**
 * Reconstructs the externally-visible URL of a request.
 *
 * Behind a proxy (Vercel, a load balancer) request.url carries the internal origin, so signature
 * schemes that sign the URL — Twilio's does — must use the forwarded host/proto the provider
 * actually called instead.
 */
export function getExternalRequestUrl(request: NextRequest): string {
  const url = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto')

  if (forwardedHost) {
    // Assign hostname and port separately: the URL `host` setter leaves the existing port in place
    // when the value has none, which would leave the internal port on the reconstructed URL and
    // break any signature computed over it.
    const [hostname, port] = forwardedHost.split(':')
    url.hostname = hostname
    url.port = port || ''
  }
  if (forwardedProto) {
    url.protocol = `${forwardedProto.split(',')[0].trim()}:`
  }

  return url.toString()
}

/**
 * Validates a Twilio webhook request signature.
 *
 * Twilio does not sign the body. It builds a string from the full request URL followed by every
 * POST parameter — sorted by key, appended as key+value with no separators — then signs it with
 * HMAC SHA-1 (not SHA-256) and base64-encodes it into X-Twilio-Signature.
 *
 * Because the URL is part of the signed string, it must be the URL Twilio actually called; see
 * getExternalRequestUrl.
 *
 * @param authToken - Twilio account auth token
 * @param signature - X-Twilio-Signature header value
 * @param url - The full URL Twilio requested
 * @param params - The POST parameters as sent
 */
export function validateTwilioSignature(
  authToken: string,
  signature: string | null | undefined,
  url: string,
  params: Record<string, string>
): boolean {
  try {
    if (!authToken || !signature || !url) {
      return false
    }

    const signedString = Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + params[key], url)

    const crypto = require('crypto')
    const computed = crypto
      .createHmac('sha1', authToken)
      .update(Buffer.from(signedString, 'utf8'))
      .digest('base64')

    return timingSafeEquals(computed, signature)
  } catch (error) {
    logger.error('Error validating Twilio signature:', error)
    return false
  }
}

/**
 * Validates a Greenhouse webhook request signature.
 *
 * Greenhouse signs the raw body with HMAC SHA-256 and sends `Signature: sha256 <hex>`.
 */
export function validateGreenhouseSignature(
  secretKey: string,
  signature: string | null | undefined,
  body: string
): boolean {
  try {
    if (!secretKey || !signature || !body) {
      return false
    }

    const crypto = require('crypto')
    const computed = `sha256 ${crypto.createHmac('sha256', secretKey).update(body, 'utf8').digest('hex')}`

    return timingSafeEquals(computed, signature)
  } catch (error) {
    logger.error('Error validating Greenhouse signature:', error)
    return false
  }
}

/**
 * Validates an Ashby webhook request signature.
 *
 * Ashby signs the raw body with HMAC SHA-256 and sends it hex-encoded in Ashby-Signature.
 */
export function validateAshbySignature(
  secretToken: string,
  signature: string | null | undefined,
  body: string
): boolean {
  try {
    if (!secretToken || !signature || !body) {
      return false
    }

    const crypto = require('crypto')
    const computed = crypto.createHmac('sha256', secretToken).update(body, 'utf8').digest('hex')
    // Ashby has historically prefixed the value; accept either form
    const provided = signature.startsWith('sha256=') ? signature.slice(7) : signature

    return timingSafeEquals(computed, provided)
  } catch (error) {
    logger.error('Error validating Ashby signature:', error)
    return false
  }
}

/**
 * Validates a Rootly webhook request signature.
 *
 * Rootly signs the raw body with HMAC SHA-256 and sends it hex-encoded in X-Rootly-Signature.
 */
export function validateRootlySignature(
  signingSecret: string,
  signature: string | null | undefined,
  body: string
): boolean {
  try {
    if (!signingSecret || !signature || !body) {
      return false
    }

    const crypto = require('crypto')
    const computed = crypto.createHmac('sha256', signingSecret).update(body, 'utf8').digest('hex')

    return timingSafeEquals(computed, signature)
  } catch (error) {
    logger.error('Error validating Rootly signature:', error)
    return false
  }
}

/**
 * Validates a shared-secret header.
 *
 * Several providers (Gong, RevenueCat, Circleback, EmailBison) do not sign the body at all — they
 * simply echo back a value you configure on their side, usually in the Authorization header. This
 * is a constant-time equality check, tolerating an optional `Bearer ` prefix.
 */
export function validateSharedSecretHeader(
  expected: string,
  provided: string | null | undefined
): boolean {
  if (!expected || !provided) {
    return false
  }

  const value = provided.startsWith('Bearer ') ? provided.slice(7) : provided

  return timingSafeEquals(value, expected)
}

/**
 * Validates a GitHub webhook request signature.
 *
 * GitHub signs the raw body with HMAC SHA-256 and sends `X-Hub-Signature-256: sha256=<hex>`.
 * The older X-Hub-Signature (SHA-1) header is deliberately not accepted: GitHub still sends it for
 * compatibility, and honouring it would let a caller downgrade to the weaker algorithm.
 */
export function validateGitHubSignature(
  secret: string,
  signature: string | null | undefined,
  body: string
): boolean {
  try {
    if (!secret || !signature || !body || !signature.startsWith('sha256=')) {
      return false
    }

    const crypto = require('crypto')
    const computed = `sha256=${crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`

    return timingSafeEquals(computed, signature)
  } catch (error) {
    logger.error('Error validating GitHub signature:', error)
    return false
  }
}

/**
 * Validates a Linear webhook request signature: HMAC SHA-256 hex over the raw body.
 */
export function validateLinearSignature(
  secret: string,
  signature: string | null | undefined,
  body: string
): boolean {
  try {
    if (!secret || !signature || !body) {
      return false
    }

    const crypto = require('crypto')
    const computed = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')

    return timingSafeEquals(computed, signature)
  } catch (error) {
    logger.error('Error validating Linear signature:', error)
    return false
  }
}

/**
 * Validates an Asana webhook request signature: HMAC SHA-256 hex over the raw body,
 * sent in X-Hook-Signature.
 */
export function validateAsanaSignature(
  secret: string,
  signature: string | null | undefined,
  body: string
): boolean {
  try {
    if (!secret || !signature || !body) {
      return false
    }

    const crypto = require('crypto')
    const computed = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')

    return timingSafeEquals(computed, signature)
  } catch (error) {
    logger.error('Error validating Asana signature:', error)
    return false
  }
}

/**
 * Process webhook provider-specific verification
 */
export function verifyProviderWebhook(
  foundWebhook: any,
  request: NextRequest,
  requestId: string
): NextResponse | null {
  const authHeader = request.headers.get('authorization')
  const providerConfig = (foundWebhook.providerConfig as Record<string, any>) || {}
  // Keep existing switch statement for github, stripe, generic, default
  switch (foundWebhook.provider) {
    case 'github':
      break // No specific auth here
    case 'stripe':
      break // Stripe verification would go here
    case 'gmail':
      if (providerConfig.secret) {
        const secretHeader = request.headers.get('X-Webhook-Secret')
        if (!secretHeader || secretHeader.length !== providerConfig.secret.length) {
          logger.warn(`[${requestId}] Invalid Gmail webhook secret`)
          return new NextResponse('Unauthorized', { status: 401 })
        }
        let result = 0
        for (let i = 0; i < secretHeader.length; i++) {
          result |= secretHeader.charCodeAt(i) ^ providerConfig.secret.charCodeAt(i)
        }
        if (result !== 0) {
          logger.warn(`[${requestId}] Invalid Gmail webhook secret`)
          return new NextResponse('Unauthorized', { status: 401 })
        }
      }
      break
    case 'telegram': {
      // Check User-Agent to ensure it's not blocked by middleware
      // Log the user agent for debugging purposes
      const userAgent = request.headers.get('user-agent') || ''
      logger.debug(`[${requestId}] Telegram webhook request received with User-Agent: ${userAgent}`)

      // Check if the user agent is empty and warn about it
      if (!userAgent) {
        logger.warn(
          `[${requestId}] Telegram webhook request has empty User-Agent header. This may be blocked by middleware.`
        )
      }

      // We'll accept the request anyway since we're in the provider-specific logic,
      // but we'll log the information for debugging

      // Telegram uses IP addresses in specific ranges
      // This is optional verification that could be added if IP verification is needed
      const clientIp =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'

      logger.debug(`[${requestId}] Telegram webhook request from IP: ${clientIp}`)

      break
    }
    case 'microsoftteams':
      // Microsoft Teams webhook authentication is handled separately in the main flow
      // due to the need for raw body access for HMAC verification
      break
    case 'generic':
      // Generic auth logic: requireAuth, token, secretHeaderName, allowedIps
      if (providerConfig.requireAuth) {
        let isAuthenticated = false
        // Check for token in Authorization header (Bearer token)
        if (providerConfig.token) {
          const providedToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
          if (providedToken === providerConfig.token) {
            isAuthenticated = true
          }
          // Check for token in custom header if specified
          if (!isAuthenticated && providerConfig.secretHeaderName) {
            const customHeaderValue = request.headers.get(providerConfig.secretHeaderName)
            if (customHeaderValue === providerConfig.token) {
              isAuthenticated = true
            }
          }
          // Return 401 if authentication failed
          if (!isAuthenticated) {
            logger.warn(`[${requestId}] Unauthorized webhook access attempt - invalid token`)
            return new NextResponse('Unauthorized', { status: 401 })
          }
        }
      }
      // IP restriction check
      if (
        providerConfig.allowedIps &&
        Array.isArray(providerConfig.allowedIps) &&
        providerConfig.allowedIps.length > 0
      ) {
        const clientIp =
          request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
          request.headers.get('x-real-ip') ||
          'unknown'

        if (clientIp === 'unknown' || !providerConfig.allowedIps.includes(clientIp)) {
          logger.warn(
            `[${requestId}] Forbidden webhook access attempt - IP not allowed: ${clientIp}`
          )
          return new NextResponse('Forbidden - IP not allowed', {
            status: 403,
          })
        }
      }
      break
    default:
      if (providerConfig.token) {
        const providedToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
        if (!providedToken || providedToken !== providerConfig.token) {
          logger.warn(`[${requestId}] Unauthorized webhook access attempt - invalid token`)
          return new NextResponse('Unauthorized', { status: 401 })
        }
      }
  }

  return null
}

/**
 * Process Airtable payloads
 */
export async function fetchAndProcessAirtablePayloads(
  webhookData: any,
  workflowData: any,
  requestId: string // Original request ID from the ping, used for the final execution log
) {
  // Logging handles all error logging
  let currentCursor: number | null = null
  let mightHaveMore = true
  let payloadsFetched = 0 // Track total payloads fetched
  let apiCallCount = 0
  // Use a Map to consolidate changes per record ID
  const consolidatedChangesMap = new Map<string, AirtableChange>()
  const localProviderConfig = {
    ...((webhookData.providerConfig as Record<string, any>) || {}),
  } // Local copy

  // DEBUG: Log start of function execution with critical info
  logger.debug(`[${requestId}] TRACE: fetchAndProcessAirtablePayloads started`, {
    webhookId: webhookData.id,
    workflowId: workflowData.id,
    hasBaseId: !!localProviderConfig.baseId,
    hasExternalId: !!localProviderConfig.externalId,
  })

  try {
    // --- Essential IDs & Config from localProviderConfig ---
    const baseId = localProviderConfig.baseId
    const airtableWebhookId = localProviderConfig.externalId

    if (!baseId || !airtableWebhookId) {
      logger.error(
        `[${requestId}] Missing baseId or externalId in providerConfig for webhook ${webhookData.id}. Cannot fetch payloads.`
      )
      // Error logging handled by logging session
      return // Exit early
    }

    // --- Retrieve Stored Cursor from localProviderConfig ---
    const storedCursor = localProviderConfig.externalWebhookCursor

    // Initialize cursor in provider config if missing
    if (storedCursor === undefined || storedCursor === null) {
      logger.info(
        `[${requestId}] No cursor found in providerConfig for webhook ${webhookData.id}, initializing...`
      )
      // Update the local copy
      localProviderConfig.externalWebhookCursor = null

      // Add cursor to the database immediately to fix the configuration
      try {
        await db
          .update(webhook)
          .set({
            providerConfig: {
              ...localProviderConfig,
              externalWebhookCursor: null,
            },
            updatedAt: new Date(),
          })
          .where(eq(webhook.id, webhookData.id))

        localProviderConfig.externalWebhookCursor = null // Update local copy too
        logger.info(`[${requestId}] Successfully initialized cursor for webhook ${webhookData.id}`)
      } catch (initError: any) {
        logger.error(`[${requestId}] Failed to initialize cursor in DB`, {
          webhookId: webhookData.id,
          error: initError.message,
          stack: initError.stack,
        })
        // Error logging handled by logging session
      }
    }

    if (storedCursor && typeof storedCursor === 'number') {
      currentCursor = storedCursor
      logger.debug(
        `[${requestId}] Using stored cursor: ${currentCursor} for webhook ${webhookData.id}`
      )
    } else {
      currentCursor = null // Airtable API defaults to 1 if omitted
      logger.debug(
        `[${requestId}] No valid stored cursor for webhook ${webhookData.id}, starting from beginning`
      )
    }

    // --- Get OAuth Token ---
    let accessToken: string | null = null
    try {
      accessToken = await getOAuthToken(workflowData.userId, 'airtable')
      if (!accessToken) {
        logger.error(
          `[${requestId}] Failed to obtain valid Airtable access token. Cannot proceed.`,
          { userId: workflowData.userId }
        )
        throw new Error('Airtable access token not found.')
      }

      logger.info(`[${requestId}] Successfully obtained Airtable access token`)
    } catch (tokenError: any) {
      logger.error(
        `[${requestId}] Failed to get Airtable OAuth token for user ${workflowData.userId}`,
        {
          error: tokenError.message,
          stack: tokenError.stack,
          userId: workflowData.userId,
        }
      )
      // Error logging handled by logging session
      return // Exit early
    }

    const airtableApiBase = 'https://api.airtable.com/v0'

    // --- Polling Loop ---
    while (mightHaveMore) {
      apiCallCount++
      // Safety break
      if (apiCallCount > 10) {
        logger.warn(`[${requestId}] Reached maximum polling limit (10 calls)`, {
          webhookId: webhookData.id,
          consolidatedCount: consolidatedChangesMap.size,
        })
        mightHaveMore = false
        break
      }

      const apiUrl = `${airtableApiBase}/bases/${baseId}/webhooks/${airtableWebhookId}/payloads`
      const queryParams = new URLSearchParams()
      if (currentCursor !== null) {
        queryParams.set('cursor', currentCursor.toString())
      }
      const fullUrl = `${apiUrl}?${queryParams.toString()}`

      logger.debug(`[${requestId}] Fetching Airtable payloads (call ${apiCallCount})`, {
        url: fullUrl,
        webhookId: webhookData.id,
      })

      try {
        const fetchStartTime = Date.now()
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })

        // DEBUG: Log API response time
        logger.debug(`[${requestId}] TRACE: Airtable API response received`, {
          status: response.status,
          duration: `${Date.now() - fetchStartTime}ms`,
          hasBody: true,
          apiCall: apiCallCount,
        })

        const responseBody = await response.json()

        if (!response.ok || responseBody.error) {
          const errorMessage =
            responseBody.error?.message ||
            responseBody.error ||
            `Airtable API error Status ${response.status}`
          logger.error(
            `[${requestId}] Airtable API request to /payloads failed (Call ${apiCallCount})`,
            {
              webhookId: webhookData.id,
              status: response.status,
              error: errorMessage,
            }
          )
          // Error logging handled by logging session
          mightHaveMore = false
          break
        }

        const receivedPayloads = responseBody.payloads || []
        logger.debug(
          `[${requestId}] Received ${receivedPayloads.length} payloads from Airtable (call ${apiCallCount})`
        )

        // --- Process and Consolidate Changes ---
        if (receivedPayloads.length > 0) {
          payloadsFetched += receivedPayloads.length
          let changeCount = 0
          for (const payload of receivedPayloads) {
            if (payload.changedTablesById) {
              // DEBUG: Log tables being processed
              const tableIds = Object.keys(payload.changedTablesById)
              logger.debug(`[${requestId}] TRACE: Processing changes for tables`, {
                tables: tableIds,
                payloadTimestamp: payload.timestamp,
              })

              for (const [tableId, tableChangesUntyped] of Object.entries(
                payload.changedTablesById
              )) {
                const tableChanges = tableChangesUntyped as any // Assert type

                // Handle created records
                if (tableChanges.createdRecordsById) {
                  const createdCount = Object.keys(tableChanges.createdRecordsById).length
                  changeCount += createdCount
                  // DEBUG: Log created records count
                  logger.debug(
                    `[${requestId}] TRACE: Processing ${createdCount} created records for table ${tableId}`
                  )

                  for (const [recordId, recordDataUntyped] of Object.entries(
                    tableChanges.createdRecordsById
                  )) {
                    const recordData = recordDataUntyped as any // Assert type
                    const existingChange = consolidatedChangesMap.get(recordId)
                    if (existingChange) {
                      // Record was created and possibly updated within the same batch
                      existingChange.changedFields = {
                        ...existingChange.changedFields,
                        ...(recordData.cellValuesByFieldId || {}),
                      }
                      // Keep changeType as 'created' if it started as created
                    } else {
                      // New creation
                      consolidatedChangesMap.set(recordId, {
                        tableId: tableId,
                        recordId: recordId,
                        changeType: 'created',
                        changedFields: recordData.cellValuesByFieldId || {},
                      })
                    }
                  }
                }

                // Handle updated records
                if (tableChanges.changedRecordsById) {
                  const updatedCount = Object.keys(tableChanges.changedRecordsById).length
                  changeCount += updatedCount
                  // DEBUG: Log updated records count
                  logger.debug(
                    `[${requestId}] TRACE: Processing ${updatedCount} updated records for table ${tableId}`
                  )

                  for (const [recordId, recordDataUntyped] of Object.entries(
                    tableChanges.changedRecordsById
                  )) {
                    const recordData = recordDataUntyped as any // Assert type
                    const existingChange = consolidatedChangesMap.get(recordId)
                    const currentFields = recordData.current?.cellValuesByFieldId || {}

                    if (existingChange) {
                      // Existing record was updated again
                      existingChange.changedFields = {
                        ...existingChange.changedFields,
                        ...currentFields,
                      }
                      // Ensure type is 'updated' if it was previously 'created'
                      existingChange.changeType = 'updated'
                      // Do not update previousFields again
                    } else {
                      // First update for this record in the batch
                      const newChange: AirtableChange = {
                        tableId: tableId,
                        recordId: recordId,
                        changeType: 'updated',
                        changedFields: currentFields,
                      }
                      if (recordData.previous?.cellValuesByFieldId) {
                        newChange.previousFields = recordData.previous.cellValuesByFieldId
                      }
                      consolidatedChangesMap.set(recordId, newChange)
                    }
                  }
                }
                // TODO: Handle deleted records (`destroyedRecordIds`) if needed
              }
            }
          }

          // DEBUG: Log totals for this batch
          logger.debug(
            `[${requestId}] TRACE: Processed ${changeCount} changes in API call ${apiCallCount}`,
            {
              currentMapSize: consolidatedChangesMap.size,
            }
          )
        }

        const nextCursor = responseBody.cursor
        mightHaveMore = responseBody.mightHaveMore || false

        if (nextCursor && typeof nextCursor === 'number' && nextCursor !== currentCursor) {
          logger.debug(`[${requestId}] Updating cursor from ${currentCursor} to ${nextCursor}`)
          currentCursor = nextCursor

          // Follow exactly the old implementation - use awaited update instead of parallel
          const updatedConfig = {
            ...localProviderConfig,
            externalWebhookCursor: currentCursor,
          }
          try {
            // Force a complete object update to ensure consistency in serverless env
            await db
              .update(webhook)
              .set({
                providerConfig: updatedConfig, // Use full object
                updatedAt: new Date(),
              })
              .where(eq(webhook.id, webhookData.id))

            localProviderConfig.externalWebhookCursor = currentCursor // Update local copy too
          } catch (dbError: any) {
            logger.error(`[${requestId}] Failed to persist Airtable cursor to DB`, {
              webhookId: webhookData.id,
              cursor: currentCursor,
              error: dbError.message,
            })
            // Error logging handled by logging session
            mightHaveMore = false
            throw new Error('Failed to save Airtable cursor, stopping processing.') // Re-throw to break loop clearly
          }
        } else if (!nextCursor || typeof nextCursor !== 'number') {
          logger.warn(`[${requestId}] Invalid or missing cursor received, stopping poll`, {
            webhookId: webhookData.id,
            apiCall: apiCallCount,
            receivedCursor: nextCursor,
          })
          mightHaveMore = false
        } else if (nextCursor === currentCursor) {
          logger.debug(`[${requestId}] Cursor hasn't changed (${currentCursor}), stopping poll`)
          mightHaveMore = false // Explicitly stop if cursor hasn't changed
        }
      } catch (fetchError: any) {
        logger.error(
          `[${requestId}] Network error calling Airtable GET /payloads (Call ${apiCallCount}) for webhook ${webhookData.id}`,
          fetchError
        )
        // Error logging handled by logging session
        mightHaveMore = false
        break
      }
    }
    // --- End Polling Loop ---

    // Convert map values to array for final processing
    const finalConsolidatedChanges = Array.from(consolidatedChangesMap.values())
    logger.info(
      `[${requestId}] Consolidated ${finalConsolidatedChanges.length} Airtable changes across ${apiCallCount} API calls`
    )

    // --- Execute Workflow if we have changes (simplified - no lock check) ---
    if (finalConsolidatedChanges.length > 0) {
      try {
        // Format the input for the executor using the consolidated changes
        const input = { airtableChanges: finalConsolidatedChanges } // Use the consolidated array

        // CRITICAL EXECUTION TRACE POINT
        logger.info(
          `[${requestId}] CRITICAL_TRACE: Beginning workflow execution with ${finalConsolidatedChanges.length} Airtable changes`,
          {
            workflowId: workflowData.id,
            recordCount: finalConsolidatedChanges.length,
            timestamp: new Date().toISOString(),
            firstRecordId: finalConsolidatedChanges[0]?.recordId || 'none',
          }
        )

        // Return the processed input for the BullMQ job to handle
        logger.info(`[${requestId}] CRITICAL_TRACE: Airtable changes processed, returning input`, {
          workflowId: workflowData.id,
          recordCount: finalConsolidatedChanges.length,
          timestamp: new Date().toISOString(),
        })

        return input
      } catch (processingError: any) {
        logger.error(`[${requestId}] CRITICAL_TRACE: Error processing Airtable changes`, {
          workflowId: workflowData.id,
          error: processingError.message,
          stack: processingError.stack,
          timestamp: new Date().toISOString(),
        })

        throw processingError
      }
    } else {
      // DEBUG: Log when no changes are found
      logger.info(`[${requestId}] TRACE: No Airtable changes to process`, {
        workflowId: workflowData.id,
        apiCallCount,
        webhookId: webhookData.id,
      })
    }
  } catch (error) {
    // Catch any unexpected errors during the setup/polling logic itself
    logger.error(
      `[${requestId}] Unexpected error during asynchronous Airtable payload processing task`,
      {
        webhookId: webhookData.id,
        workflowId: workflowData.id,
        error: (error as Error).message,
      }
    )
    // Error logging handled by logging session
  }

  // DEBUG: Log function completion
  logger.debug(`[${requestId}] TRACE: fetchAndProcessAirtablePayloads completed`, {
    totalFetched: payloadsFetched,
    totalApiCalls: apiCallCount,
    totalChanges: consolidatedChangesMap.size,
    timestamp: new Date().toISOString(),
  })
}

// Define an interface for AirtableChange
export interface AirtableChange {
  tableId: string
  recordId: string
  changeType: 'created' | 'updated'
  changedFields: Record<string, any> // { fieldId: newValue }
  previousFields?: Record<string, any> // { fieldId: previousValue } (optional)
}

/**
 * Configure Gmail polling for a webhook
 */
export async function configureGmailPolling(
  userId: string,
  webhookData: any,
  requestId: string
): Promise<boolean> {
  const logger = createLogger('GmailWebhookSetup')
  logger.info(`[${requestId}] Setting up Gmail polling for webhook ${webhookData.id}`)

  try {
    const accessToken = await getOAuthToken(userId, 'google-email')
    if (!accessToken) {
      logger.error(`[${requestId}] Failed to retrieve Gmail access token for user ${userId}`)
      return false
    }

    const providerConfig = (webhookData.providerConfig as Record<string, any>) || {}

    const maxEmailsPerPoll =
      typeof providerConfig.maxEmailsPerPoll === 'string'
        ? Number.parseInt(providerConfig.maxEmailsPerPoll, 10) || 25
        : providerConfig.maxEmailsPerPoll || 25

    const pollingInterval =
      typeof providerConfig.pollingInterval === 'string'
        ? Number.parseInt(providerConfig.pollingInterval, 10) || 5
        : providerConfig.pollingInterval || 5

    const now = new Date()

    await db
      .update(webhook)
      .set({
        providerConfig: {
          ...providerConfig,
          userId, // Store user ID for OAuth access during polling
          maxEmailsPerPoll,
          pollingInterval,
          markAsRead: providerConfig.markAsRead || false,
          includeRawEmail: providerConfig.includeRawEmail || false,
          labelIds: providerConfig.labelIds || ['INBOX'],
          labelFilterBehavior: providerConfig.labelFilterBehavior || 'INCLUDE',
          lastCheckedTimestamp: now.toISOString(),
          setupCompleted: true,
        },
        updatedAt: now,
      })
      .where(eq(webhook.id, webhookData.id))

    logger.info(
      `[${requestId}] Successfully configured Gmail polling for webhook ${webhookData.id}`
    )
    return true
  } catch (error: any) {
    logger.error(`[${requestId}] Failed to configure Gmail polling`, {
      webhookId: webhookData.id,
      error: error.message,
      stack: error.stack,
    })
    return false
  }
}

/**
 * Configure Outlook polling for a webhook
 */
export async function configureOutlookPolling(
  userId: string,
  webhookData: any,
  requestId: string
): Promise<boolean> {
  const logger = createLogger('OutlookWebhookSetup')
  logger.info(`[${requestId}] Setting up Outlook polling for webhook ${webhookData.id}`)
  logger.info(`[${requestId}] Setting up Outlook polling for webhook ${webhookData.id}`)

  try {
    const accessToken = await getOAuthToken(userId, 'outlook')
    if (!accessToken) {
      logger.error(`[${requestId}] Failed to retrieve Outlook access token for user ${userId}`)
      return false
    }

    const providerConfig = (webhookData.providerConfig as Record<string, any>) || {}

    const maxEmailsPerPoll =
      typeof providerConfig.maxEmailsPerPoll === 'string'
        ? Number.parseInt(providerConfig.maxEmailsPerPoll, 10) || 25
        : providerConfig.maxEmailsPerPoll || 25

    const pollingInterval =
      typeof providerConfig.pollingInterval === 'string'
        ? Number.parseInt(providerConfig.pollingInterval, 10) || 5
        : providerConfig.pollingInterval || 5

    const now = new Date()

    await db
      .update(webhook)
      .set({
        providerConfig: {
          ...providerConfig,
          userId, // Store user ID for OAuth access during polling
          maxEmailsPerPoll,
          pollingInterval,
          markAsRead: providerConfig.markAsRead || false,
          includeRawEmail: providerConfig.includeRawEmail || false,
          folderIds: providerConfig.folderIds || ['inbox'],
          folderFilterBehavior: providerConfig.folderFilterBehavior || 'INCLUDE',
          lastCheckedTimestamp: now.toISOString(),
          setupCompleted: true,
        },
        updatedAt: now,
      })
      .where(eq(webhook.id, webhookData.id))

    logger.info(
      `[${requestId}] Successfully configured Outlook polling for webhook ${webhookData.id}`
    )
    return true
  } catch (error: any) {
    logger.error(`[${requestId}] Failed to configure Outlook polling`, {
      webhookId: webhookData.id,
      error: error.message,
      stack: error.stack,
    })
    return false
  }
}
