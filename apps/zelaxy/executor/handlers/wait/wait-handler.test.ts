/**
 * Functional tests for the Wait block handler.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { BlockType } from '@/executor/consts'
import { WaitBlockHandler } from '@/executor/handlers/wait/wait-handler'
import type { ExecutionContext } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

describe('WaitBlockHandler', () => {
  const handler = new WaitBlockHandler()
  const block = { id: 'w1', metadata: { id: BlockType.WAIT } } as SerializedBlock
  const ctx = {} as ExecutionContext

  it('handles only wait blocks', () => {
    expect(handler.canHandle(block)).toBe(true)
    expect(handler.canHandle({ metadata: { id: 'other' } } as SerializedBlock)).toBe(false)
  })

  it('sync mode: sleeps for the computed duration and completes', async () => {
    // 0.01s → 10ms, well under the 5-minute synchronous cap.
    const out: any = await handler.execute(block, { timeValue: '0.01', timeUnit: 'seconds' }, ctx)
    expect(out.status).toBe('completed')
    expect(out.waitDuration).toBe(10)
    // declared block outputs must be present so downstream `<wait.waitedMs>` etc. resolve
    expect(out.waitedMs).toBe(10)
    expect(out.mode).toBe('sync')
    expect(typeof out.resumedAt).toBe('string')
  })

  it('rejects a non-positive duration', async () => {
    await expect(handler.execute(block, { timeValue: '0' }, ctx)).rejects.toThrow(/positive number/)
  })

  it('rejects an unknown unit', async () => {
    await expect(
      handler.execute(block, { timeValue: '1', timeUnit: 'fortnights' }, ctx)
    ).rejects.toThrow(/Unknown wait unit/)
  })

  it('rejects a synchronous wait longer than 5 minutes', async () => {
    await expect(
      handler.execute(block, { timeValue: '6', timeUnit: 'minutes' }, ctx)
    ).rejects.toThrow(/maximum of 5 minutes/)
  })

  it('async mode: suspends with a time pause instead of sleeping', async () => {
    const out: any = await handler.execute(
      block,
      { async: true, timeValue: '2', timeUnitLong: 'hours' },
      ctx
    )
    expect(out.status).toBe('waiting')
    expect(out.waitDuration).toBe(2 * 60 * 60 * 1000)
    expect(typeof out.resumeAt).toBe('string')
    expect(out._pauseMetadata.pauseKind).toBe('time')
    // declared block outputs
    expect(out.waitedMs).toBe(2 * 60 * 60 * 1000)
    expect(out.mode).toBe('async')
    expect(out.resumedAt).toBe(out.resumeAt)
  })

  it('async mode rejects seconds', async () => {
    await expect(
      handler.execute(block, { async: true, timeValue: '30', timeUnitLong: 'seconds' }, ctx)
    ).rejects.toThrow(/Seconds are not allowed/)
  })
})
