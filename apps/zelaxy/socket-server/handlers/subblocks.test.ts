/**
 * Unit tests for server-side 25ms coalescing of subblock updates.
 *
 * Verifies the hot-path invariants: a burst of rapid keystrokes collapses to ONE persist + ONE
 * broadcast, the broadcast excludes EVERY coalesced sender, and EVERY queued operationId receives
 * exactly one confirm-or-fail.
 *
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// --- Mocks (declared before importing the handler under test) ---------------------------------

vi.mock('drizzle-orm', () => ({
  and: (...args: any[]) => args,
  eq: (...args: any[]) => args,
}))

vi.mock('@/db/schema', () => ({
  workflow: { id: 'workflow.id' },
  workflowBlocks: { id: 'blocks.id', subBlocks: 'blocks.subBlocks', workflowId: 'blocks.wfId' },
}))

// Hoisted so the vi.mock factories (also hoisted) can reference these stubs.
const { dbMock, txMock, resolveCurrentWorkflowRole } = vi.hoisted(() => {
  // Chainable, awaitable query-builder stub. Every method returns itself; awaiting resolves `value`.
  function chain(value: any) {
    const obj: any = {}
    for (const m of ['from', 'where', 'limit', 'for', 'set', 'values', 'returning', 'orderBy']) {
      obj[m] = () => obj
    }
    obj.then = (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject)
    return obj
  }

  const tx = {
    select: vi.fn(() => chain([{ subBlocks: {} }])), // block row (FOR UPDATE)
    update: vi.fn(() => chain([])),
  }
  const database = {
    select: vi.fn(() => chain([{ id: 'wf-1' }])), // workflow-exists check
    transaction: vi.fn(async (fn: any) => fn(tx)),
  }
  return {
    dbMock: database,
    txMock: tx,
    resolveCurrentWorkflowRole: vi.fn().mockResolvedValue('write'),
  }
})

vi.mock('@/db', () => ({ db: dbMock }))

vi.mock('@/socket-server/middleware/permissions', () => ({
  resolveCurrentWorkflowRole: (...args: any[]) => resolveCurrentWorkflowRole(...args),
}))

import {
  flushPendingSubblocksForSocket,
  setupSubblocksHandlers,
} from '@/socket-server/handlers/subblocks'
import { cleanupRateLimiter } from '@/socket-server/middleware/rate-limit'

// --- Test harness -----------------------------------------------------------------------------

const WORKFLOW_ID = 'wf-1'

interface EmittedRecord {
  to: string
  except?: string[]
  event: string
  payload: any
}

let emitted: EmittedRecord[]
let roomManager: any

function makeIo() {
  return {
    to: vi.fn((target: string) => ({
      except: (ex: string[]) => ({
        emit: (event: string, payload: any) =>
          emitted.push({ to: target, except: ex, event, payload }),
      }),
      emit: (event: string, payload: any) => emitted.push({ to: target, event, payload }),
    })),
  }
}

function makeSocket(id: string) {
  const handlers: Record<string, (data: any) => any> = {}
  const socket: any = {
    id,
    emit: vi.fn(),
    conn: { on: vi.fn() },
    on: vi.fn((event: string, fn: any) => {
      handlers[event] = fn
    }),
    _handlers: handlers,
  }
  return socket
}

function registerSocket(id: string) {
  const socket = makeSocket(id)
  setupSubblocksHandlers(socket, roomManager)
  return { socket, handle: socket._handlers['subblock-update'] }
}

beforeEach(() => {
  emitted = []
  resolveCurrentWorkflowRole.mockResolvedValue('write')
  dbMock.select.mockClear()
  dbMock.transaction.mockClear()
  txMock.select.mockClear()
  txMock.update.mockClear()
  roomManager = {
    getWorkflowIdForSocket: () => WORKFLOW_ID,
    getUserSession: (sid: string) => ({ userId: `user-${sid}`, userName: sid, role: 'write' }),
    getWorkflowRoom: () => ({ users: new Map() }),
    io: makeIo(),
  }
})

afterEach(() => {
  vi.useRealTimers()
})

describe('subblock-update coalescing', () => {
  it('collapses a burst into ONE persist + ONE broadcast and confirms every op', async () => {
    vi.useFakeTimers()
    const { socket, handle } = registerSocket('sock-A')

    for (let i = 0; i < 5; i++) {
      await handle({
        blockId: 'b1',
        subblockId: 's1',
        value: `v${i}`,
        timestamp: 1000 + i,
        operationId: `op-${i}`,
      })
    }

    // Nothing persisted yet — still inside the coalesce window.
    expect(dbMock.transaction).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(30)

    // Exactly one persist for the whole burst.
    expect(dbMock.transaction).toHaveBeenCalledTimes(1)
    // FOR UPDATE row lock is exercised inside the transaction.
    expect(txMock.select).toHaveBeenCalledTimes(1)

    // Exactly one broadcast, carrying the LATEST value, excluding the sender.
    const broadcasts = emitted.filter((e) => e.event === 'subblock-update')
    expect(broadcasts).toHaveLength(1)
    expect(broadcasts[0].payload.value).toBe('v4')
    expect(broadcasts[0].except).toContain('sock-A')

    // Every queued operationId confirmed exactly once.
    const confirms = emitted
      .filter((e) => e.event === 'operation-confirmed')
      .map((e) => e.payload.operationId)
      .sort()
    expect(confirms).toEqual(['op-0', 'op-1', 'op-2', 'op-3', 'op-4'])

    cleanupRateLimiter(socket.id)
  })

  it('excludes ALL coalesced senders from the broadcast, not just the last', async () => {
    vi.useFakeTimers()
    const a = registerSocket('sock-A')
    const b = registerSocket('sock-B')

    await a.handle({
      blockId: 'b2',
      subblockId: 's2',
      value: 'a',
      timestamp: 1,
      operationId: 'opA',
    })
    await b.handle({
      blockId: 'b2',
      subblockId: 's2',
      value: 'b',
      timestamp: 2,
      operationId: 'opB',
    })

    await vi.advanceTimersByTimeAsync(30)

    const broadcast = emitted.find((e) => e.event === 'subblock-update' && e.to === WORKFLOW_ID)
    expect(broadcast).toBeDefined()
    expect(broadcast?.except).toEqual(expect.arrayContaining(['sock-A', 'sock-B']))

    const confirms = emitted
      .filter((e) => e.event === 'operation-confirmed')
      .map((e) => e.payload.operationId)
      .sort()
    expect(confirms).toEqual(['opA', 'opB'])

    cleanupRateLimiter('sock-A')
    cleanupRateLimiter('sock-B')
  })

  it('rejects a read-only user BEFORE enqueue (no persist, retryable:false)', async () => {
    resolveCurrentWorkflowRole.mockResolvedValue('read')
    vi.useFakeTimers()
    const { socket, handle } = registerSocket('sock-RO')

    await handle({
      blockId: 'b3',
      subblockId: 's3',
      value: 'x',
      timestamp: 1,
      operationId: 'op-ro',
    })
    await vi.advanceTimersByTimeAsync(30)

    expect(dbMock.transaction).not.toHaveBeenCalled()
    expect(socket.emit).toHaveBeenCalledWith('operation-failed', {
      operationId: 'op-ro',
      error: expect.any(String),
      retryable: false,
    })

    cleanupRateLimiter(socket.id)
  })

  it('flushes a disconnecting socket buffered edits immediately', async () => {
    vi.useFakeTimers()
    const { socket, handle } = registerSocket('sock-D')

    await handle({
      blockId: 'b4',
      subblockId: 's4',
      value: 'draft',
      timestamp: 9,
      operationId: 'op-d',
    })
    expect(dbMock.transaction).not.toHaveBeenCalled()

    // Disconnect path drains the buffer without waiting for the 25ms timer.
    await flushPendingSubblocksForSocket('sock-D', roomManager)

    expect(dbMock.transaction).toHaveBeenCalledTimes(1)
    const confirms = emitted.filter((e) => e.event === 'operation-confirmed')
    expect(confirms.map((e) => e.payload.operationId)).toEqual(['op-d'])

    cleanupRateLimiter(socket.id)
  })

  it('fails all queued ops (retryable) when the persist throws', async () => {
    vi.useFakeTimers()
    dbMock.transaction.mockRejectedValueOnce(new Error('db down'))
    const { socket, handle } = registerSocket('sock-E')

    await handle({
      blockId: 'b5',
      subblockId: 's5',
      value: 'z',
      timestamp: 3,
      operationId: 'op-e',
    })
    await vi.advanceTimersByTimeAsync(30)

    const fails = emitted.filter((e) => e.event === 'operation-failed')
    expect(fails).toHaveLength(1)
    expect(fails[0].payload).toMatchObject({ operationId: 'op-e', retryable: true })

    cleanupRateLimiter(socket.id)
  })
})
