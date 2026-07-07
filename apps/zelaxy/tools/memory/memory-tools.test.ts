/**
 * Functional tests for the Memory tools (add / get / get_all / delete).
 * Exercises the real request-builder logic — no DB required.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { memoryAddTool } from '@/tools/memory/add'
import { memoryDeleteTool } from '@/tools/memory/delete'
import { memoryGetTool } from '@/tools/memory/get'

const ctx = (workflowId?: string) => ({ _context: workflowId ? { workflowId } : undefined })

describe('memory_add tool', () => {
  it('posts to the memory endpoint', () => {
    expect(memoryAddTool.request.url).toBe('/api/memory')
    expect(memoryAddTool.request.method).toBe('POST')
  })

  it('returns a 400 error response when no workflow id is in context', () => {
    const body: any = memoryAddTool.request.body!({ id: 'k', role: 'user', content: 'hi' })
    expect(body._errorResponse.status).toBe(400)
  })

  it('returns a 400 error response when role or content is missing', () => {
    const body: any = memoryAddTool.request.body!({ id: 'k', ...ctx('wf-1') })
    expect(body._errorResponse.status).toBe(400)
    expect(body._errorResponse.data.error.message).toMatch(/role and content/)
  })

  it('builds an agent-typed memory body for a valid message', () => {
    const body: any = memoryAddTool.request.body!({
      id: 'k1',
      role: 'user',
      content: 'remember this',
      ...ctx('wf-1'),
    })
    expect(body.key).toBe('k1')
    expect(body.type).toBe('agent')
    expect(body.workflowId).toBe('wf-1')
    expect(body.data).toEqual({ role: 'user', content: 'remember this' })
  })
})

describe('memory_get tool', () => {
  it('returns a 400 error response without a workflow id', () => {
    const url: any = (memoryGetTool.request.url as any)({ id: 'k1' })
    expect(url._errorResponse.status).toBe(400)
  })

  it('builds a GET url with workflowId, limit and sortOrder', () => {
    const url = (memoryGetTool.request.url as any)({
      id: 'k 1',
      limit: '5',
      sortOrder: 'desc',
      ...ctx('wf-1'),
    })
    expect(url).toContain('/api/memory/k%201?')
    const qs = new URLSearchParams(url.split('?')[1])
    expect(qs.get('workflowId')).toBe('wf-1')
    expect(qs.get('limit')).toBe('5')
    expect(qs.get('sortOrder')).toBe('desc')
    expect(memoryGetTool.request.method).toBe('GET')
  })
})

describe('memory_delete tool', () => {
  it('returns a 400 error response without a workflow id', () => {
    const url: any = (memoryDeleteTool.request.url as any)({ id: 'k1' })
    expect(url._errorResponse.status).toBe(400)
  })

  it('builds a DELETE url scoped to the workflow', () => {
    const url = (memoryDeleteTool.request.url as any)({ id: 'k1', ...ctx('wf-1') })
    expect(url).toBe('/api/memory/k1?workflowId=wf-1')
    expect(memoryDeleteTool.request.method).toBe('DELETE')
  })
})
