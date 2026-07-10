/**
 * Request-builder tests for the ClickHouse tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { pingTool } from '@/tools/clickhouse/ping'
import { queryTool } from '@/tools/clickhouse/query'

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

describe('ClickHouse tools', () => {
  it('clickhouse_ping: builds its request', () => {
    expect(pingTool.id).toBe('clickhouse_ping')
    expect(pingTool.request.method).toBe('GET')
    const u =
      typeof pingTool.request.url === 'function'
        ? (pingTool.request.url as any)(P)
        : pingTool.request.url
    expect(String(u)).toContain('clickhouse.cloud')
    expect(Object.keys(pingTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof pingTool.transformResponse).toBe('function')
  })

  it('clickhouse_query: builds its request', () => {
    expect(queryTool.id).toBe('clickhouse_query')
    expect(queryTool.request.method).toBe('GET')
    const u =
      typeof queryTool.request.url === 'function'
        ? (queryTool.request.url as any)(P)
        : queryTool.request.url
    expect(String(u)).toContain('clickhouse.cloud')
    expect(Object.keys(queryTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof queryTool.transformResponse).toBe('function')
  })
})
