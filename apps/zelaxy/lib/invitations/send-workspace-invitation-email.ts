import { render } from '@react-email/render'
import { Resend } from 'resend'
import { WorkspaceInvitationEmail } from '@/components/emails/workspace-invitation'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { getEmailDomain } from '@/lib/urls/utils'

const logger = createLogger('WorkspaceInvitationEmail')
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export interface SendWorkspaceInvitationEmailParams {
  to: string
  inviterName: string
  workspaceName: string
  token: string
}

export interface SendWorkspaceInvitationEmailResult {
  success: boolean
  message?: string
}

/**
 * Sends (or re-sends) the workspace-invitation email via Resend.
 *
 * Shared by both `POST /api/arenas/invitations` (create) and
 * `POST /api/arenas/invitations/[id]` (resend) so the two code paths can't drift.
 */
export async function sendWorkspaceInvitationEmail({
  to,
  inviterName,
  workspaceName,
  token,
}: SendWorkspaceInvitationEmailParams): Promise<SendWorkspaceInvitationEmailResult> {
  try {
    const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/'
    // Always use the client-side invite route with token parameter
    const invitationLink = `${baseUrl}/invite/${token}?token=${token}`

    const emailHtml = await render(
      WorkspaceInvitationEmail({
        workspaceName,
        inviterName,
        invitationLink,
      })
    )

    if (!resend) {
      logger.error('RESEND_API_KEY not configured')
      return {
        success: false,
        message:
          'Email service not configured. Please set RESEND_API_KEY in environment variables.',
      }
    }

    const emailDomain = env.EMAIL_DOMAIN || getEmailDomain()
    const fromAddress = `noreply@${emailDomain}`

    logger.info(`Attempting to send email from ${fromAddress} to ${to}`)

    const result = await resend.emails.send({
      from: fromAddress,
      to,
      subject: `You've been invited to join "${workspaceName}" on Zelaxy`,
      html: emailHtml,
    })

    logger.info(`Invitation email sent successfully to ${to}`, { result })
    return { success: true }
  } catch (error) {
    logger.error('Error sending invitation email:', error)
    // Continue even if email fails - the invitation is still created
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
  }
}
