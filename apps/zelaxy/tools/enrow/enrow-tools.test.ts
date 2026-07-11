/**
 * Request-builder tests for the Enrow tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { findEmailTool } from '@/tools/enrow/find_email'
import { getResultTool } from '@/tools/enrow/get_result'
import { verifyEmailTool } from '@/tools/enrow/verify_email'

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

describe('Enrow tools', () => {
  it('enrow_find_email: builds its request', () => {
    expect(findEmailTool.id).toBe('enrow_find_email')
    expect(findEmailTool.request.method).toBe('GET')
    const u =
      typeof findEmailTool.request.url === 'function'
        ? (findEmailTool.request.url as any)(P)
        : findEmailTool.request.url
    expect(String(u)).toContain('api.enrow.io')
    expect(Object.keys(findEmailTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof findEmailTool.transformResponse).toBe('function')
  })

  it('enrow_get_result: builds its request', () => {
    expect(getResultTool.id).toBe('enrow_get_result')
    expect(getResultTool.request.method).toBe('GET')
    const u =
      typeof getResultTool.request.url === 'function'
        ? (getResultTool.request.url as any)(P)
        : getResultTool.request.url
    expect(String(u)).toContain('api.enrow.io')
    expect(Object.keys(getResultTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getResultTool.transformResponse).toBe('function')
  })

  it('enrow_verify_email: builds its request', () => {
    expect(verifyEmailTool.id).toBe('enrow_verify_email')
    expect(verifyEmailTool.request.method).toBe('GET')
    const u =
      typeof verifyEmailTool.request.url === 'function'
        ? (verifyEmailTool.request.url as any)(P)
        : verifyEmailTool.request.url
    expect(String(u)).toContain('api.enrow.io')
    expect(Object.keys(verifyEmailTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof verifyEmailTool.transformResponse).toBe('function')
  })
})
