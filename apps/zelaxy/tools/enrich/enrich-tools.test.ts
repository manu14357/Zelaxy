/**
 * Request-builder tests for the Enrich tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { enrichCompanyLookupTool } from '@/tools/enrich/company_lookup'
import { enrichEmailToProfileTool } from '@/tools/enrich/email_to_profile'
import { enrichFindEmailTool } from '@/tools/enrich/find_email'
import { enrichPhoneFinderTool } from '@/tools/enrich/phone_finder'
import { enrichSearchPeopleTool } from '@/tools/enrich/search_people'
import { enrichVerifyEmailTool } from '@/tools/enrich/verify_email'

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

describe('Enrich tools', () => {
  it('enrich_company_lookup: builds its request', () => {
    expect(enrichCompanyLookupTool.id).toBe('enrich_company_lookup')
    expect(enrichCompanyLookupTool.request.method).toBe('GET')
    const u =
      typeof enrichCompanyLookupTool.request.url === 'function'
        ? (enrichCompanyLookupTool.request.url as any)(P)
        : enrichCompanyLookupTool.request.url
    expect(String(u)).toContain('enrich.so')
    expect(Object.keys(enrichCompanyLookupTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof enrichCompanyLookupTool.transformResponse).toBe('function')
  })

  it('enrich_email_to_profile: builds its request', () => {
    expect(enrichEmailToProfileTool.id).toBe('enrich_email_to_profile')
    expect(enrichEmailToProfileTool.request.method).toBe('GET')
    const u =
      typeof enrichEmailToProfileTool.request.url === 'function'
        ? (enrichEmailToProfileTool.request.url as any)(P)
        : enrichEmailToProfileTool.request.url
    expect(String(u)).toContain('enrich.so')
    expect(Object.keys(enrichEmailToProfileTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof enrichEmailToProfileTool.transformResponse).toBe('function')
  })

  it('enrich_find_email: builds its request', () => {
    expect(enrichFindEmailTool.id).toBe('enrich_find_email')
    expect(enrichFindEmailTool.request.method).toBe('GET')
    const u =
      typeof enrichFindEmailTool.request.url === 'function'
        ? (enrichFindEmailTool.request.url as any)(P)
        : enrichFindEmailTool.request.url
    expect(String(u)).toContain('enrich.so')
    expect(Object.keys(enrichFindEmailTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof enrichFindEmailTool.transformResponse).toBe('function')
  })

  it('enrich_phone_finder: builds its request', () => {
    expect(enrichPhoneFinderTool.id).toBe('enrich_phone_finder')
    expect(enrichPhoneFinderTool.request.method).toBe('GET')
    const u =
      typeof enrichPhoneFinderTool.request.url === 'function'
        ? (enrichPhoneFinderTool.request.url as any)(P)
        : enrichPhoneFinderTool.request.url
    expect(String(u)).toContain('enrich.so')
    expect(Object.keys(enrichPhoneFinderTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof enrichPhoneFinderTool.transformResponse).toBe('function')
  })

  it('enrich_search_people: builds its request', () => {
    expect(enrichSearchPeopleTool.id).toBe('enrich_search_people')
    expect(enrichSearchPeopleTool.request.method).toBe('POST')
    const u =
      typeof enrichSearchPeopleTool.request.url === 'function'
        ? (enrichSearchPeopleTool.request.url as any)(P)
        : enrichSearchPeopleTool.request.url
    expect(String(u)).toContain('enrich.so')
    expect(Object.keys(enrichSearchPeopleTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof enrichSearchPeopleTool.transformResponse).toBe('function')
  })

  it('enrich_verify_email: builds its request', () => {
    expect(enrichVerifyEmailTool.id).toBe('enrich_verify_email')
    expect(enrichVerifyEmailTool.request.method).toBe('GET')
    const u =
      typeof enrichVerifyEmailTool.request.url === 'function'
        ? (enrichVerifyEmailTool.request.url as any)(P)
        : enrichVerifyEmailTool.request.url
    expect(String(u)).toContain('enrich.so')
    expect(Object.keys(enrichVerifyEmailTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof enrichVerifyEmailTool.transformResponse).toBe('function')
  })
})
