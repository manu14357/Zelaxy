/**
 * Request-builder tests for the Apollo tools — asserts each operation's endpoint,
 * method, params and response transform without making network calls.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { apolloFindEmailTool } from '@/tools/apollo/find_email'
import { apolloOrganizationEnrichTool } from '@/tools/apollo/organization_enrich'
import { apolloOrganizationSearchTool } from '@/tools/apollo/organization_search'
import { apolloPeopleEnrichTool } from '@/tools/apollo/people_enrich'
import { apolloPeopleSearchTool } from '@/tools/apollo/people_search'

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

describe('Apollo tools', () => {
  it('apollo_people_search: builds its request', () => {
    expect(apolloPeopleSearchTool.id).toBe('apollo_people_search')
    expect(apolloPeopleSearchTool.request.method).toBe('POST')
    const u =
      typeof apolloPeopleSearchTool.request.url === 'function'
        ? (apolloPeopleSearchTool.request.url as any)(P)
        : apolloPeopleSearchTool.request.url
    expect(String(u)).toContain('api.apollo.io/api/v1')
    expect(Object.keys(apolloPeopleSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(apolloPeopleSearchTool.outputs).toBeDefined()
    expect(typeof apolloPeopleSearchTool.transformResponse).toBe('function')
  })

  it('apollo_organization_enrich: builds its request', () => {
    expect(apolloOrganizationEnrichTool.id).toBe('apollo_organization_enrich')
    expect(apolloOrganizationEnrichTool.request.method).toBe('POST')
    const u =
      typeof apolloOrganizationEnrichTool.request.url === 'function'
        ? (apolloOrganizationEnrichTool.request.url as any)(P)
        : apolloOrganizationEnrichTool.request.url
    expect(String(u)).toContain('api.apollo.io/api/v1')
    expect(Object.keys(apolloOrganizationEnrichTool.params ?? {}).length).toBeGreaterThan(0)
    expect(apolloOrganizationEnrichTool.outputs).toBeDefined()
    expect(typeof apolloOrganizationEnrichTool.transformResponse).toBe('function')
  })

  it('apollo_organization_search: builds its request', () => {
    expect(apolloOrganizationSearchTool.id).toBe('apollo_organization_search')
    expect(apolloOrganizationSearchTool.request.method).toBe('POST')
    const u =
      typeof apolloOrganizationSearchTool.request.url === 'function'
        ? (apolloOrganizationSearchTool.request.url as any)(P)
        : apolloOrganizationSearchTool.request.url
    expect(String(u)).toContain('api.apollo.io/api/v1')
    expect(Object.keys(apolloOrganizationSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(apolloOrganizationSearchTool.outputs).toBeDefined()
    expect(typeof apolloOrganizationSearchTool.transformResponse).toBe('function')
  })

  it('apollo_find_email: builds its request', () => {
    expect(apolloFindEmailTool.id).toBe('apollo_find_email')
    expect(apolloFindEmailTool.request.method).toBe('POST')
    const u =
      typeof apolloFindEmailTool.request.url === 'function'
        ? (apolloFindEmailTool.request.url as any)(P)
        : apolloFindEmailTool.request.url
    expect(String(u)).toContain('api.apollo.io/api/v1')
    expect(Object.keys(apolloFindEmailTool.params ?? {}).length).toBeGreaterThan(0)
    expect(apolloFindEmailTool.outputs).toBeDefined()
    expect(typeof apolloFindEmailTool.transformResponse).toBe('function')
  })

  it('apollo_people_enrich: builds its request', () => {
    expect(apolloPeopleEnrichTool.id).toBe('apollo_people_enrich')
    expect(apolloPeopleEnrichTool.request.method).toBe('POST')
    const u =
      typeof apolloPeopleEnrichTool.request.url === 'function'
        ? (apolloPeopleEnrichTool.request.url as any)(P)
        : apolloPeopleEnrichTool.request.url
    expect(String(u)).toContain('api.apollo.io/api/v1')
    expect(Object.keys(apolloPeopleEnrichTool.params ?? {}).length).toBeGreaterThan(0)
    expect(apolloPeopleEnrichTool.outputs).toBeDefined()
    expect(typeof apolloPeopleEnrichTool.transformResponse).toBe('function')
  })
})
