import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockRequest, mockAuth, mockConsoleLogger } from '@/app/api/__test-utils__/utils'

function createBatchRequest(body: any) {
  return new NextRequest('http://localhost:3000/api/test?batch=true', {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
}

describe('POST /api/organizations/[id]/invitations', () => {
  const mockUser = { id: 'admin-user', name: 'Admin User', email: 'admin@example.com' }
  const params = Promise.resolve({ id: 'org-1' })

  let mockDbResults: any[] = []
  let mockGetSession: any
  let mockInsertValues: any
  let mockValidateSeatAvailability: any
  let mockValidateBulkInvitations: any
  let mockHasWorkspaceAdminAccess: any
  let mockGrantWorkspaceAccessDirectly: any
  let mockSendEmail: any
  let mockQuickValidateEmail: any

  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()

    mockDbResults = []
    mockConsoleLogger()
    mockAuth(mockUser)

    mockGetSession = vi.fn()
    vi.doMock('@/lib/auth', () => ({ getSession: mockGetSession }))

    vi.doMock('crypto', () => {
      let counter = 0
      return {
        randomUUID: vi.fn(() => `mock-id-${++counter}`),
      }
    })

    mockInsertValues = vi.fn().mockResolvedValue(undefined)
    const mockDbChain: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((callback: any) => {
        const result = mockDbResults.shift() || []
        return callback ? callback(result) : Promise.resolve(result)
      }),
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
      permissions: { userId: 'user_id', entityType: 'entity_type', entityId: 'entity_id' },
      user: { id: 'id', name: 'name', email: 'email' },
      workspace: { id: 'id', name: 'name' },
      workspaceInvitation: {
        id: 'id',
        workspaceId: 'workspace_id',
        email: 'email',
        inviterId: 'inviter_id',
        role: 'role',
        status: 'status',
        token: 'token',
        permissions: 'permissions',
        expiresAt: 'expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }))

    vi.doMock('drizzle-orm', () => ({
      and: vi.fn().mockImplementation((...args) => ({ type: 'and', conditions: args })),
      eq: vi.fn().mockImplementation((field, value) => ({ type: 'eq', field, value })),
      inArray: vi.fn().mockImplementation((field, values) => ({ type: 'inArray', field, values })),
    }))

    mockValidateSeatAvailability = vi.fn().mockResolvedValue({
      canInvite: true,
      currentSeats: 1,
      maxSeats: 10,
      availableSeats: 9,
    })
    mockValidateBulkInvitations = vi.fn()
    vi.doMock('@/lib/billing/validation/seat-management', () => ({
      validateSeatAvailability: mockValidateSeatAvailability,
      validateBulkInvitations: mockValidateBulkInvitations,
    }))

    mockQuickValidateEmail = vi.fn().mockReturnValue({ isValid: true })
    vi.doMock('@/lib/email/validation', () => ({
      quickValidateEmail: mockQuickValidateEmail,
    }))

    mockHasWorkspaceAdminAccess = vi.fn().mockResolvedValue(true)
    vi.doMock('@/lib/permissions/utils', () => ({
      hasWorkspaceAdminAccess: mockHasWorkspaceAdminAccess,
    }))

    mockGrantWorkspaceAccessDirectly = vi.fn().mockResolvedValue({ success: true })
    vi.doMock('@/lib/invitations/direct-grant', () => ({
      grantWorkspaceAccessDirectly: mockGrantWorkspaceAccessDirectly,
    }))

    mockSendEmail = vi.fn().mockResolvedValue({ success: true, message: 'sent' })
    vi.doMock('@/lib/email/mailer', () => ({ sendEmail: mockSendEmail }))

    vi.doMock('@/components/emails/render-email', () => ({
      renderInvitationEmail: vi.fn().mockResolvedValue('<html>invite</html>'),
      renderBatchInvitationEmail: vi.fn().mockResolvedValue('<html>batch</html>'),
      getEmailSubject: vi.fn().mockReturnValue('subject'),
    }))

    vi.doMock('@/lib/env', () => ({
      env: { NEXT_PUBLIC_APP_URL: 'https://test.zelaxy.ai' },
    }))
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const { POST } = await import('@/app/api/organizations/[id]/invitations/route')
    const req = createMockRequest('POST', { email: 'someone@example.com' })
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Unauthorized' })
  })

  it('should return 400 when neither email nor emails is provided', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })

    const { POST } = await import('@/app/api/organizations/[id]/invitations/route')
    const req = createMockRequest('POST', {})
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('should return 400 for an invalid role', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })

    const { POST } = await import('@/app/api/organizations/[id]/invitations/route')
    const req = createMockRequest('POST', { email: 'someone@example.com', role: 'superadmin' })
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('should return 403 when caller is not an org admin/owner', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [[{ role: 'member' }]]

    const { POST } = await import('@/app/api/organizations/[id]/invitations/route')
    const req = createMockRequest('POST', { email: 'someone@example.com' })
    const response = await POST(req, { params })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toMatch(/Admin access required/)
  })

  it('grants workspace access directly (no org invitation) when the invitee is already an org member', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [
      [{ role: 'admin' }], // memberEntry (caller is admin)
      [{ name: 'Acme Org' }], // organizationEntry
      [{ userEmail: 'existing@example.com', userId: 'existing-user-1' }], // existingMembers
      [], // existingInvitations (none pending)
      [{ id: 'ws-1', name: 'Workspace One' }], // workspaceDetailsForGrant
      [{ name: 'Admin User' }], // inviterForGrant
      [], // alreadyGranted permissions (none)
      [{ name: 'Admin User' }], // inviter (for the email-sending loop, unused since it's empty)
    ]

    const { POST } = await import('@/app/api/organizations/[id]/invitations/route')
    const req = createBatchRequest({
      email: 'existing@example.com',
      workspaceInvitations: [{ workspaceId: 'ws-1', permission: 'write' }],
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'org-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.invitationsSent).toBe(0)
    expect(data.data.directGrants).toEqual([
      { email: 'existing@example.com', workspaceIds: ['ws-1'] },
    ])
    expect(mockGrantWorkspaceAccessDirectly).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'existing-user-1',
        email: 'existing@example.com',
        workspaces: [{ workspaceId: 'ws-1', workspaceName: 'Workspace One', permission: 'write' }],
      })
    )
    // No token-based org invitation should have been created for the direct-grant path
    expect(mockInsertValues).not.toHaveBeenCalled()
  })

  it('still creates a normal org invitation for a brand-new email (regression)', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [
      [{ role: 'admin' }], // memberEntry
      [{ name: 'Acme Org' }], // organizationEntry
      [], // existingMembers (nobody yet)
      [], // existingInvitations
      [{ name: 'Admin User' }], // inviter (for email-sending loop)
    ]

    const { POST } = await import('@/app/api/organizations/[id]/invitations/route')
    const req = createMockRequest('POST', { email: 'new@example.com' })
    const response = await POST(req, { params: Promise.resolve({ id: 'org-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.invitationsSent).toBe(1)
    expect(data.data.directGrants).toEqual([])
    expect(mockGrantWorkspaceAccessDirectly).not.toHaveBeenCalled()
    expect(mockInsertValues).toHaveBeenCalled()
  })

  it('does not attempt a direct grant outside of batch mode', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockDbResults = [
      [{ role: 'admin' }], // memberEntry
      [{ name: 'Acme Org' }], // organizationEntry
      [{ userEmail: 'existing@example.com', userId: 'existing-user-1' }], // existingMembers
      [], // existingInvitations
    ]

    const { POST } = await import('@/app/api/organizations/[id]/invitations/route')
    // No ?batch=true and no workspaceInvitations — existing member, nothing to do
    const req = createMockRequest('POST', { email: 'existing@example.com' })
    const response = await POST(req, { params: Promise.resolve({ id: 'org-1' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/already members/)
    expect(mockGrantWorkspaceAccessDirectly).not.toHaveBeenCalled()
  })
})
