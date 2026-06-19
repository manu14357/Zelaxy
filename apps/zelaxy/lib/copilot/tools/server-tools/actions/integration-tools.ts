/**
 * OAuth-backed direct-action tools for ZelaxyArena.
 *
 * These resolve the workspace user's connected OAuth credential (Slack / Google),
 * refresh the token if needed, and call the provider API directly — so the agent
 * can "send a Slack message" or "email someone" using connected accounts.
 *
 * Registered in the shared copilot registry but exposed only to the arena agent.
 */

import { and, eq, like } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { refreshTokenIfNeeded } from '@/app/api/auth/oauth/utils'
import { db } from '@/db'
import { account } from '@/db/schema'
import type { ProviderToolConfig } from '@/providers/types'
import { BaseCopilotTool } from '../base'

const logger = createLogger('ArenaIntegrationTools')
const reqId = () => crypto.randomUUID().slice(0, 8)

/**
 * Find the user's connected credential for a provider (by providerId prefix, e.g. "slack",
 * "google") and return a valid access token, refreshing if expired.
 */
async function getProviderToken(
  userId: string,
  providerPrefix: string
): Promise<{ token: string; providerId: string } | null> {
  const rows = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), like(account.providerId, `${providerPrefix}%`)))
    .orderBy(account.createdAt)
    .limit(1)

  if (!rows.length) return null
  const cred = rows[0]
  try {
    const { accessToken } = await refreshTokenIfNeeded(reqId(), cred, cred.id)
    if (!accessToken) return null
    return { token: accessToken, providerId: cred.providerId }
  } catch (e) {
    logger.error('Failed to resolve provider token', { providerPrefix, e })
    return null
  }
}

// ── send_slack_message ───────────────────────────────────────────────────────
interface SlackParams {
  userId: string
  channel: string
  text: string
}
class SendSlackMessageTool extends BaseCopilotTool<SlackParams, any> {
  readonly id = 'send_slack_message'
  readonly displayName = 'Sending Slack message'
  protected async executeImpl(params: SlackParams) {
    const cred = await getProviderToken(params.userId, 'slack')
    if (!cred) {
      throw new Error('No Slack account is connected to this workspace. Connect Slack first.')
    }
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cred.token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ channel: params.channel, text: params.text }),
    })
    const data = (await res.json()) as { ok?: boolean; error?: string; ts?: string }
    if (!data.ok) throw new Error(`Slack API error: ${data.error || 'unknown'}`)
    return { ok: true, channel: params.channel, ts: data.ts }
  }
}

// ── send_email (Gmail) ───────────────────────────────────────────────────────
interface EmailParams {
  userId: string
  to: string
  subject: string
  body: string
}
class SendEmailTool extends BaseCopilotTool<EmailParams, any> {
  readonly id = 'send_email'
  readonly displayName = 'Sending email'
  protected async executeImpl(params: EmailParams) {
    const cred = await getProviderToken(params.userId, 'google')
    if (!cred) {
      throw new Error(
        'No Google account is connected to this workspace. Connect Google/Gmail first.'
      )
    }
    const mime =
      `To: ${params.to}\r\n` +
      `Subject: ${params.subject}\r\n` +
      'MIME-Version: 1.0\r\n' +
      'Content-Type: text/plain; charset=utf-8\r\n\r\n' +
      params.body
    const raw = Buffer.from(mime).toString('base64url')

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cred.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText)
      throw new Error(`Gmail API error (${res.status}): ${errText.slice(0, 300)}`)
    }
    const data = (await res.json()) as { id?: string }
    return { ok: true, to: params.to, messageId: data.id }
  }
}

export const sendSlackMessageTool = new SendSlackMessageTool()
export const sendEmailTool = new SendEmailTool()

/** LLM tool definitions for the OAuth-backed actions (arena-only). */
export const INTEGRATION_TOOL_DEFS: ProviderToolConfig[] = [
  {
    id: 'send_slack_message',
    name: 'send_slack_message',
    description:
      'Send a message to a Slack channel using the connected Slack account. Requires Slack to be connected.',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name (#general) or channel ID' },
        text: { type: 'string', description: 'Message text' },
      },
      required: ['channel', 'text'],
    },
  },
  {
    id: 'send_email',
    name: 'send_email',
    description:
      'Send an email via the connected Google/Gmail account. Requires Google to be connected with Gmail send permission.',
    params: {},
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body (plain text)' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
]
