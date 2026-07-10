/**
 * Request-builder tests for the CrowdStrike tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { crowdstrikeGetSensorAggregatesTool } from '@/tools/crowdstrike/get_sensor_aggregates'
import { crowdstrikeGetSensorDetailsTool } from '@/tools/crowdstrike/get_sensor_details'
import { crowdstrikeQuerySensorsTool } from '@/tools/crowdstrike/query_sensors'

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

describe('CrowdStrike tools', () => {
  it('crowdstrike_get_sensor_aggregates: builds its request', () => {
    expect(crowdstrikeGetSensorAggregatesTool.id).toBe('crowdstrike_get_sensor_aggregates')
    expect(crowdstrikeGetSensorAggregatesTool.request.method).toBe('POST')
    const u =
      typeof crowdstrikeGetSensorAggregatesTool.request.url === 'function'
        ? (crowdstrikeGetSensorAggregatesTool.request.url as any)(P)
        : crowdstrikeGetSensorAggregatesTool.request.url
    expect(String(u)).toContain('/api/tools/crowdstrike/')
    expect(Object.keys(crowdstrikeGetSensorAggregatesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof crowdstrikeGetSensorAggregatesTool.transformResponse).toBe('function')
  })

  it('crowdstrike_get_sensor_details: builds its request', () => {
    expect(crowdstrikeGetSensorDetailsTool.id).toBe('crowdstrike_get_sensor_details')
    expect(crowdstrikeGetSensorDetailsTool.request.method).toBe('POST')
    const u =
      typeof crowdstrikeGetSensorDetailsTool.request.url === 'function'
        ? (crowdstrikeGetSensorDetailsTool.request.url as any)(P)
        : crowdstrikeGetSensorDetailsTool.request.url
    expect(String(u)).toContain('/api/tools/crowdstrike/')
    expect(Object.keys(crowdstrikeGetSensorDetailsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof crowdstrikeGetSensorDetailsTool.transformResponse).toBe('function')
  })

  it('crowdstrike_query_sensors: builds its request', () => {
    expect(crowdstrikeQuerySensorsTool.id).toBe('crowdstrike_query_sensors')
    expect(crowdstrikeQuerySensorsTool.request.method).toBe('POST')
    const u =
      typeof crowdstrikeQuerySensorsTool.request.url === 'function'
        ? (crowdstrikeQuerySensorsTool.request.url as any)(P)
        : crowdstrikeQuerySensorsTool.request.url
    expect(String(u)).toContain('/api/tools/crowdstrike/')
    expect(Object.keys(crowdstrikeQuerySensorsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof crowdstrikeQuerySensorsTool.transformResponse).toBe('function')
  })
})
