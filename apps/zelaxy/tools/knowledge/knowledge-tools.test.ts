/**
 * Functional tests for the Knowledge tools (search / upload_chunk / create_document).
 * Exercises the real request-builder and response-transform logic — no DB required.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { knowledgeCreateDocumentTool } from '@/tools/knowledge/create_document'
import { knowledgeSearchTool } from '@/tools/knowledge/search'
import { knowledgeUploadChunkTool } from '@/tools/knowledge/upload_chunk'

const jsonResponse = (body: any, ok = true, status = 200) =>
  ({ ok, status, json: async () => body }) as unknown as Response

describe('knowledge_search tool', () => {
  it('posts to the search endpoint', () => {
    expect((knowledgeSearchTool.request.url as any)({})).toBe('/api/knowledge/search')
    expect(knowledgeSearchTool.request.method).toBe('POST')
  })

  it('wraps the knowledge base id and forwards the workflow id from context', () => {
    const body: any = knowledgeSearchTool.request.body!({
      knowledgeBaseId: 'kb-1',
      query: 'hello',
      _context: { workflowId: 'wf-1' },
    })
    expect(body.knowledgeBaseIds).toEqual(['kb-1'])
    expect(body.query).toBe('hello')
    expect(body.workflowId).toBe('wf-1')
  })

  it('clamps topK to 1..100 and defaults to 10', () => {
    expect(
      (knowledgeSearchTool.request.body!({ knowledgeBaseId: 'k', topK: 500 }) as any).topK
    ).toBe(100)
    expect((knowledgeSearchTool.request.body!({ knowledgeBaseId: 'k', topK: 3 }) as any).topK).toBe(
      3
    )
    expect((knowledgeSearchTool.request.body!({ knowledgeBaseId: 'k' }) as any).topK).toBe(10)
  })

  it('groups tag filters by name with OR semantics', () => {
    const body: any = knowledgeSearchTool.request.body!({
      knowledgeBaseId: 'k',
      tagFilters: [
        { tagName: 'author', tagValue: 'me' },
        { tagName: 'author', tagValue: 'you' },
        { tagName: 'year', tagValue: '2026' },
      ],
    })
    expect(body.filters.author).toBe('me|OR|you')
    expect(body.filters.year).toBe('2026')
  })

  it('transforms the search response', async () => {
    const out = await knowledgeSearchTool.transformResponse!(
      jsonResponse({ data: { results: [{ id: 'r1' }], query: 'hi', totalResults: 1 } }),
      {} as any
    )
    expect(out.success).toBe(true)
    expect(out.output.results).toHaveLength(1)
    expect(out.output.totalResults).toBe(1)
  })
})

describe('knowledge_upload_chunk tool', () => {
  it('targets the chunks endpoint for the given kb + document', () => {
    const url = (knowledgeUploadChunkTool.request.url as any)({
      knowledgeBaseId: 'kb-1',
      documentId: 'doc-1',
    })
    expect(url).toBe('/api/knowledge/kb-1/documents/doc-1/chunks')
    expect(knowledgeUploadChunkTool.request.method).toBe('POST')
  })

  it('builds an enabled chunk body with content', () => {
    const body: any = knowledgeUploadChunkTool.request.body!({
      content: 'chunk text',
      _context: { workflowId: 'wf-1' },
    })
    expect(body.content).toBe('chunk text')
    expect(body.enabled).toBe(true)
    expect(body.workflowId).toBe('wf-1')
  })
})

describe('knowledge_create_document tool', () => {
  it('targets the documents endpoint', () => {
    expect((knowledgeCreateDocumentTool.request.url as any)({ knowledgeBaseId: 'kb-1' })).toBe(
      '/api/knowledge/kb-1/documents'
    )
  })

  it('rejects an empty document name', () => {
    expect(() => knowledgeCreateDocumentTool.request.body!({ name: '   ', content: 'x' })).toThrow(
      /name is required/
    )
  })

  it('rejects invalid filename characters', () => {
    expect(() =>
      knowledgeCreateDocumentTool.request.body!({ name: 'bad/name', content: 'x' })
    ).toThrow(/invalid characters/)
  })

  it('rejects empty content', () => {
    expect(() => knowledgeCreateDocumentTool.request.body!({ name: 'ok', content: '   ' })).toThrow(
      /content cannot be empty/
    )
  })

  it('base64-encodes valid content into a data URI', () => {
    const body: any = knowledgeCreateDocumentTool.request.body!({
      name: 'My Doc',
      content: 'hello world',
    })
    expect(JSON.stringify(body)).toContain('data:text/plain;base64,')
  })
})
