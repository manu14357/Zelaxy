import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('lib/invitations/direct-grant', () => {
  let mockDbResults: any[] = []
  let mockInsertValues: ReturnType<typeof vi.fn>
  let mockSendEmail: ReturnType<typeof vi.fn>
  let mockRenderWorkspaceAddedEmail: ReturnType<typeof vi.fn>
  let mockGetEmailSubject: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()

    mockDbResults = []

    mockInsertValues = vi.fn().mockResolvedValue(undefined)
    const mockDbChain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((callback: any) => {
        const result = mockDbResults.shift() || []
        return callback ? callback(result) : Promise.resolve(result)
      }),
      insert: vi.fn().mockReturnThis(),
      values: mockInsertValues,
    }

    vi.doMock('@/db', () => ({ db: mockDbChain }))

    vi.doMock('@/db/schema', () => ({
      member: { userId: 'member_user_id', organizationId: 'member_organization_id' },
      user: { id: 'user_id', email: 'user_email' },
      permissions: {
        id: 'id',
        userId: 'user_id',
        entityType: 'entity_type',
        entityId: 'entity_id',
        permissionType: 'permission_type',
      },
      permissionTypeEnum: { enumValues: ['admin', 'write', 'read'] as const },
    }))

    vi.doMock('drizzle-orm', () => ({
      and: vi.fn().mockImplementation((...args) => ({ type: 'and', conditions: args })),
      eq: vi.fn().mockImplementation((field, value) => ({ type: 'eq', field, value })),
    }))

    vi.doMock('crypto', () => ({
      randomUUID: vi.fn().mockReturnValue('mock-permission-id'),
    }))

    mockSendEmail = vi.fn().mockResolvedValue({ success: true, message: 'sent' })
    vi.doMock('@/lib/email/mailer', () => ({
      sendEmail: mockSendEmail,
    }))

    mockRenderWorkspaceAddedEmail = vi.fn().mockResolvedValue('<html>email</html>')
    mockGetEmailSubject = vi
      .fn()
      .mockReturnValue("You've been given access to a workspace on Zelaxy")
    vi.doMock('@/components/emails/render-email', () => ({
      renderWorkspaceAddedEmail: mockRenderWorkspaceAddedEmail,
      getEmailSubject: mockGetEmailSubject,
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

  describe('findExistingOrgMemberByEmail', () => {
    it('returns the userId when the email belongs to an org member', async () => {
      mockDbResults = [[{ userId: 'existing-user-1' }]]

      const { findExistingOrgMemberByEmail } = await import('@/lib/invitations/direct-grant')
      const result = await findExistingOrgMemberByEmail('org-1', 'member@example.com')

      expect(result).toEqual({ userId: 'existing-user-1' })
    })

    it('returns null when the email does not belong to any org member', async () => {
      mockDbResults = [[]]

      const { findExistingOrgMemberByEmail } = await import('@/lib/invitations/direct-grant')
      const result = await findExistingOrgMemberByEmail('org-1', 'stranger@example.com')

      expect(result).toBeNull()
    })
  })

  describe('grantWorkspaceAccessDirectly', () => {
    it('does nothing and reports success when given an empty workspace list', async () => {
      const { grantWorkspaceAccessDirectly } = await import('@/lib/invitations/direct-grant')

      const result = await grantWorkspaceAccessDirectly({
        userId: 'user-1',
        email: 'member@example.com',
        inviterName: 'Ada',
        workspaces: [],
      })

      expect(result).toEqual({ success: true })
      expect(mockInsertValues).not.toHaveBeenCalled()
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('inserts a permission row per workspace and sends one notification email', async () => {
      const { grantWorkspaceAccessDirectly } = await import('@/lib/invitations/direct-grant')

      const result = await grantWorkspaceAccessDirectly({
        userId: 'user-1',
        email: 'member@example.com',
        inviterName: 'Ada',
        workspaces: [
          { workspaceId: 'ws-1', workspaceName: 'Workspace One', permission: 'write' },
          { workspaceId: 'ws-2', workspaceName: 'Workspace Two', permission: 'read' },
        ],
      })

      expect(result).toEqual({ success: true })
      expect(mockInsertValues).toHaveBeenCalledTimes(1)
      const insertedRows = mockInsertValues.mock.calls[0][0]
      expect(insertedRows).toHaveLength(2)
      expect(insertedRows[0]).toMatchObject({
        userId: 'user-1',
        entityType: 'workspace',
        entityId: 'ws-1',
        permissionType: 'write',
      })
      expect(insertedRows[1]).toMatchObject({
        userId: 'user-1',
        entityType: 'workspace',
        entityId: 'ws-2',
        permissionType: 'read',
      })

      expect(mockRenderWorkspaceAddedEmail).toHaveBeenCalledWith('Ada', [
        { workspaceName: 'Workspace One', permission: 'write' },
        { workspaceName: 'Workspace Two', permission: 'read' },
      ])
      expect(mockSendEmail).toHaveBeenCalledTimes(1)
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'member@example.com', emailType: 'transactional' })
      )
    })

    it('still reports success when the notification email fails to send', async () => {
      mockSendEmail.mockResolvedValueOnce({ success: false, message: 'provider down' })

      const { grantWorkspaceAccessDirectly } = await import('@/lib/invitations/direct-grant')

      const result = await grantWorkspaceAccessDirectly({
        userId: 'user-1',
        email: 'member@example.com',
        inviterName: 'Ada',
        workspaces: [{ workspaceId: 'ws-1', workspaceName: 'Workspace One', permission: 'read' }],
      })

      // The permission grant already happened — email delivery failure must not undo it or
      // fail the request.
      expect(result).toEqual({ success: true })
      expect(mockInsertValues).toHaveBeenCalledTimes(1)
    })

    it('still reports success when rendering/sending the email throws', async () => {
      mockRenderWorkspaceAddedEmail.mockRejectedValueOnce(new Error('render failed'))

      const { grantWorkspaceAccessDirectly } = await import('@/lib/invitations/direct-grant')

      const result = await grantWorkspaceAccessDirectly({
        userId: 'user-1',
        email: 'member@example.com',
        inviterName: 'Ada',
        workspaces: [{ workspaceId: 'ws-1', workspaceName: 'Workspace One', permission: 'read' }],
      })

      expect(result).toEqual({ success: true })
      expect(mockInsertValues).toHaveBeenCalledTimes(1)
    })
  })
})
