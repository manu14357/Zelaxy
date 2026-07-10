/**
 * Request-builder tests for the Confluence tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { confluenceRetrieveTool } from '@/tools/confluence/retrieve'
import { confluenceUpdateTool } from '@/tools/confluence/update'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  awsRegion: 'us-east-1',
  region: 'us-east-1',
  userId: 'u',
  organizationId: 'org',
  sessionId: 's',
  zoneId: 'z',
  recordId: 'r',
  host: 'https://h.clickhouse.cloud:8443',
  sql: 'SELECT 1',
  username: 'u',
  password: 'p',
  deploymentUrl: 'https://a.convex.cloud',
  adminKey: 'ak',
  path: 'p',
  url: 'https://example.com/page',
  query: 'q',
  agentId: 'ag',
  pageId: 'pg',
  stackName: 'st',
  id: 'id',
}

describe('Confluence tools', () => {
  it('confluence_retrieve: builds its request', () => {
    expect(confluenceRetrieveTool.id).toBe('confluence_retrieve')
    expect(confluenceRetrieveTool.request.method).toBe('POST')
    const u =
      typeof confluenceRetrieveTool.request.url === 'function'
        ? (confluenceRetrieveTool.request.url as any)(P)
        : confluenceRetrieveTool.request.url
    expect(String(u)).toContain('/api/tools/confluence/')
    expect(Object.keys(confluenceRetrieveTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof confluenceRetrieveTool.transformResponse).toBe('function')
  })

  it('confluence_update: builds its request', () => {
    expect(confluenceUpdateTool.id).toBe('confluence_update')
    expect(confluenceUpdateTool.request.method).toBe('PUT')
    const u =
      typeof confluenceUpdateTool.request.url === 'function'
        ? (confluenceUpdateTool.request.url as any)(P)
        : confluenceUpdateTool.request.url
    expect(String(u)).toContain('/api/tools/confluence/')
    expect(Object.keys(confluenceUpdateTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof confluenceUpdateTool.transformResponse).toBe('function')
  })
})
