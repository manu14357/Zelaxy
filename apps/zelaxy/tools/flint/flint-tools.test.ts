/**
 * Request-builder tests for the Flint tools — asserts each operation's endpoint,
 * method, headers, body building, and response transform without network calls.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { flintCreateTaskTool } from '@/tools/flint/create_task'
import { flintGeneratePagesTool } from '@/tools/flint/generate_pages'
import { flintGetTaskTool } from '@/tools/flint/get_task'

const jsonResponse = (data: unknown): Response =>
  ({ json: async () => data }) as unknown as Response

describe('Flint tools', () => {
  describe('flint_create_task', () => {
    it('builds a POST to the agent tasks endpoint with a bearer header', () => {
      expect(flintCreateTaskTool.id).toBe('flint_create_task')
      expect(flintCreateTaskTool.request.method).toBe('POST')
      const url =
        typeof flintCreateTaskTool.request.url === 'function'
          ? (flintCreateTaskTool.request.url as any)({})
          : flintCreateTaskTool.request.url
      expect(String(url)).toBe('https://app.tryflint.com/api/v1/agent/tasks')
      const headers = (flintCreateTaskTool.request.headers as any)({ apiKey: '  ak_test  ' })
      expect(headers.Authorization).toBe('Bearer ak_test')
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('omits unset optional body fields via filterUndefined', () => {
      const body = (flintCreateTaskTool.request.body as any)({
        apiKey: 'ak_test',
        siteId: 'site_1',
        prompt: 'Add an About page',
      })
      expect(body).toEqual({ siteId: 'site_1', prompt: 'Add an About page' })
      expect('callbackUrl' in body).toBe(false)
      expect('publish' in body).toBe(false)
    })

    it('keeps an explicit publish=false in the body', () => {
      const body = (flintCreateTaskTool.request.body as any)({
        apiKey: 'ak_test',
        siteId: 'site_1',
        prompt: 'x',
        publish: false,
      })
      expect(body.publish).toBe(false)
    })

    it('transformResponse returns the created task fields', async () => {
      const res = await (flintCreateTaskTool.transformResponse as any)(
        jsonResponse({ taskId: 'bg-1', status: 'running', createdAt: '2026-01-01T00:00:00Z' })
      )
      expect(res.success).toBe(true)
      expect(res.output).toEqual({
        taskId: 'bg-1',
        status: 'running',
        createdAt: '2026-01-01T00:00:00Z',
      })
    })

    it('transformResponse throws when no taskId is returned', async () => {
      await expect(
        (flintCreateTaskTool.transformResponse as any)(jsonResponse({ error: 'bad key' }))
      ).rejects.toThrow('bad key')
    })
  })

  describe('flint_generate_pages', () => {
    it('builds the body with the generate_pages command and parsed items', () => {
      expect(flintGeneratePagesTool.id).toBe('flint_generate_pages')
      const body = (flintGeneratePagesTool.request.body as any)({
        apiKey: 'ak_test',
        siteId: 'site_1',
        templatePageSlug: '/case-studies/template',
        items: '[{"targetPageSlug":"/case-studies/acme","context":"Acme Corp"}]',
      })
      expect(body.command).toBe('generate_pages')
      expect(body.templatePageSlug).toBe('/case-studies/template')
      expect(body.items).toEqual([{ targetPageSlug: '/case-studies/acme', context: 'Acme Corp' }])
    })

    it('accepts an already-structured items array', () => {
      const body = (flintGeneratePagesTool.request.body as any)({
        apiKey: 'ak_test',
        siteId: 'site_1',
        templatePageSlug: '/t',
        items: [{ targetPageSlug: '/a', context: 'c' }],
      })
      expect(body.items).toEqual([{ targetPageSlug: '/a', context: 'c' }])
    })

    it('rejects invalid JSON in items', () => {
      expect(() =>
        (flintGeneratePagesTool.request.body as any)({
          apiKey: 'ak_test',
          siteId: 'site_1',
          templatePageSlug: '/t',
          items: 'not json',
        })
      ).toThrow('Invalid JSON in items parameter')
    })

    it('rejects an empty items array', () => {
      expect(() =>
        (flintGeneratePagesTool.request.body as any)({
          apiKey: 'ak_test',
          siteId: 'site_1',
          templatePageSlug: '/t',
          items: '[]',
        })
      ).toThrow('non-empty JSON array')
    })

    it('rejects more than 10 items', () => {
      const items = Array.from({ length: 11 }, (_, i) => ({
        targetPageSlug: `/p-${i}`,
        context: 'c',
      }))
      expect(() =>
        (flintGeneratePagesTool.request.body as any)({
          apiKey: 'ak_test',
          siteId: 'site_1',
          templatePageSlug: '/t',
          items,
        })
      ).toThrow('at most 10 pages')
    })

    it('rejects items missing required string fields', () => {
      expect(() =>
        (flintGeneratePagesTool.request.body as any)({
          apiKey: 'ak_test',
          siteId: 'site_1',
          templatePageSlug: '/t',
          items: '[{"targetPageSlug":"/a"}]',
        })
      ).toThrow('targetPageSlug and context')
    })
  })

  describe('flint_get_task', () => {
    it('builds a GET to the task-by-id endpoint', () => {
      expect(flintGetTaskTool.id).toBe('flint_get_task')
      expect(flintGetTaskTool.request.method).toBe('GET')
      const url = (flintGetTaskTool.request.url as any)({ taskId: ' bg-1 ' })
      expect(url).toBe('https://app.tryflint.com/api/v1/agent/tasks/bg-1')
    })

    it('normalizes page arrays and defaults missing arrays to empty', async () => {
      const res = await (flintGetTaskTool.transformResponse as any)(
        jsonResponse({
          taskId: 'bg-1',
          status: 'completed',
          output: {
            pagesCreated: [{ slug: '/about', previewUrl: 'https://p', editUrl: 5 }],
          },
        })
      )
      expect(res.output.pagesCreated).toEqual([
        { slug: '/about', previewUrl: 'https://p', editUrl: null, publishedUrl: null },
      ])
      expect(res.output.pagesModified).toEqual([])
      expect(res.output.pagesDeleted).toEqual([])
      expect(res.output.errorMessage).toBeNull()
    })

    it('surfaces the error message on a failed task', async () => {
      const res = await (flintGetTaskTool.transformResponse as any)(
        jsonResponse({ taskId: 'bg-1', status: 'failed', errorMessage: 'boom' })
      )
      expect(res.output.status).toBe('failed')
      expect(res.output.errorMessage).toBe('boom')
    })
  })
})
