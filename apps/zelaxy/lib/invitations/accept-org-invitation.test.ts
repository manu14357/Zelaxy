import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('lib/invitations/accept-org-invitation', () => {
  let mockDbResults: any[] = []
  let mockValidateSeatAvailability: any
  let mockInsertValues: any

  const pendingInvitation = {
    id: 'invitation-1',
    email: 'invitee@example.com',
    inviterId: 'inviter-1',
    organizationId: 'org-1',
    role: 'member',
    status: 'pending',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  }

  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()

    mockDbResults = []

    mockInsertValues = vi.fn().mockResolvedValue(undefined)
    const mockDbChain: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: mockInsertValues,
      then: vi.fn().mockImplementation((callback: any) => {
        const result = mockDbResults.shift() || []
        return callback ? callback(result) : Promise.resolve(result)
      }),
      catch: vi.fn().mockImplementation(function (this: any) {
        // .catch() is called on the "mark expired" update; since our `then` always
        // resolves (never rejects), just return a resolved promise.
        return Promise.resolve()
      }),
    }
    mockDbChain.transaction = vi.fn().mockImplementation(async (cb: any) => cb(mockDbChain))

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
      permissions: {
        id: 'id',
        userId: 'user_id',
        entityType: 'entity_type',
        entityId: 'entity_id',
        permissionType: 'permission_type',
      },
      workspaceInvitation: {
        id: 'id',
        workspaceId: 'workspace_id',
        email: 'email',
        status: 'status',
        permissions: 'permissions',
        expiresAt: 'expires_at',
        updatedAt: 'updated_at',
      },
    }))

    vi.doMock('drizzle-orm', () => ({
      and: vi.fn().mockImplementation((...args) => ({ type: 'and', conditions: args })),
      eq: vi.fn().mockImplementation((field, value) => ({ type: 'eq', field, value })),
    }))

    vi.doMock('crypto', () => ({
      randomUUID: vi.fn().mockReturnValue('mock-generated-id'),
    }))

    mockValidateSeatAvailability = vi.fn().mockResolvedValue({
      canInvite: true,
      currentSeats: 1,
      maxSeats: 10,
      availableSeats: 9,
    })
    vi.doMock('@/lib/billing/validation/seat-management', () => ({
      validateSeatAvailability: mockValidateSeatAvailability,
    }))

    vi.doMock('@/lib/logs/console/logger', () => ({
      createLogger: vi.fn().mockReturnValue({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      }),
    }))
  })

  it('accepts a valid pending invitation, adds membership, and cascades a linked workspace invitation', async () => {
    mockDbResults = [
      [pendingInvitation], // #1 invitation lookup
      [], // #2 existingMember (none)
      [], // #3 update invitation -> accepted (result ignored)
      [
        {
          id: 'ws-invite-1',
          workspaceId: 'ws-1',
          email: 'invitee@example.com',
          status: 'pending',
          permissions: 'write',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      ], // #4 pending workspace invitations
      [], // #5 existingPermission for that workspace (none)
      [], // #6 update workspaceInvitation -> accepted (result ignored)
    ]

    const { acceptOrgInvitation } = await import('@/lib/invitations/accept-org-invitation')
    const result = await acceptOrgInvitation({
      invitationId: 'invitation-1',
      userId: 'user-1',
      userEmail: 'invitee@example.com',
    })

    expect(result).toEqual({
      success: true,
      organizationId: 'org-1',
      role: 'member',
      alreadyMember: false,
      workspacesJoined: 1,
    })
    // A new member row and a new workspace permission row should both have been inserted
    expect(mockInsertValues).toHaveBeenCalledTimes(2)
  })

  it('is idempotent-friendly for a user who is already a member: no duplicate member row, still marks accepted', async () => {
    mockDbResults = [
      [pendingInvitation], // #1 invitation lookup
      [{ id: 'existing-member-row' }], // #2 existingMember (found)
      [], // #3 update invitation -> accepted
      [], // #4 pending workspace invitations (none)
    ]

    const { acceptOrgInvitation } = await import('@/lib/invitations/accept-org-invitation')
    const result = await acceptOrgInvitation({
      invitationId: 'invitation-1',
      userId: 'user-1',
      userEmail: 'invitee@example.com',
    })

    expect(result).toEqual({
      success: true,
      organizationId: 'org-1',
      role: 'member',
      alreadyMember: true,
      workspacesJoined: 0,
    })
    // No member row inserted since the user is already a member
    expect(mockInsertValues).not.toHaveBeenCalled()
  })

  it('rejects an expired invitation and marks it expired', async () => {
    mockDbResults = [
      [{ ...pendingInvitation, expiresAt: new Date(Date.now() - 1000) }], // #1 expired
      [], // #2 best-effort status update to 'expired'
    ]

    const { acceptOrgInvitation } = await import('@/lib/invitations/accept-org-invitation')
    const result = await acceptOrgInvitation({
      invitationId: 'invitation-1',
      userId: 'user-1',
      userEmail: 'invitee@example.com',
    })

    expect(result).toEqual({
      success: false,
      reason: 'expired',
      message: expect.stringContaining('expired'),
    })
  })

  it('rejects an invitation that has already been accepted', async () => {
    mockDbResults = [[{ ...pendingInvitation, status: 'accepted' }]] // #1

    const { acceptOrgInvitation } = await import('@/lib/invitations/accept-org-invitation')
    const result = await acceptOrgInvitation({
      invitationId: 'invitation-1',
      userId: 'user-1',
      userEmail: 'invitee@example.com',
    })

    expect(result).toEqual({
      success: false,
      reason: 'already-processed',
      message: expect.any(String),
    })
  })

  it('rejects when the accepting user email does not match the invitation email', async () => {
    mockDbResults = [[pendingInvitation]] // #1

    const { acceptOrgInvitation } = await import('@/lib/invitations/accept-org-invitation')
    const result = await acceptOrgInvitation({
      invitationId: 'invitation-1',
      userId: 'user-1',
      userEmail: 'someone-else@example.com',
    })

    expect(result).toEqual({
      success: false,
      reason: 'email-mismatch',
      message: expect.any(String),
    })
  })

  it('matches email case-insensitively', async () => {
    mockDbResults = [
      [pendingInvitation], // #1
      [], // #2 existingMember (none)
      [], // #3 update invitation
      [], // #4 pending workspace invitations (none)
    ]

    const { acceptOrgInvitation } = await import('@/lib/invitations/accept-org-invitation')
    const result = await acceptOrgInvitation({
      invitationId: 'invitation-1',
      userId: 'user-1',
      userEmail: 'INVITEE@EXAMPLE.COM',
    })

    expect(result.success).toBe(true)
  })

  it('rejects when the organization is over its seat cap', async () => {
    mockDbResults = [
      [pendingInvitation], // #1
      [], // #2 existingMember (none, so a new seat would be consumed)
    ]
    mockValidateSeatAvailability.mockResolvedValue({
      canInvite: false,
      reason: 'No available seats. Currently using 10 of 10 seats.',
      currentSeats: 10,
      maxSeats: 10,
      availableSeats: 0,
    })

    const { acceptOrgInvitation } = await import('@/lib/invitations/accept-org-invitation')
    const result = await acceptOrgInvitation({
      invitationId: 'invitation-1',
      userId: 'user-1',
      userEmail: 'invitee@example.com',
    })

    expect(result).toEqual({
      success: false,
      reason: 'seat-cap',
      message: 'No available seats. Currently using 10 of 10 seats.',
    })
    expect(mockInsertValues).not.toHaveBeenCalled()
  })

  it('does not seat-cap-check a user who is already a member (no new seat consumed)', async () => {
    mockDbResults = [
      [pendingInvitation], // #1
      [{ id: 'existing-member-row' }], // #2 existingMember (found)
      [], // #3 update invitation
      [], // #4 pending workspace invitations
    ]
    mockValidateSeatAvailability.mockResolvedValue({
      canInvite: false,
      reason: 'No available seats',
      currentSeats: 10,
      maxSeats: 10,
      availableSeats: 0,
    })

    const { acceptOrgInvitation } = await import('@/lib/invitations/accept-org-invitation')
    const result = await acceptOrgInvitation({
      invitationId: 'invitation-1',
      userId: 'user-1',
      userEmail: 'invitee@example.com',
    })

    expect(result.success).toBe(true)
    expect(mockValidateSeatAvailability).not.toHaveBeenCalled()
  })

  it('returns not-found for a missing invitation', async () => {
    mockDbResults = [[]] // #1 empty

    const { acceptOrgInvitation } = await import('@/lib/invitations/accept-org-invitation')
    const result = await acceptOrgInvitation({
      invitationId: 'does-not-exist',
      userId: 'user-1',
      userEmail: 'invitee@example.com',
    })

    expect(result).toEqual({
      success: false,
      reason: 'not-found',
      message: expect.any(String),
    })
  })

  it('returns server-error and does not throw when the database errors', async () => {
    const mockDbChainWithError: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(() => {
        throw new Error('connection lost')
      }),
    }
    vi.doMock('@/db', () => ({ db: mockDbChainWithError }))

    const { acceptOrgInvitation } = await import('@/lib/invitations/accept-org-invitation')
    const result = await acceptOrgInvitation({
      invitationId: 'invitation-1',
      userId: 'user-1',
      userEmail: 'invitee@example.com',
    })

    expect(result).toEqual({
      success: false,
      reason: 'server-error',
      message: expect.any(String),
    })
  })
})
