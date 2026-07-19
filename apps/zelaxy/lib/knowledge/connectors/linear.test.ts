import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() }),
}))

const refreshAccessTokenIfNeeded = vi.fn()
vi.mock('@/app/api/auth/oauth/utils', () => ({
  refreshAccessTokenIfNeeded: (...args: any[]) => refreshAccessTokenIfNeeded(...args),
}))

import { linearConnector } from './linear'
import type { GetDocumentContext, ListDocumentsContext } from './types'

const fetchMock = vi.fn()
;(global as any).fetch = (...args: any[]) => fetchMock(...args)

function jsonResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  }
}

const baseListCtx: Omit<ListDocumentsContext, 'cursor'> = {
  config: { credentialId: 'cred-1' },
  credential: null,
  createdBy: 'user-1',
  auth: { token: null },
}

beforeEach(() => {
  refreshAccessTokenIfNeeded.mockReset()
  fetchMock.mockReset()
  refreshAccessTokenIfNeeded.mockResolvedValue('access-token-abc')
})

describe('linearConnector definition', () => {
  it('declares the new paginated contract with oauth auth', () => {
    expect(linearConnector.type).toBe('linear')
    expect(typeof linearConnector.listDocuments).toBe('function')
    expect(typeof linearConnector.getDocument).toBe('function')
    expect(linearConnector.fetchDocuments).toBeUndefined()
    expect(linearConnector.auth).toEqual({
      type: 'oauth',
      provider: 'linear',
      credentialField: 'credentialId',
    })
  })
})

describe('linearConnector.listDocuments', () => {
  it('resolves the OAuth token via createdBy + config credentialId and maps issue refs', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          issues: {
            pageInfo: { hasNextPage: true, endCursor: 'cursor-2' },
            nodes: [
              {
                id: 'issue-1',
                identifier: 'ENG-1',
                title: 'Fix bug',
                url: 'https://linear.app/x/issue/ENG-1',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ],
          },
        },
      })
    )

    const result = await linearConnector.listDocuments!(baseListCtx)

    // createdBy is passed as the userId to the OAuth refresh helper; credentialId from config.
    expect(refreshAccessTokenIfNeeded).toHaveBeenCalledWith('cred-1', 'user-1', expect.any(String))

    expect(result.nextCursor).toBe('cursor-2')
    expect(result.documents).toHaveLength(1)
    expect(result.documents[0]).toMatchObject({
      externalId: 'issue-1',
      filename: 'ENG-1 Fix bug',
      sourceUrl: 'https://linear.app/x/issue/ENG-1',
      contentHash: '2026-01-01T00:00:00.000Z',
    })

    // Bearer token from the refreshed credential is used.
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer access-token-abc')
  })

  it('applies a team filter when teamId is in config and returns null cursor on last page', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          issues: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [],
          },
        },
      })
    )

    const result = await linearConnector.listDocuments!({
      ...baseListCtx,
      config: { credentialId: 'cred-1', teamId: 'team-42' },
    })

    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(init.body)
    expect(body.variables.filter).toEqual({ team: { id: { eq: 'team-42' } } })
    expect(result.nextCursor).toBeNull()
    expect(result.documents).toEqual([])
  })

  it('throws when credentialId is missing (no token fetch attempted)', async () => {
    await expect(linearConnector.listDocuments!({ ...baseListCtx, config: {} })).rejects.toThrow(
      /credentialId/
    )
    expect(refreshAccessTokenIfNeeded).not.toHaveBeenCalled()
  })

  it('throws when createdBy is missing', async () => {
    await expect(
      linearConnector.listDocuments!({ ...baseListCtx, createdBy: null })
    ).rejects.toThrow(/createdBy/)
  })

  it('throws when the OAuth token cannot be resolved', async () => {
    refreshAccessTokenIfNeeded.mockResolvedValueOnce(null)
    await expect(linearConnector.listDocuments!(baseListCtx)).rejects.toThrow(/access token/)
  })

  it('throws on a Linear GraphQL error payload', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ errors: [{ message: 'Rate limited' }] }))
    await expect(linearConnector.listDocuments!(baseListCtx)).rejects.toThrow(/Rate limited/)
  })

  it('throws on a non-ok HTTP response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'nope' }, false, 500))
    await expect(linearConnector.listDocuments!(baseListCtx)).rejects.toThrow(/500/)
  })
})

describe('linearConnector.getDocument', () => {
  it('fetches full issue content and builds heading + body', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          issue: {
            id: 'issue-1',
            identifier: 'ENG-1',
            title: 'Fix bug',
            description: 'Steps to reproduce...',
            url: 'https://linear.app/x/issue/ENG-1',
            updatedAt: '2026-02-02T00:00:00.000Z',
          },
        },
      })
    )

    const ctx: GetDocumentContext = {
      config: { credentialId: 'cred-1' },
      credential: null,
      createdBy: 'user-1',
      auth: { token: null },
      ref: { externalId: 'issue-1', filename: 'ENG-1 Fix bug', contentHash: 'old' },
    }

    const resolved = await linearConnector.getDocument!(ctx)
    expect(resolved.content).toBe('ENG-1: Fix bug\n\nSteps to reproduce...')
    expect(resolved.contentHash).toBe('2026-02-02T00:00:00.000Z')
    expect(resolved.sourceUrl).toBe('https://linear.app/x/issue/ENG-1')

    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(init.body).variables.id).toBe('issue-1')
  })

  it('throws when the issue is not found', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { issue: null } }))
    const ctx: GetDocumentContext = {
      config: { credentialId: 'cred-1' },
      credential: null,
      createdBy: 'user-1',
      auth: { token: null },
      ref: { externalId: 'missing', filename: 'x' },
    }
    await expect(linearConnector.getDocument!(ctx)).rejects.toThrow(/not found/)
  })
})
