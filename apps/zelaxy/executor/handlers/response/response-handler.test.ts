/**
 * Functional tests for the Response block handler.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { BlockType } from '@/executor/consts'
import { ResponseBlockHandler } from '@/executor/handlers/response/response-handler'
import type { SerializedBlock } from '@/serializer/types'

describe('ResponseBlockHandler', () => {
  const handler = new ResponseBlockHandler()
  const block = { id: 'r1', metadata: { id: BlockType.RESPONSE } } as SerializedBlock

  it('handles only response blocks', () => {
    expect(handler.canHandle(block)).toBe(true)
    expect(handler.canHandle({ metadata: { id: 'other' } } as SerializedBlock)).toBe(false)
  })

  it('json mode: parses a JSON string body', async () => {
    const out: any = await handler.execute(block, {
      dataMode: 'json',
      data: '{"ok":true,"n":1}',
    })
    expect(out.response.data).toEqual({ ok: true, n: 1 })
    expect(out.response.status).toBe(200)
  })

  it('json mode: passes an object body through', async () => {
    const out: any = await handler.execute(block, { dataMode: 'json', data: { a: 1 } })
    expect(out.response.data).toEqual({ a: 1 })
  })

  it('structured mode: converts builderData to an object', async () => {
    const out: any = await handler.execute(block, {
      dataMode: 'structured',
      builderData: [
        { id: '1', name: 'message', type: 'string', value: 'hi' },
        { id: '2', name: 'count', type: 'number', value: '3' },
        { id: '3', name: 'done', type: 'boolean', value: 'true' },
      ],
    })
    expect(out.response.data).toEqual({ message: 'hi', count: 3, done: true })
  })

  it('clamps the status code (default 200, valid kept, invalid → 200)', async () => {
    const status = async (inputs: Record<string, any>) =>
      ((await handler.execute(block, inputs)) as any).response.status
    expect(await status({})).toBe(200)
    expect(await status({ status: '201' })).toBe(201)
    expect(await status({ status: '999' })).toBe(200)
  })

  it('always includes a default Content-Type header and merges custom ones', async () => {
    const out: any = await handler.execute(block, {
      headers: [{ id: '1', cells: { Key: 'X-Custom', Value: 'yes' } }],
    })
    expect(out.response.headers['Content-Type']).toBe('application/json')
    expect(out.response.headers['X-Custom']).toBe('yes')
  })
})
