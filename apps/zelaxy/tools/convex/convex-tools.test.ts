/**
 * Request-builder tests for the Convex tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { runMutationTool } from '@/tools/convex/run_mutation'
import { runQueryTool } from '@/tools/convex/run_query'

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

describe('Convex tools', () => {
  it('convex_run_mutation: builds its request', () => {
    expect(runMutationTool.id).toBe('convex_run_mutation')
    expect(runMutationTool.request.method).toBe('POST')
    const u =
      typeof runMutationTool.request.url === 'function'
        ? (runMutationTool.request.url as any)(P)
        : runMutationTool.request.url
    expect(String(u)).toContain('convex.cloud')
    expect(Object.keys(runMutationTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof runMutationTool.transformResponse).toBe('function')
  })

  it('convex_run_query: builds its request', () => {
    expect(runQueryTool.id).toBe('convex_run_query')
    expect(runQueryTool.request.method).toBe('POST')
    const u =
      typeof runQueryTool.request.url === 'function'
        ? (runQueryTool.request.url as any)(P)
        : runQueryTool.request.url
    expect(String(u)).toContain('convex.cloud')
    expect(Object.keys(runQueryTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof runQueryTool.transformResponse).toBe('function')
  })
})
