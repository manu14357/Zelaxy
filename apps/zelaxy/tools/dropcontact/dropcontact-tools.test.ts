/**
 * Request-builder tests for the Dropcontact tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { enrichTool } from '@/tools/dropcontact/enrich'
import { getBatchTool } from '@/tools/dropcontact/get_batch'

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

describe('Dropcontact tools', () => {
  it('dropcontact_enrich: builds its request', () => {
    expect(enrichTool.id).toBe('dropcontact_enrich')
    expect(enrichTool.request.method).toBe('POST')
    const u =
      typeof enrichTool.request.url === 'function'
        ? (enrichTool.request.url as any)(P)
        : enrichTool.request.url
    expect(String(u)).toContain('api.dropcontact.com')
    expect(Object.keys(enrichTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof enrichTool.transformResponse).toBe('function')
  })

  it('dropcontact_get_batch: builds its request', () => {
    expect(getBatchTool.id).toBe('dropcontact_get_batch')
    expect(getBatchTool.request.method).toBe('GET')
    const u =
      typeof getBatchTool.request.url === 'function'
        ? (getBatchTool.request.url as any)(P)
        : getBatchTool.request.url
    expect(String(u)).toContain('api.dropcontact.com')
    expect(Object.keys(getBatchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getBatchTool.transformResponse).toBe('function')
  })
})
