import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession } from '@/lib/auth'
import { getUserEntityPermissions } from '@/lib/permissions/utils'
import { POST } from '@/app/api/zelaxy-arena/chats/[chatId]/fork/route'
import { db } from '@/db'

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/permissions/utils', () => ({
  getUserEntityPermissions: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}))

vi.mock('@/db/schema', () => ({
  arenaChat: {
    id: 'id',
    workspaceId: 'workspaceId',
    userId: 'userId',
    title: 'title',
    messages: 'messages',
  },
}))

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => ({ type: 'and', args })),
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
}))

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'new-chat-id'),
}))

const mockSession = {
  user: { id: 'user123', email: 'u@example.com' },
  session: { id: 's1', userId: 'user123' },
}

const sourceChat = {
  id: 'chat123',
  workspaceId: 'workspace456',
  userId: 'user123',
  title: 'Original chat',
  messages: [
    { role: 'user', content: 'a' },
    { role: 'assistant', content: 'b' },
    { role: 'user', content: 'c' },
  ],
  artifacts: [{ kind: 'workflow' }],
  consoleEntries: [{ id: 'e1' }],
}

function mockSelect(rows: any[]) {
  const q = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  }
  vi.mocked(db.select).mockReturnValue(q as any)
}

describe('POST /api/zelaxy-arena/chats/[chatId]/fork', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const makeReq = (body: unknown) =>
    new NextRequest('http://localhost/api/zelaxy-arena/chats/chat123/fork', {
      method: 'POST',
      body: JSON.stringify(body),
    })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null as any)
    const res = await POST(makeReq({ messageIndex: 1 }), {
      params: Promise.resolve({ chatId: 'chat123' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 404 when the source chat is missing (or not owned)', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession as any)
    mockSelect([])
    const res = await POST(makeReq({ messageIndex: 1 }), {
      params: Promise.resolve({ chatId: 'chat123' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 403 when the user lacks workspace permission', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession as any)
    mockSelect([sourceChat])
    vi.mocked(getUserEntityPermissions).mockResolvedValue(null)
    const res = await POST(makeReq({ messageIndex: 1 }), {
      params: Promise.resolve({ chatId: 'chat123' }),
    })
    expect(res.status).toBe(403)
    expect(getUserEntityPermissions).toHaveBeenCalledWith('user123', 'workspace', 'workspace456')
  })

  it('forks a new chat truncated at messageIndex (inclusive) for the same workspace/user', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession as any)
    mockSelect([sourceChat])
    vi.mocked(getUserEntityPermissions).mockResolvedValue('write')
    const values = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.insert).mockReturnValue({ values } as any)

    const res = await POST(makeReq({ messageIndex: 1 }), {
      params: Promise.resolve({ chatId: 'chat123' }),
    })

    expect(res).toBeInstanceOf(NextResponse)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('new-chat-id')

    const inserted = values.mock.calls[0][0]
    expect(inserted.id).toBe('new-chat-id')
    expect(inserted.workspaceId).toBe('workspace456')
    expect(inserted.userId).toBe('user123')
    // messageIndex 1 keeps messages[0..1] (inclusive) — the third message is dropped.
    expect(inserted.messages).toHaveLength(2)
    expect(inserted.title).toBe('Original chat (fork)')
    expect(inserted.artifacts).toEqual([{ kind: 'workflow' }])
    expect(inserted.consoleEntries).toEqual([{ id: 'e1' }])
  })

  it('copies the whole conversation when messageIndex is omitted', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession as any)
    mockSelect([sourceChat])
    vi.mocked(getUserEntityPermissions).mockResolvedValue('read')
    const values = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.insert).mockReturnValue({ values } as any)

    const res = await POST(makeReq({}), {
      params: Promise.resolve({ chatId: 'chat123' }),
    })

    expect(res.status).toBe(201)
    const inserted = values.mock.calls[0][0]
    expect(inserted.messages).toHaveLength(3)
  })
})
