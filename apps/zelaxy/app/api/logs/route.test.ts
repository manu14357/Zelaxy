/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockRequest } from '@/app/api/__test-utils__/utils'

const mockGetSession = vi.fn()
const mockGetUserEntityPermissions = vi.fn()
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}

function createWorkspaceQuery(result: any[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(result),
      }),
    }),
  }
}

function createLogsQuery(result: any[]) {
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(result),
  }

  return chain
}

function createCountQuery(result: any[]) {
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(result),
  }

  return chain
}

describe('Logs API Route', () => {
  const mockSelect = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    vi.doMock('@/lib/auth', () => ({
      getSession: mockGetSession,
    }))

    vi.doMock('@/lib/permissions/utils', () => ({
      getUserEntityPermissions: mockGetUserEntityPermissions,
    }))

    vi.doMock('@/lib/logs/console/logger', () => ({
      createLogger: vi.fn(() => mockLogger),
    }))

    vi.doMock('@/db/schema', () => ({
      workflowExecutionLogs: {
        id: 'id',
        workflowId: 'workflowId',
        executionId: 'executionId',
        stateSnapshotId: 'stateSnapshotId',
        level: 'level',
        message: 'message',
        trigger: 'trigger',
        startedAt: 'startedAt',
        endedAt: 'endedAt',
        totalDurationMs: 'totalDurationMs',
        blockCount: 'blockCount',
        successCount: 'successCount',
        errorCount: 'errorCount',
        skippedCount: 'skippedCount',
        totalCost: 'totalCost',
        totalInputCost: 'totalInputCost',
        totalOutputCost: 'totalOutputCost',
        totalTokens: 'totalTokens',
        metadata: 'metadata',
        files: 'files',
        createdAt: 'createdAt',
      },
      workflow: {
        id: 'id',
        name: 'name',
        description: 'description',
        color: 'color',
        folderId: 'folderId',
        userId: 'userId',
        workspaceId: 'workspaceId',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
      workspace: {
        id: 'id',
        ownerId: 'ownerId',
      },
    }))

    vi.doMock('@/db', () => ({
      db: {
        select: mockSelect,
      },
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('allows workspace owners to fetch logs without an explicit permissions row', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } })
    mockGetUserEntityPermissions.mockResolvedValue(null)

    const logRow = {
      id: 'log-1',
      workflowId: 'workflow-1',
      executionId: 'execution-1',
      stateSnapshotId: null,
      level: 'info',
      message: 'Execution completed',
      trigger: 'manual',
      startedAt: new Date('2026-04-12T10:00:00.000Z'),
      endedAt: new Date('2026-04-12T10:00:01.000Z'),
      totalDurationMs: 1000,
      blockCount: 1,
      successCount: 1,
      errorCount: 0,
      skippedCount: 0,
      totalCost: 0,
      totalInputCost: 0,
      totalOutputCost: 0,
      totalTokens: 0,
      metadata: {},
      files: null,
      createdAt: new Date('2026-04-12T10:00:00.000Z'),
      workflowName: 'Workflow One',
      workflowDescription: null,
      workflowColor: '#000000',
      workflowFolderId: null,
      workflowUserId: 'user-123',
      workflowWorkspaceId: 'workspace-123',
      workflowCreatedAt: new Date('2026-04-12T09:00:00.000Z'),
      workflowUpdatedAt: new Date('2026-04-12T09:30:00.000Z'),
    }

    mockSelect
      .mockImplementationOnce(() =>
        createWorkspaceQuery([{ id: 'workspace-123', ownerId: 'user-123' }])
      )
      .mockImplementationOnce(() => createLogsQuery([logRow]))
      .mockImplementationOnce(() => createCountQuery([{ count: 1 }]))

    const request = createMockRequest('GET')
    Object.defineProperty(request, 'url', {
      value: 'http://localhost:3000/api/logs?workspaceId=workspace-123&includeWorkflow=true',
    })

    const { GET } = await import('@/app/api/logs/route')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.total).toBe(1)
    expect(data.data[0]).toMatchObject({
      id: 'log-1',
      workflowId: 'workflow-1',
      message: 'Execution completed',
    })
    expect(mockGetUserEntityPermissions).not.toHaveBeenCalled()
  })

  it('returns 403 when the user has no access to the workspace', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } })
    mockGetUserEntityPermissions.mockResolvedValue(null)

    mockSelect.mockImplementationOnce(() =>
      createWorkspaceQuery([{ id: 'workspace-123', ownerId: 'owner-999' }])
    )

    const request = createMockRequest('GET')
    Object.defineProperty(request, 'url', {
      value: 'http://localhost:3000/api/logs?workspaceId=workspace-123',
    })

    const { GET } = await import('@/app/api/logs/route')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data).toMatchObject({ error: 'Access denied to this workspace' })
    expect(mockGetUserEntityPermissions).toHaveBeenCalledWith(
      'user-123',
      'workspace',
      'workspace-123'
    )
  })
})
