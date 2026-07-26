import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession } from '@/lib/auth'
import { sendWorkspaceInvitationEmail } from '@/lib/invitations/send-workspace-invitation-email'
import { hasWorkspaceAdminAccess } from '@/lib/permissions/utils'
import { DELETE, POST } from '@/app/api/arenas/invitations/[id]/route'
import { db } from '@/db'
import { workspaceInvitation } from '@/db/schema'

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/permissions/utils', () => ({
  hasWorkspaceAdminAccess: vi.fn(),
}))

vi.mock('@/lib/invitations/send-workspace-invitation-email', () => ({
  sendWorkspaceInvitationEmail: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/db/schema', () => ({
  workspaceInvitation: {
    id: 'id',
    workspaceId: 'workspaceId',
    email: 'email',
    inviterId: 'inviterId',
    status: 'status',
  },
  workspace: {
    id: 'id',
    name: 'name',
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
}))

describe('DELETE /api/arenas/invitations/[id]', () => {
  const mockSession = {
    user: {
      id: 'user123',
      email: 'user@example.com',
      name: 'Test User',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
      razorpayCustomerId: null,
    },
    session: {
      id: 'session123',
      token: 'token123',
      userId: 'user123',
      expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
      activeOrganizationId: null,
    },
  }

  const mockInvitation = {
    id: 'invitation123',
    workspaceId: 'workspace456',
    email: 'invited@example.com',
    inviterId: 'inviter789',
    status: 'pending',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/arenas/invitations/invitation123', {
      method: 'DELETE',
    })

    const params = Promise.resolve({ id: 'invitation123' })
    const response = await DELETE(req, { params })

    expect(response).toBeInstanceOf(NextResponse)
    const data = await response.json()
    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Unauthorized' })
  })

  it('should return 404 when invitation does not exist', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    // Mock invitation not found
    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      then: vi.fn((callback: (rows: any[]) => any) => {
        // Simulate empty rows array
        return Promise.resolve(callback([]))
      }),
    }
    vi.mocked(db.select).mockReturnValue(mockQuery as any)

    const req = new NextRequest('http://localhost/api/arenas/invitations/non-existent', {
      method: 'DELETE',
    })

    const params = Promise.resolve({ id: 'non-existent' })
    const response = await DELETE(req, { params })

    expect(response).toBeInstanceOf(NextResponse)
    const data = await response.json()
    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'Invitation not found' })
  })

  it('should return 403 when user does not have admin access', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    // Mock invitation found
    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      then: vi.fn((callback: (rows: any[]) => any) => {
        // Return the first invitation from the array
        return Promise.resolve(callback([mockInvitation]))
      }),
    }
    vi.mocked(db.select).mockReturnValue(mockQuery as any)

    // Mock user does not have admin access
    vi.mocked(hasWorkspaceAdminAccess).mockResolvedValue(false)

    const req = new NextRequest('http://localhost/api/arenas/invitations/invitation123', {
      method: 'DELETE',
    })

    const params = Promise.resolve({ id: 'invitation123' })
    const response = await DELETE(req, { params })

    expect(response).toBeInstanceOf(NextResponse)
    const data = await response.json()
    expect(response.status).toBe(403)
    expect(data).toEqual({ error: 'Insufficient permissions' })
    expect(hasWorkspaceAdminAccess).toHaveBeenCalledWith('user123', 'workspace456')
  })

  it('should return 400 when trying to delete non-pending invitation', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    // Mock invitation with accepted status
    const acceptedInvitation = { ...mockInvitation, status: 'accepted' }
    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      then: vi.fn((callback: (rows: any[]) => any) => {
        // Return the first invitation from the array
        return Promise.resolve(callback([acceptedInvitation]))
      }),
    }
    vi.mocked(db.select).mockReturnValue(mockQuery as any)

    // Mock user has admin access
    vi.mocked(hasWorkspaceAdminAccess).mockResolvedValue(true)

    const req = new NextRequest('http://localhost/api/arenas/invitations/invitation123', {
      method: 'DELETE',
    })

    const params = Promise.resolve({ id: 'invitation123' })
    const response = await DELETE(req, { params })

    expect(response).toBeInstanceOf(NextResponse)
    const data = await response.json()
    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Can only delete pending invitations' })
  })

  it('should successfully delete pending invitation when user has admin access', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    // Mock invitation found
    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      then: vi.fn((callback: (rows: any[]) => any) => {
        // Return the first invitation from the array
        return Promise.resolve(callback([mockInvitation]))
      }),
    }
    vi.mocked(db.select).mockReturnValue(mockQuery as any)

    // Mock user has admin access
    vi.mocked(hasWorkspaceAdminAccess).mockResolvedValue(true)

    // Mock successful deletion
    const mockDelete = {
      where: vi.fn().mockResolvedValue({ rowCount: 1 }),
    }
    vi.mocked(db.delete).mockReturnValue(mockDelete as any)

    const req = new NextRequest('http://localhost/api/arenas/invitations/invitation123', {
      method: 'DELETE',
    })

    const params = Promise.resolve({ id: 'invitation123' })
    const response = await DELETE(req, { params })

    expect(response).toBeInstanceOf(NextResponse)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true })
    expect(db.delete).toHaveBeenCalledWith(workspaceInvitation)
    expect(mockDelete.where).toHaveBeenCalled()
  })

  it('should return 500 when database error occurs', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    // Mock database error
    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      then: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    }
    vi.mocked(db.select).mockReturnValue(mockQuery as any)

    const req = new NextRequest('http://localhost/api/arenas/invitations/invitation123', {
      method: 'DELETE',
    })

    const params = Promise.resolve({ id: 'invitation123' })
    const response = await DELETE(req, { params })

    expect(response).toBeInstanceOf(NextResponse)
    const data = await response.json()
    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to delete invitation' })
  })
})

describe('POST /api/arenas/invitations/[id] (resend)', () => {
  const mockSession = {
    user: {
      id: 'user123',
      email: 'user@example.com',
      name: 'Test User',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
      razorpayCustomerId: null,
    },
    session: {
      id: 'session123',
      token: 'token123',
      userId: 'user123',
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
      activeOrganizationId: null,
    },
  }

  const mockInvitation = {
    id: 'invitation123',
    workspaceId: 'workspace456',
    email: 'invited@example.com',
    inviterId: 'inviter789',
    status: 'pending',
  }

  const mockWorkspace = { id: 'workspace456', name: 'Test Workspace' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockSelectSequence(results: any[][]) {
    const queries = results.map((rows) => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      then: vi.fn((callback: (rows: any[]) => any) => Promise.resolve(callback(rows))),
    }))
    const mockFn = vi.mocked(db.select)
    queries.forEach((q) => mockFn.mockReturnValueOnce(q as any))
    return queries
  }

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/arenas/invitations/invitation123', {
      method: 'POST',
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'invitation123' }) })

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  it('should return 404 when invitation does not exist', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    mockSelectSequence([[]])

    const req = new NextRequest('http://localhost/api/arenas/invitations/non-existent', {
      method: 'POST',
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'non-existent' }) })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Invitation not found' })
  })

  it('should return 403 when user does not have admin access', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    mockSelectSequence([[mockInvitation]])
    vi.mocked(hasWorkspaceAdminAccess).mockResolvedValue(false)

    const req = new NextRequest('http://localhost/api/arenas/invitations/invitation123', {
      method: 'POST',
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'invitation123' }) })

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Insufficient permissions' })
  })

  it('should return 400 when invitation is not pending', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    mockSelectSequence([[{ ...mockInvitation, status: 'accepted' }]])
    vi.mocked(hasWorkspaceAdminAccess).mockResolvedValue(true)

    const req = new NextRequest('http://localhost/api/arenas/invitations/invitation123', {
      method: 'POST',
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'invitation123' }) })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Can only resend pending invitations' })
  })

  it('should return 404 when the workspace no longer exists', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    mockSelectSequence([[mockInvitation], []])
    vi.mocked(hasWorkspaceAdminAccess).mockResolvedValue(true)

    const req = new NextRequest('http://localhost/api/arenas/invitations/invitation123', {
      method: 'POST',
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'invitation123' }) })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Workspace not found' })
  })

  it('should rotate the token, reset the expiry, and resend the email for a pending invitation', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    mockSelectSequence([[mockInvitation], [mockWorkspace]])
    vi.mocked(hasWorkspaceAdminAccess).mockResolvedValue(true)

    const mockUpdateWhere = vi.fn().mockResolvedValue({ rowCount: 1 })
    const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
    vi.mocked(db.update).mockReturnValue({ set: mockUpdateSet } as any)

    vi.mocked(sendWorkspaceInvitationEmail).mockResolvedValue({ success: true })

    const req = new NextRequest('http://localhost/api/arenas/invitations/invitation123', {
      method: 'POST',
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'invitation123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.invitation.token).toBeTruthy()
    expect(data.invitation.token).not.toBe((mockInvitation as { token?: string }).token)
    expect(data.invitation.expiresAt).toBeTruthy()

    expect(db.update).toHaveBeenCalledWith(workspaceInvitation)
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ token: data.invitation.token })
    )
    expect(sendWorkspaceInvitationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: mockInvitation.email,
        workspaceName: mockWorkspace.name,
        token: data.invitation.token,
      })
    )
  })

  it('should still return success when the resend email fails to send', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    mockSelectSequence([[mockInvitation], [mockWorkspace]])
    vi.mocked(hasWorkspaceAdminAccess).mockResolvedValue(true)

    const mockUpdateWhere = vi.fn().mockResolvedValue({ rowCount: 1 })
    const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
    vi.mocked(db.update).mockReturnValue({ set: mockUpdateSet } as any)

    vi.mocked(sendWorkspaceInvitationEmail).mockResolvedValue({
      success: false,
      message: 'Email service not configured',
    })

    const req = new NextRequest('http://localhost/api/arenas/invitations/invitation123', {
      method: 'POST',
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'invitation123' }) })

    expect(response.status).toBe(200)
    expect((await response.json()).success).toBe(true)
  })

  it('should return 500 when database error occurs', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      then: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    }
    vi.mocked(db.select).mockReturnValue(mockQuery as any)

    const req = new NextRequest('http://localhost/api/arenas/invitations/invitation123', {
      method: 'POST',
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'invitation123' }) })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Failed to resend invitation' })
  })
})
