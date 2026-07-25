import { render } from '@react-email/components'
import {
  BatchInvitationEmail,
  InvitationEmail,
  OTPVerificationEmail,
  ResetPasswordEmail,
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
