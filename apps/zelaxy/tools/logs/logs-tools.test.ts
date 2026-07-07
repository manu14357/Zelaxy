/**
 * Functional tests for the Logs tools (query / get / get_execution).
 * Exercises the real URL-builder and response-transform logic — no DB required.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { logsGetExecutionTool, logsGetTool, logsQueryTool } from '@/tools/logs'

const jsonResponse = (body: any, ok = true, status = 200) =>
  ({ ok, status, json: async () => body }) as unknown as Response

describe('logs_query tool', () => {
  it('requires a workspaceId in execution context', () => {
    expect(() => (logsQueryTool.request.url as any)({})).toThrow(/workspaceId is required/)
  })

  it('builds a query string from the provided filters', () => {
    const url = (logsQueryTool.request.url as any)({
      _context: { workspaceId: 'ws-1' },
      workflowIds: 'wf-1,wf-2',
      level: 'error',
      limit: 25,
      search: 'boom',
    })
    expect(url.startsWith('/api/logs?')).toBe(true)
    const qs = new URLSearchParams(url.split('?')[1])
    expect(qs.get('workspaceId')).toBe('ws-1')
    expect(qs.get('workflowIds')).toBe('wf-1,wf-2')
    expect(qs.get('level')).toBe('error')
    expect(qs.get('limit')).toBe('25')
    expect(qs.get('search')).toBe('boom')
  })

  it("omits level when it is 'all'", () => {
    const url = (logsQueryTool.request.url as any)({
      _context: { workspaceId: 'ws-1' },
      level: 'all',
    })
    expect(new URLSearchParams(url.split('?')[1]).has('level')).toBe(false)
  })

  it('transforms the query response into logs + nextCursor', async () => {
    const out = await logsQueryTool.transformResponse!(
      jsonResponse({ data: [{ id: 'l1' }], nextCursor: 'c2' }),
      {} as any
    )
    expect(out.success).toBe(true)
    expect(out.output.logs).toHaveLength(1)
    expect(out.output.nextCursor).toBe('c2')
  })

  it('throws when the query response is not ok', async () => {
    await expect(
      logsQueryTool.transformResponse!(jsonResponse({ error: 'nope' }, false, 500), {} as any)
    ).rejects.toThrow(/nope/)
  })
})

describe('logs_get tool', () => {
  it('requires a workspaceId and encodes the log id', () => {
    expect(() => (logsGetTool.request.url as any)({ id: 'x' })).toThrow(/workspaceId is required/)
    const url = (logsGetTool.request.url as any)({ id: 'a/b', _context: { workspaceId: 'ws-1' } })
    expect(url).toContain('/api/logs/a%2Fb?')
    expect(url).toContain('workspaceId=ws-1')
  })

  it('transforms into a single log', async () => {
    const out = await logsGetTool.transformResponse!(
      jsonResponse({ data: { id: 'l1' } }),
      {} as any
    )
    expect(out.output.log).toEqual({ id: 'l1' })
  })
})

describe('logs_get_execution tool', () => {
  it('targets the execution endpoint with an encoded id', () => {
    expect((logsGetExecutionTool.request.url as any)({ executionId: 'e 1' })).toBe(
      '/api/logs/execution/e%201'
    )
  })

  it('returns the execution payload and throws on non-ok', async () => {
    const out = await logsGetExecutionTool.transformResponse!(
      jsonResponse({ executionId: 'e1', workflowId: 'wf1' }),
      {} as any
    )
    expect(out.output.executionId).toBe('e1')
    await expect(
      logsGetExecutionTool.transformResponse!(jsonResponse({ error: 'bad' }, false, 404), {} as any)
    ).rejects.toThrow(/bad/)
  })
})
