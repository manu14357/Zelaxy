/**
 * Request-builder tests for the Embeddings tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { embeddingsTool } from '@/tools/openai/embeddings'

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

describe('Embeddings tools', () => {
  it('openai_embeddings: builds its request', () => {
    expect(embeddingsTool.id).toBe('openai_embeddings')
    expect(embeddingsTool.request.method).toBe('POST')
    const u =
      typeof embeddingsTool.request.url === 'function'
        ? (embeddingsTool.request.url as any)(P)
        : embeddingsTool.request.url
    expect(String(u)).toContain('api.openai.com/v1/embeddings')
    expect(Object.keys(embeddingsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof embeddingsTool.transformResponse).toBe('function')
  })
})
