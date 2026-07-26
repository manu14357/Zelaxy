import { render } from '@react-email/components'
import {
  BatchInvitationEmail,
  BillingReceiptEmail,
  InvitationEmail,
  OTPVerificationEmail,
  PaymentFailedEmail,
  PlanWelcomeEmail,
  type ReceiptLineItem,
  ResetPasswordEmail,
  UsageAlertEmail,
  WorkspaceAddedEmail,
} from '@/components/emails'

export async function renderOTPEmail(
  otp: string,
  email: string,
  type: 'sign-in' | 'email-verification' | 'forget-password' = 'email-verification',
  chatTitle?: string
): Promise<string> {
  return await render(OTPVerificationEmail({ otp, email, type, chatTitle }))
}

export async function renderPasswordResetEmail(
  username: string,
  resetLink: string
): Promise<string> {
  return await render(
    ResetPasswordEmail({ username, resetLink: resetLink, updatedDate: new Date() })
  )
}

export async function renderInvitationEmail(
  inviterName: string,
  organizationName: string,
  invitationUrl: string,
  email: string
): Promise<string> {
  return await render(
    InvitationEmail({
      inviterName,
      organizationName,
      inviteLink: invitationUrl,
      invitedEmail: email,
      updatedDate: new Date(),
    })
  )
}

interface WorkspaceInvitation {
  workspaceId: string
  workspaceName: string
  permission: 'admin' | 'write' | 'read'
}

export async function renderBatchInvitationEmail(
  inviterName: string,
  organizationName: string,
  organizationRole: 'admin' | 'member',
  workspaceInvitations: WorkspaceInvitation[],
  acceptUrl: string
): Promise<string> {
  return await render(
    BatchInvitationEmail({
      inviterName,
      organizationName,
      organizationRole,
      workspaceInvitations,
      acceptUrl,
    })
  )
}

interface GrantedWorkspace {
  workspaceName: string
  permission?: 'admin' | 'write' | 'read'
}

/**
 * Renders the "direct-grant" notification email — sent instead of an invitation when the
 * invitee already belongs to the target organization, so access is granted immediately with
 * no accept step. See lib/invitations/direct-grant.ts.
 */
export async function renderWorkspaceAddedEmail(
  inviterName: string,
  workspaces: GrantedWorkspace[],
  appUrl?: string
): Promise<string> {
  return await render(WorkspaceAddedEmail({ inviterName, workspaces, appUrl }))
}

export async function renderBillingReceiptEmail(props: {
  name: string
  heading?: string
  intro?: string
  lineItems: ReceiptLineItem[]
  totalLabel?: string
  totalValue?: string
  ctaLabel?: string
  ctaUrl?: string
  footnote?: string
}): Promise<string> {
  return await render(BillingReceiptEmail(props))
}

export async function renderPlanWelcomeEmail(props: {
  name: string
  planLabel: string
  appUrl?: string
  docsUrl?: string
}): Promise<string> {
  return await render(PlanWelcomeEmail(props))
}

export async function renderPaymentFailedEmail(props: {
  name: string
  amount?: string
  reason?: string
  actionUrl?: string
}): Promise<string> {
  return await render(PaymentFailedEmail(props))
}

export async function renderUsageAlertEmail(props: {
  name: string
  planLabel: string
  percent: number
  usedLabel?: string
  limitLabel?: string
  appUrl?: string
}): Promise<string> {
  return await render(UsageAlertEmail(props))
}

export function getEmailSubject(
  type:
    | 'sign-in'
    | 'email-verification'
    | 'forget-password'
    | 'reset-password'
    | 'invitation'
    | 'batch-invitation'
    | 'workspace-added'
): string {
  switch (type) {
    case 'sign-in':
      return 'Sign in to Zelaxy'
    case 'email-verification':
      return 'Verify your email for Zelaxy'
    case 'forget-password':
      return 'Reset your Zelaxy password'
    case 'reset-password':
      return 'Reset your Zelaxy password'
    case 'invitation':
      return "You've been invited to join a team on Zelaxy"
    case 'batch-invitation':
      return "You've been invited to join a team and workspaces on Zelaxy"
    case 'workspace-added':
      return "You've been given access to a workspace on Zelaxy"
    default:
      return 'Zelaxy'
  }
}
