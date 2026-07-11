/**
 * Request-builder tests for the Email Bison tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { emailbisonBulkFindTool } from '@/tools/emailbison/bulk_find'
import { emailbisonDomainSearchTool } from '@/tools/emailbison/domain_search'
import { emailbisonFindEmailTool } from '@/tools/emailbison/find_email'
import { emailbisonVerifyEmailTool } from '@/tools/emailbison/verify_email'

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

describe('Email Bison tools', () => {
  it('emailbison_bulk_find: builds its request', () => {
    expect(emailbisonBulkFindTool.id).toBe('emailbison_bulk_find')
    expect(emailbisonBulkFindTool.request.method).toBe('POST')
    const u =
      typeof emailbisonBulkFindTool.request.url === 'function'
        ? (emailbisonBulkFindTool.request.url as any)(P)
        : emailbisonBulkFindTool.request.url
    expect(String(u)).toContain('api.emailbison.com/v1')
    expect(Object.keys(emailbisonBulkFindTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof emailbisonBulkFindTool.transformResponse).toBe('function')
  })

  it('emailbison_domain_search: builds its request', () => {
    expect(emailbisonDomainSearchTool.id).toBe('emailbison_domain_search')
    expect(emailbisonDomainSearchTool.request.method).toBe('GET')
    const u =
      typeof emailbisonDomainSearchTool.request.url === 'function'
        ? (emailbisonDomainSearchTool.request.url as any)(P)
        : emailbisonDomainSearchTool.request.url
    expect(String(u)).toContain('api.emailbison.com/v1')
    expect(Object.keys(emailbisonDomainSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof emailbisonDomainSearchTool.transformResponse).toBe('function')
  })

  it('emailbison_find_email: builds its request', () => {
    expect(emailbisonFindEmailTool.id).toBe('emailbison_find_email')
    expect(emailbisonFindEmailTool.request.method).toBe('GET')
    const u =
      typeof emailbisonFindEmailTool.request.url === 'function'
        ? (emailbisonFindEmailTool.request.url as any)(P)
        : emailbisonFindEmailTool.request.url
    expect(String(u)).toContain('api.emailbison.com/v1')
    expect(Object.keys(emailbisonFindEmailTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof emailbisonFindEmailTool.transformResponse).toBe('function')
  })

  it('emailbison_verify_email: builds its request', () => {
    expect(emailbisonVerifyEmailTool.id).toBe('emailbison_verify_email')
    expect(emailbisonVerifyEmailTool.request.method).toBe('GET')
    const u =
      typeof emailbisonVerifyEmailTool.request.url === 'function'
        ? (emailbisonVerifyEmailTool.request.url as any)(P)
        : emailbisonVerifyEmailTool.request.url
    expect(String(u)).toContain('api.emailbison.com/v1')
    expect(Object.keys(emailbisonVerifyEmailTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof emailbisonVerifyEmailTool.transformResponse).toBe('function')
  })
})
