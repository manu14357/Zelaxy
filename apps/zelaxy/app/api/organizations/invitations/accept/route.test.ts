import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockRequest, mockAuth, mockConsoleLogger } from '@/app/api/__test-utils__/utils'

describe('/api/organizations/invitations/accept', () => {
  const mockUser = { id: 'user-1', email: 'invitee@example.com' }

  let mockGetSession: any
  let mockAcceptOrgInvitation: any

  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()

    mockConsoleLogger()
    mockAuth(mockUser)

    mockGetSession = vi.fn()
    vi.doMock('@/lib/auth', () => ({ getSession: mockGetSession }))

    mockAcceptOrgInvitation = vi.fn()
    vi.doMock('@/lib/invitations/accept-org-invitation', () => ({
      acceptOrgInvitation: mockAcceptOrgInvitation,
    }))

    vi.doMock('@/lib/env', () => ({
      env: { NEXT_PUBLIC_APP_URL: 'https://test.zelaxy.ai' },
    }))
  })

  describe('GET', () => {
    it('redirects to invite-error when the invitation id is missing', async () => {
      const { GET } = await import('@/app/api/organizations/invitations/accept/route')
      const req = createMockRequest('GET')
      const response = await GET(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain(
        '/invite/invite-error?reason=missing-invitation-id'
      )
    })

    it('redirects to the organization invite page when unauthenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const { GET } = await import('@/app/api/organizations/invitations/accept/route')
      const req = createMockRequest('GET')
      req.nextUrl.searchParams.set('id', 'invitation-1')
      const response = await GET(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/invite/organization?id=invitation-1')
    })

    it('redirects to the success page when the shared helper accepts', async () => {
      mockGetSession.mockResolvedValue({ user: mockUser })
      mockAcceptOrgInvitation.mockResolvedValue({
        success: true,
        organizationId: 'org-1',
        role: 'member',
        alreadyMember: false,
        workspacesJoined: 1,
      })

      const { GET } = await import('@/app/api/organizations/invitations/accept/route')
      const req = createMockRequest('GET')
      req.nextUrl.searchParams.set('id', 'invitation-1')
      const response = await GET(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/workspaces?invite=accepted')
      expect(mockAcceptOrgInvitation).toHaveBeenCalledWith({
        invitationId: 'invitation-1',
        userId: 'user-1',
        userEmail: 'invitee@example.com',
      })
    })

    it('redirects to invite-error with the mapped reason when the shared helper rejects', async () => {
      mockGetSession.mockResolvedValue({ user: mockUser })
      mockAcceptOrgInvitation.mockResolvedValue({
        success: false,
        reason: 'expired',
        message: 'This invitation has expired',
      })

      const { GET } = await import('@/app/api/organizations/invitations/accept/route')
      const req = createMockRequest('GET')
      req.nextUrl.searchParams.set('id', 'invitation-1')
      const response = await GET(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/invite/invite-error?reason=expired')
    })

    it('now treats "already a member" as success rather than a hard error (consolidation behavior change)', async () => {
      // Documents an intentional behavior change from the pre-consolidation implementation,
      // which redirected to invite-error?reason=already-member in this case even though the
      // invitation was still legitimately pending. See lib/invitations/accept-org-invitation.ts.
      mockGetSession.mockResolvedValue({ user: mockUser })
      mockAcceptOrgInvitation.mockResolvedValue({
        success: true,
        organizationId: 'org-1',
        role: 'member',
        alreadyMember: true,
        workspacesJoined: 0,
      })

      const { GET } = await import('@/app/api/organizations/invitations/accept/route')
      const req = createMockRequest('GET')
      req.nextUrl.searchParams.set('id', 'invitation-1')
      const response = await GET(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/workspaces?invite=accepted')
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const { POST } = await import('@/app/api/organizations/invitations/accept/route')
      const req = createMockRequest('POST', { invitationId: 'invitation-1' })
      const response = await POST(req)

      expect(response.status).toBe(401)
    })

    it('returns 400 when invitationId is missing from the body', async () => {
      mockGetSession.mockResolvedValue({ user: mockUser })

      const { POST } = await import('@/app/api/organizations/invitations/accept/route')
      const req = createMockRequest('POST', {})
      const response = await POST(req)

      expect(response.status).toBe(400)
    })

    it('returns JSON success when the shared helper accepts', async () => {
      mockGetSession.mockResolvedValue({ user: mockUser })
      mockAcceptOrgInvitation.mockResolvedValue({
        success: true,
        organizationId: 'org-1',
        role: 'member',
        alreadyMember: false,
        workspacesJoined: 2,
      })

      const { POST } = await import('@/app/api/organizations/invitations/accept/route')
      const req = createMockRequest('POST', { invitationId: 'invitation-1' })
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Successfully joined organization and 2 workspace(s)',
        organizationId: 'org-1',
        workspacesJoined: 2,
      })
    })

    it('maps a shared-helper failure to a JSON error response', async () => {
      mockGetSession.mockResolvedValue({ user: mockUser })
      mockAcceptOrgInvitation.mockResolvedValue({
        success: false,
        reason: 'email-mismatch',
        message: 'This invitation was sent to a different email address',
      })

      const { POST } = await import('@/app/api/organizations/invitations/accept/route')
      const req = createMockRequest('POST', { invitationId: 'invitation-1' })
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({ error: 'This invitation was sent to a different email address' })
    })
  })
})
