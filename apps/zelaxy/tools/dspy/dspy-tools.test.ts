/**
 * Request-builder tests for the DSPy tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { dspyRunTool } from '@/tools/dspy/run'

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

describe('DSPy tools', () => {
  it('dspy_run: builds its request', () => {
    expect(dspyRunTool.id).toBe('dspy_run')
    expect(dspyRunTool.request.method).toBe('POST')
    const u =
      typeof dspyRunTool.request.url === 'function'
        ? (dspyRunTool.request.url as any)(P)
        : dspyRunTool.request.url
    expect(String(u)).toContain('mydspy.example')
    expect(Object.keys(dspyRunTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dspyRunTool.transformResponse).toBe('function')
  })
})
