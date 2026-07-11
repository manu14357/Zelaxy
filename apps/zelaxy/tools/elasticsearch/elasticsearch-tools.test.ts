/**
 * Request-builder tests for the Elasticsearch tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { elasticsearchBulkTool } from '@/tools/elasticsearch/bulk'
import { elasticsearchDeleteTool } from '@/tools/elasticsearch/delete'
import { elasticsearchGetTool } from '@/tools/elasticsearch/get'
import { elasticsearchIndexTool } from '@/tools/elasticsearch/index_document'
import { elasticsearchListIndicesTool } from '@/tools/elasticsearch/list_indices'
import { elasticsearchSearchTool } from '@/tools/elasticsearch/search'

const P: any = {
  apiKey: 'k',
  baseUrl: 'https://mydspy.example.com',
  url: 'https://mycluster.es.local:9200',
  index: 'idx',
  linkId: 'l',
  domain: 'x.com',
  query: 'q',
  email: 'e@x.com',
  documentId: 'd',
  id: 'id',
  input: 'hello',
  text: 'hi',
  voiceId: 'v',
  personId: 'p',
  companyName: 'Acme',
  phone: '123',
  resultId: 'r',
  batchId: 'b',
  linkedinUrl: 'https://linkedin.com/in/x',
  name: 'n',
  fullName: 'n',
  model: 'm',
}

describe('Elasticsearch tools', () => {
  it('elasticsearch_bulk: builds its request', () => {
    expect(elasticsearchBulkTool.id).toBe('elasticsearch_bulk')
    expect(elasticsearchBulkTool.request.method).toBe('POST')
    const u =
      typeof elasticsearchBulkTool.request.url === 'function'
        ? (elasticsearchBulkTool.request.url as any)(P)
        : elasticsearchBulkTool.request.url
    expect(String(u)).toContain('mycluster.es.local')
    expect(Object.keys(elasticsearchBulkTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof elasticsearchBulkTool.transformResponse).toBe('function')
  })

  it('elasticsearch_delete: builds its request', () => {
    expect(elasticsearchDeleteTool.id).toBe('elasticsearch_delete')
    expect(elasticsearchDeleteTool.request.method).toBe('DELETE')
    const u =
      typeof elasticsearchDeleteTool.request.url === 'function'
        ? (elasticsearchDeleteTool.request.url as any)(P)
        : elasticsearchDeleteTool.request.url
    expect(String(u)).toContain('mycluster.es.local')
    expect(Object.keys(elasticsearchDeleteTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof elasticsearchDeleteTool.transformResponse).toBe('function')
  })

  it('elasticsearch_get: builds its request', () => {
    expect(elasticsearchGetTool.id).toBe('elasticsearch_get')
    expect(elasticsearchGetTool.request.method).toBe('GET')
    const u =
      typeof elasticsearchGetTool.request.url === 'function'
        ? (elasticsearchGetTool.request.url as any)(P)
        : elasticsearchGetTool.request.url
    expect(String(u)).toContain('mycluster.es.local')
    expect(Object.keys(elasticsearchGetTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof elasticsearchGetTool.transformResponse).toBe('function')
  })

  it('elasticsearch_index: builds its request', () => {
    expect(elasticsearchIndexTool.id).toBe('elasticsearch_index')
    expect(elasticsearchIndexTool.request.method).toBeTruthy()
    const u =
      typeof elasticsearchIndexTool.request.url === 'function'
        ? (elasticsearchIndexTool.request.url as any)(P)
        : elasticsearchIndexTool.request.url
    expect(String(u)).toContain('mycluster.es.local')
    expect(Object.keys(elasticsearchIndexTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof elasticsearchIndexTool.transformResponse).toBe('function')
  })

  it('elasticsearch_list_indices: builds its request', () => {
    expect(elasticsearchListIndicesTool.id).toBe('elasticsearch_list_indices')
    expect(elasticsearchListIndicesTool.request.method).toBe('GET')
    const u =
      typeof elasticsearchListIndicesTool.request.url === 'function'
        ? (elasticsearchListIndicesTool.request.url as any)(P)
        : elasticsearchListIndicesTool.request.url
    expect(String(u)).toContain('mycluster.es.local')
    expect(Object.keys(elasticsearchListIndicesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof elasticsearchListIndicesTool.transformResponse).toBe('function')
  })

  it('elasticsearch_search: builds its request', () => {
    expect(elasticsearchSearchTool.id).toBe('elasticsearch_search')
    expect(elasticsearchSearchTool.request.method).toBe('POST')
    const u =
      typeof elasticsearchSearchTool.request.url === 'function'
        ? (elasticsearchSearchTool.request.url as any)(P)
        : elasticsearchSearchTool.request.url
    expect(String(u)).toContain('mycluster.es.local')
    expect(Object.keys(elasticsearchSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof elasticsearchSearchTool.transformResponse).toBe('function')
  })
})
