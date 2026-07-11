/**
 * Request-builder tests for the Datadog tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { datadogCreateIncidentTool } from '@/tools/datadog/create_incident'
import { datadogListDashboardsTool } from '@/tools/datadog/list_dashboards'
import { datadogListIncidentsTool } from '@/tools/datadog/list_incidents'
import { datadogListMonitorsTool } from '@/tools/datadog/list_monitors'
import { datadogQueryLogsTool } from '@/tools/datadog/query_logs'
import { datadogQueryMetricsTool } from '@/tools/datadog/query_metrics'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  host: 'https://myws.databricks.com',
  site: 'datadoghq.com',
  runId: 'r',
  jobId: 'j',
  clusterId: 'c',
  catalogName: 'cat',
  monitorId: 'm',
  incidentId: 'i',
  dashboardId: 'd',
  workspaceId: 'w',
  sessionId: 's',
  secretName: 'sec',
  snapshotId: 'sn',
  channelId: 'ch',
  guildId: 'g',
  serverId: 'sv',
  userId: 'u',
  envelopeId: 'e',
  accountId: 'a',
  path: '/p',
  fileId: 'f',
  folderId: '0',
  query: 'q',
  personId: 'p',
  email: 'e@x.com',
  fullName: 'n',
  repositoryLocationName: 'rl',
  repositoryName: 'rn',
  jobName: 'jn',
  sql: 'SELECT 1',
  warehouseId: 'wh',
  id: 'id',
  name: 'n',
  message: 'm',
}

describe('Datadog tools', () => {
  it('datadog_create_incident: builds its request', () => {
    expect(datadogCreateIncidentTool.id).toBe('datadog_create_incident')
    expect(datadogCreateIncidentTool.request.method).toBe('POST')
    const u =
      typeof datadogCreateIncidentTool.request.url === 'function'
        ? (datadogCreateIncidentTool.request.url as any)(P)
        : datadogCreateIncidentTool.request.url
    expect(String(u)).toContain('datadoghq.com')
    expect(Object.keys(datadogCreateIncidentTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof datadogCreateIncidentTool.transformResponse).toBe('function')
  })

  it('datadog_list_dashboards: builds its request', () => {
    expect(datadogListDashboardsTool.id).toBe('datadog_list_dashboards')
    expect(datadogListDashboardsTool.request.method).toBe('GET')
    const u =
      typeof datadogListDashboardsTool.request.url === 'function'
        ? (datadogListDashboardsTool.request.url as any)(P)
        : datadogListDashboardsTool.request.url
    expect(String(u)).toContain('datadoghq.com')
    expect(Object.keys(datadogListDashboardsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof datadogListDashboardsTool.transformResponse).toBe('function')
  })

  it('datadog_list_incidents: builds its request', () => {
    expect(datadogListIncidentsTool.id).toBe('datadog_list_incidents')
    expect(datadogListIncidentsTool.request.method).toBe('GET')
    const u =
      typeof datadogListIncidentsTool.request.url === 'function'
        ? (datadogListIncidentsTool.request.url as any)(P)
        : datadogListIncidentsTool.request.url
    expect(String(u)).toContain('datadoghq.com')
    expect(Object.keys(datadogListIncidentsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof datadogListIncidentsTool.transformResponse).toBe('function')
  })

  it('datadog_list_monitors: builds its request', () => {
    expect(datadogListMonitorsTool.id).toBe('datadog_list_monitors')
    expect(datadogListMonitorsTool.request.method).toBe('GET')
    const u =
      typeof datadogListMonitorsTool.request.url === 'function'
        ? (datadogListMonitorsTool.request.url as any)(P)
        : datadogListMonitorsTool.request.url
    expect(String(u)).toContain('datadoghq.com')
    expect(Object.keys(datadogListMonitorsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof datadogListMonitorsTool.transformResponse).toBe('function')
  })

  it('datadog_query_logs: builds its request', () => {
    expect(datadogQueryLogsTool.id).toBe('datadog_query_logs')
    expect(datadogQueryLogsTool.request.method).toBe('POST')
    const u =
      typeof datadogQueryLogsTool.request.url === 'function'
        ? (datadogQueryLogsTool.request.url as any)(P)
        : datadogQueryLogsTool.request.url
    expect(String(u)).toContain('datadoghq.com')
    expect(Object.keys(datadogQueryLogsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof datadogQueryLogsTool.transformResponse).toBe('function')
  })

  it('datadog_query_metrics: builds its request', () => {
    expect(datadogQueryMetricsTool.id).toBe('datadog_query_metrics')
    expect(datadogQueryMetricsTool.request.method).toBe('GET')
    const u =
      typeof datadogQueryMetricsTool.request.url === 'function'
        ? (datadogQueryMetricsTool.request.url as any)(P)
        : datadogQueryMetricsTool.request.url
    expect(String(u)).toContain('datadoghq.com')
    expect(Object.keys(datadogQueryMetricsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof datadogQueryMetricsTool.transformResponse).toBe('function')
  })
})
