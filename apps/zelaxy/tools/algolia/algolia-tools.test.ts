/**
 * Request-builder tests for the Algolia tools — asserts each operation's endpoint,
 * method, params and response transform without making network calls.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { algoliaDeleteDocumentTool } from '@/tools/algolia/delete_document'
import { algoliaGetDocumentTool } from '@/tools/algolia/get_document'
import { algoliaIndexDocumentTool } from '@/tools/algolia/index_document'
import { algoliaSearchTool } from '@/tools/algolia/search'
import { algoliaUpdateDocumentTool } from '@/tools/algolia/update_document'

const P: any = {
  accessToken: 't',
  apiKey: 'k',
  secretKey: 's',
  baseId: 'b',
  tableId: 'tb',
  recordId: 'r',
  collectionId: 'c',
  applicationId: 'app',
  indexName: 'idx',
  objectID: 'o',
  datasetId: 'd',
  actorId: 'a',
  runId: 'run',
  awsRegion: 'us-east-1',
  region: 'us-east-1',
  queueUrl: 'https://q',
  tableName: 'T',
  userId: 'u',
  email: 'e@x.com',
  domain: 'x.com',
  query: 'q',
}

describe('Algolia tools', () => {
  it('algolia_index_document: builds its request', () => {
    expect(algoliaIndexDocumentTool.id).toBe('algolia_index_document')
    expect(algoliaIndexDocumentTool.request.method).toBeTruthy()
    const u =
      typeof algoliaIndexDocumentTool.request.url === 'function'
        ? (algoliaIndexDocumentTool.request.url as any)(P)
        : algoliaIndexDocumentTool.request.url
    expect(String(u)).toContain('.algolia.net/1/indexes')
    expect(Object.keys(algoliaIndexDocumentTool.params ?? {}).length).toBeGreaterThan(0)
    expect(algoliaIndexDocumentTool.outputs).toBeDefined()
    expect(typeof algoliaIndexDocumentTool.transformResponse).toBe('function')
  })

  it('algolia_get_document: builds its request', () => {
    expect(algoliaGetDocumentTool.id).toBe('algolia_get_document')
    expect(algoliaGetDocumentTool.request.method).toBe('GET')
    const u =
      typeof algoliaGetDocumentTool.request.url === 'function'
        ? (algoliaGetDocumentTool.request.url as any)(P)
        : algoliaGetDocumentTool.request.url
    expect(String(u)).toContain('.algolia.net/1/indexes')
    expect(Object.keys(algoliaGetDocumentTool.params ?? {}).length).toBeGreaterThan(0)
    expect(algoliaGetDocumentTool.outputs).toBeDefined()
    expect(typeof algoliaGetDocumentTool.transformResponse).toBe('function')
  })

  it('algolia_delete_document: builds its request', () => {
    expect(algoliaDeleteDocumentTool.id).toBe('algolia_delete_document')
    expect(algoliaDeleteDocumentTool.request.method).toBe('DELETE')
    const u =
      typeof algoliaDeleteDocumentTool.request.url === 'function'
        ? (algoliaDeleteDocumentTool.request.url as any)(P)
        : algoliaDeleteDocumentTool.request.url
    expect(String(u)).toContain('.algolia.net/1/indexes')
    expect(Object.keys(algoliaDeleteDocumentTool.params ?? {}).length).toBeGreaterThan(0)
    expect(algoliaDeleteDocumentTool.outputs).toBeDefined()
    expect(typeof algoliaDeleteDocumentTool.transformResponse).toBe('function')
  })

  it('algolia_update_document: builds its request', () => {
    expect(algoliaUpdateDocumentTool.id).toBe('algolia_update_document')
    expect(algoliaUpdateDocumentTool.request.method).toBe('POST')
    const u =
      typeof algoliaUpdateDocumentTool.request.url === 'function'
        ? (algoliaUpdateDocumentTool.request.url as any)(P)
        : algoliaUpdateDocumentTool.request.url
    expect(String(u)).toContain('.algolia.net/1/indexes')
    expect(Object.keys(algoliaUpdateDocumentTool.params ?? {}).length).toBeGreaterThan(0)
    expect(algoliaUpdateDocumentTool.outputs).toBeDefined()
    expect(typeof algoliaUpdateDocumentTool.transformResponse).toBe('function')
  })

  it('algolia_search: builds its request', () => {
    expect(algoliaSearchTool.id).toBe('algolia_search')
    expect(algoliaSearchTool.request.method).toBe('POST')
    const u =
      typeof algoliaSearchTool.request.url === 'function'
        ? (algoliaSearchTool.request.url as any)(P)
        : algoliaSearchTool.request.url
    expect(String(u)).toContain('.algolia.net/1/indexes')
    expect(Object.keys(algoliaSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(algoliaSearchTool.outputs).toBeDefined()
    expect(typeof algoliaSearchTool.transformResponse).toBe('function')
  })
})
