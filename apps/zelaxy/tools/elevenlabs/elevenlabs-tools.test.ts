/**
 * Request-builder tests for the ElevenLabs tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { elevenLabsTtsTool } from '@/tools/elevenlabs/tts'

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

describe('ElevenLabs tools', () => {
  it('elevenlabs_tts: builds its request', () => {
    expect(elevenLabsTtsTool.id).toBe('elevenlabs_tts')
    expect(elevenLabsTtsTool.request.method).toBe('POST')
    const u =
      typeof elevenLabsTtsTool.request.url === 'function'
        ? (elevenLabsTtsTool.request.url as any)(P)
        : elevenLabsTtsTool.request.url
    expect(String(u)).toContain('/api/proxy/tts')
    expect(Object.keys(elevenLabsTtsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof elevenLabsTtsTool.transformResponse).toBe('function')
  })
})
