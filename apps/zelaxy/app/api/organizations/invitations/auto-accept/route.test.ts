import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockAuth, mockConsoleLogger } from '@/app/api/__test-utils__/utils'

describe('POST /api/organizations/invitations/auto-accept', () => {
  const mockUser = { id: 'user-1', email: 'invitee@example.com' }

  let mockGetSession: any
  let mockAcceptOrgInvitation: any
  let mockDbResults: any[] = []

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

    const mockDbChain: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => Promise.resolve(mockDbResults.shift() || [])),
    }
    vi.doMock('@/db', () => ({ db: mockDbChain }))

    vi.doMock('@/db/schema', () => ({
      invitation: { id: 'id', email: 'email', status: 'status' },
    }))

    vi.doMock('drizzle-orm', () => ({
      and: vi.fn().mockImplementation((...args) => ({ type: 'and', conditions: args })),
      eq: vi.fn().mockImplementation((field, value) => ({ type: 'eq', field, value })),
    }))
  })

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const { POST } = await import('@/app/api/organizations/invitations/auto-accept/route')
    const response = await POST()

    expect(response.status).toBe(401)
  })

  it('should accept all pending invitations that succeed and skip the ones that fail', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [[{ id: 'invitation-1' }, { id: 'invitation-2' }, { id: 'invitation-3' }]]

    mockAcceptOrgInvitation
      .mockResolvedValueOnce({
        success: true,
        organizationId: 'org-1',
        role: 'member',
        alreadyMember: false,
        workspacesJoined: 0,
      })
      .mockResolvedValueOnce({ success: false, reason: 'expired', message: 'expired' })
      .mockResolvedValueOnce({
        success: true,
        organizationId: 'org-3',
        role: 'admin',
        alreadyMember: true,
        workspacesJoined: 1,
      })

    const { POST } = await import('@/app/api/organizations/invitations/auto-accept/route')
    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      accepted: 2,
      invitationIds: ['invitation-1', 'invitation-3'],
    })
    expect(mockAcceptOrgInvitation).toHaveBeenCalledTimes(3)
    expect(mockAcceptOrgInvitation).toHaveBeenNthCalledWith(1, {
      invitationId: 'invitation-1',
      userId: 'user-1',
      userEmail: 'invitee@example.com',
    })
  })

  it('should return an empty result when there are no pending invitations', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [[]]

    const { POST } = await import('@/app/api/organizations/invitations/auto-accept/route')
    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true, accepted: 0, invitationIds: [] })
    expect(mockAcceptOrgInvitation).not.toHaveBeenCalled()
  })

  it('should return 500 when the lookup query throws', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    const mockDbChainWithError: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockRejectedValue(new Error('db down')),
    }
    vi.doMock('@/db', () => ({ db: mockDbChainWithError }))

    const { POST } = await import('@/app/api/organizations/invitations/auto-accept/route')
    const response = await POST()

    expect(response.status).toBe(500)
  })
})
