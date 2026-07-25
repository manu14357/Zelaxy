import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockRequest, mockAuth, mockConsoleLogger } from '@/app/api/__test-utils__/utils'

describe('POST /api/invitations/[id]', () => {
  const mockUser = { id: 'user-1', email: 'invitee@example.com' }
  const params = Promise.resolve({ id: 'invitation-1' })

  let mockDbResults: any[] = []
  let mockGetSession: any
  let mockAcceptOrgInvitation: any
  let mockUpdateWhere: any

  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()

    mockDbResults = []
    mockConsoleLogger()
    mockAuth(mockUser)

    mockGetSession = vi.fn()
    vi.doMock('@/lib/auth', () => ({ getSession: mockGetSession }))

    mockAcceptOrgInvitation = vi.fn()
    vi.doMock('@/lib/invitations/accept-org-invitation', () => ({
      acceptOrgInvitation: mockAcceptOrgInvitation,
    }))

    mockUpdateWhere = vi.fn().mockResolvedValue(undefined)
    const mockDbChain: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => Promise.resolve(mockDbResults.shift() || [])),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockImplementation(() => ({ where: mockUpdateWhere })),
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
      organization: { id: 'id', name: 'name' },
      user: { id: 'id', name: 'name', email: 'email' },
    }))

    vi.doMock('drizzle-orm', () => ({
      and: vi.fn().mockImplementation((...args) => ({ type: 'and', conditions: args })),
      eq: vi.fn().mockImplementation((field, value) => ({ type: 'eq', field, value })),
    }))
  })

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const { POST } = await import('@/app/api/invitations/[id]/route')
    const req = createMockRequest('POST', { action: 'accept' })
    const response = await POST(req, { params })

    expect(response.status).toBe(401)
  })

  it('should return 400 for an invalid action', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })

    const { POST } = await import('@/app/api/invitations/[id]/route')
    const req = createMockRequest('POST', { action: 'nonsense' })
    const response = await POST(req, { params })

    expect(response.status).toBe(400)
  })

  it('should delegate accept to the shared helper and return 200 on success', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockAcceptOrgInvitation.mockResolvedValue({
      success: true,
      organizationId: 'org-1',
      role: 'member',
      alreadyMember: false,
      workspacesJoined: 0,
    })

    const { POST } = await import('@/app/api/invitations/[id]/route')
    const req = createMockRequest('POST', { action: 'accept' })
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true, status: 'accepted', organizationId: 'org-1' })
    expect(mockAcceptOrgInvitation).toHaveBeenCalledWith({
      invitationId: 'invitation-1',
      userId: 'user-1',
      userEmail: 'invitee@example.com',
    })
  })

  it('should map a shared-helper failure to the correct HTTP status', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockAcceptOrgInvitation.mockResolvedValue({
      success: false,
      reason: 'expired',
      message: 'This invitation has expired',
    })

    const { POST } = await import('@/app/api/invitations/[id]/route')
    const req = createMockRequest('POST', { action: 'accept' })
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(410)
    expect(data).toEqual({ error: 'This invitation has expired' })
  })

  it('should decline without going through the shared accept helper', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [
      [
        {
          id: 'invitation-1',
          email: mockUser.email,
          status: 'pending',
          expiresAt: new Date(Date.now() + 60_000),
          organizationId: 'org-1',
        },
      ],
    ]

    const { POST } = await import('@/app/api/invitations/[id]/route')
    const req = createMockRequest('POST', { action: 'decline' })
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true, status: 'declined' })
    expect(mockAcceptOrgInvitation).not.toHaveBeenCalled()
  })
})
