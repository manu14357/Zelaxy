import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockRequest, mockAuth, mockConsoleLogger } from '@/app/api/__test-utils__/utils'

describe('POST /api/organizations/[id]/invitations/[invitationId]/resend', () => {
  const mockUser = { id: 'user-123', name: 'Admin User', email: 'admin@example.com' }
  const mockPendingInvitation = {
    id: 'invitation-1',
    email: 'invitee@example.com',
    inviterId: 'someone-else',
    organizationId: 'org-1',
    role: 'member',
    status: 'pending',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  }

  let mockDbResults: any[] = []
  let mockGetSession: any
  let mockCancelInvitation: any
  let mockInsertValues: any
  let mockSendEmail: any
  let mockRenderInvitationEmail: any

  const params = Promise.resolve({ id: 'org-1', invitationId: 'invitation-1' })

  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()

    mockDbResults = []
    mockConsoleLogger()
    mockAuth(mockUser)

    mockGetSession = vi.fn()
    mockCancelInvitation = vi.fn().mockResolvedValue({ id: 'invitation-1', status: 'canceled' })
    vi.doMock('@/lib/auth', () => ({
      getSession: mockGetSession,
      auth: { api: { cancelInvitation: mockCancelInvitation } },
    }))

    vi.doMock('crypto', () => ({
      randomUUID: vi.fn().mockReturnValue('new-invitation-id'),
    }))

    mockInsertValues = vi.fn().mockResolvedValue(undefined)
    const mockDbChain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => Promise.resolve(mockDbResults.shift() || [])),
      insert: vi.fn().mockReturnThis(),
      values: mockInsertValues,
    }
    vi.doMock('@/db', () => ({ db: mockDbChain }))

    vi.doMock('@/db/schema', () => ({
      invitation: {
        id: 'id',
        email: 'email',
        inviterId: 'inviter_id',
        organizationId: 'organization_id',
        role: 'role',
        status: 'status',
        expiresAt: 'expires_at',
        createdAt: 'created_at',
      },
      member: { organizationId: 'organization_id', userId: 'user_id', role: 'role' },
      organization: { id: 'id', name: 'name' },
      user: { id: 'id', name: 'name', email: 'email' },
    }))

    vi.doMock('drizzle-orm', () => ({
      and: vi.fn().mockImplementation((...args) => ({ type: 'and', conditions: args })),
      eq: vi.fn().mockImplementation((field, value) => ({ type: 'eq', field, value })),
    }))

    mockSendEmail = vi.fn().mockResolvedValue({ success: true, message: 'sent' })
    vi.doMock('@/lib/email/mailer', () => ({ sendEmail: mockSendEmail }))

    mockRenderInvitationEmail = vi.fn().mockResolvedValue('<html>invite</html>')
    vi.doMock('@/components/emails/render-email', () => ({
      renderInvitationEmail: mockRenderInvitationEmail,
      getEmailSubject: vi.fn().mockReturnValue("You've been invited to join a team on Zelaxy"),
    }))

    vi.doMock('@/lib/env', () => ({
      env: { NEXT_PUBLIC_APP_URL: 'https://test.zelaxy.ai' },
    }))
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const { POST } = await import(
      '@/app/api/organizations/[id]/invitations/[invitationId]/resend/route'
    )
    const req = createMockRequest('POST')
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Unauthorized' })
  })

  it('should return 403 when the caller is not a member of the organization', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [[]] // memberEntry lookup empty

    const { POST } = await import(
      '@/app/api/organizations/[id]/invitations/[invitationId]/resend/route'
    )
    const req = createMockRequest('POST')
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toMatch(/Not a member/)
  })

  it('should return 403 when the caller is not an admin/owner', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [[{ role: 'member' }]]

    const { POST } = await import(
      '@/app/api/organizations/[id]/invitations/[invitationId]/resend/route'
    )
    const req = createMockRequest('POST')
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toMatch(/Admin access required/)
  })

  it('should return 404 when the invitation does not exist for this organization', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [[{ role: 'admin' }], []]

    const { POST } = await import(
      '@/app/api/organizations/[id]/invitations/[invitationId]/resend/route'
    )
    const req = createMockRequest('POST')
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'Invitation not found' })
  })

  it('should return 400 when the invitation is not pending', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [[{ role: 'admin' }], [{ ...mockPendingInvitation, status: 'accepted' }]]

    const { POST } = await import(
      '@/app/api/organizations/[id]/invitations/[invitationId]/resend/route'
    )
    const req = createMockRequest('POST')
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Can only resend pending invitations' })
  })

  it('should return 500 when cancelling the existing invitation fails', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [[{ role: 'admin' }], [mockPendingInvitation]]
    mockCancelInvitation.mockRejectedValue(new Error('already accepted'))

    const { POST } = await import(
      '@/app/api/organizations/[id]/invitations/[invitationId]/resend/route'
    )
    const req = createMockRequest('POST')
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to cancel the existing invitation' })
    expect(mockInsertValues).not.toHaveBeenCalled()
  })

  it('should cancel the old invitation, create a new one, and resend the email', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [
      [{ role: 'admin' }], // memberEntry
      [mockPendingInvitation], // existing invitation
      [{ name: 'Acme Inc' }], // organizationEntry
      [{ name: 'Admin User' }], // inviter
    ]

    const { POST } = await import(
      '@/app/api/organizations/[id]/invitations/[invitationId]/resend/route'
    )
    const req = createMockRequest('POST')
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.invitation.id).toBe('new-invitation-id')
    expect(data.invitation.email).toBe(mockPendingInvitation.email)
    expect(data.invitation.status).toBe('pending')

    expect(mockCancelInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ body: { invitationId: 'invitation-1' } })
    )
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'new-invitation-id',
        email: mockPendingInvitation.email,
        organizationId: 'org-1',
        role: mockPendingInvitation.role,
        status: 'pending',
      })
    )
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: mockPendingInvitation.email })
    )
  })
})
