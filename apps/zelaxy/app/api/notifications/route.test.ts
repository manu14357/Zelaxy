import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { state, updateWhereMock } = vi.hoisted(() => ({
  state: { listRows: [] as any[], countRows: [{ value: 0 }] as any[] },
  updateWhereMock: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/auth', () => ({ getSession: vi.fn() }))

vi.mock('@/db', () => {
  // A thenable chain: the list query resolves at .limit(); the count query
  // awaits the chain directly after .where().
  const chain: any = {
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve(state.listRows),
    then: (res: any, rej: any) => Promise.resolve(state.countRows).then(res, rej),
  }
  return {
    db: {
      select: () => chain,
      update: () => ({ set: () => ({ where: updateWhereMock }) }),
    },
  }
})

vi.mock('@/lib/logs/console/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { getSession } from '@/lib/auth'
import { GET, PATCH } from './route'

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.listRows = []
    state.countRows = [{ value: 0 }]
  })

  it('rejects unauthenticated requests', async () => {
    ;(getSession as any).mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/notifications'))
    expect(res.status).toBe(401)
  })

  it('returns the user notifications plus the unread count', async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
    state.listRows = [
      { id: 'n1', type: 'usage_alert', title: '80%', message: 'x', read: false },
      { id: 'n2', type: 'usage_alert', title: '50%', message: 'y', read: true },
    ]
    state.countRows = [{ value: 1 }]

    const res = await GET(new NextRequest('http://localhost/api/notifications'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.notifications).toHaveLength(2)
    expect(body.unreadCount).toBe(1)
    expect(body.total).toBe(2)
  })
})

describe('PATCH /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    ;(getSession as any).mockResolvedValue(null)
    const res = await PATCH(
      new NextRequest('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ markAllRead: true }),
      })
    )
    expect(res.status).toBe(401)
  })

  it('marks all read', async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
    const res = await PATCH(
      new NextRequest('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ markAllRead: true }),
      })
    )
    expect(res.status).toBe(200)
    expect(updateWhereMock).toHaveBeenCalledTimes(1)
  })

  it('marks specific ids read', async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
    const res = await PATCH(
      new NextRequest('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationIds: ['n1', 'n2'] }),
      })
    )
    expect(res.status).toBe(200)
    expect(updateWhereMock).toHaveBeenCalledTimes(1)
  })

  it('rejects a request with neither ids nor markAllRead', async () => {
    ;(getSession as any).mockResolvedValue({ user: { id: 'user_1' } })
    const res = await PATCH(
      new NextRequest('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({}),
      })
    )
    expect(res.status).toBe(400)
    expect(updateWhereMock).not.toHaveBeenCalled()
  })
})
