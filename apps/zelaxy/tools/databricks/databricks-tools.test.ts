/**
 * Request-builder tests for the Databricks tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { databricksExecuteSqlTool } from '@/tools/databricks/execute_sql'
import { databricksGetRunStatusTool } from '@/tools/databricks/get_run_status'
import { databricksListCatalogsTool } from '@/tools/databricks/list_catalogs'
import { databricksListClustersTool } from '@/tools/databricks/list_clusters'
import { databricksListJobsTool } from '@/tools/databricks/list_jobs'
import { databricksRunJobTool } from '@/tools/databricks/run_job'

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

describe('Databricks tools', () => {
  it('databricks_execute_sql: builds its request', () => {
    expect(databricksExecuteSqlTool.id).toBe('databricks_execute_sql')
    expect(databricksExecuteSqlTool.request.method).toBe('POST')
    const u =
      typeof databricksExecuteSqlTool.request.url === 'function'
        ? (databricksExecuteSqlTool.request.url as any)(P)
        : databricksExecuteSqlTool.request.url
    expect(String(u)).toContain('databricks')
    expect(Object.keys(databricksExecuteSqlTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof databricksExecuteSqlTool.transformResponse).toBe('function')
  })

  it('databricks_get_run_status: builds its request', () => {
    expect(databricksGetRunStatusTool.id).toBe('databricks_get_run_status')
    expect(databricksGetRunStatusTool.request.method).toBe('GET')
    const u =
      typeof databricksGetRunStatusTool.request.url === 'function'
        ? (databricksGetRunStatusTool.request.url as any)(P)
        : databricksGetRunStatusTool.request.url
    expect(String(u)).toContain('databricks')
    expect(Object.keys(databricksGetRunStatusTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof databricksGetRunStatusTool.transformResponse).toBe('function')
  })

  it('databricks_list_catalogs: builds its request', () => {
    expect(databricksListCatalogsTool.id).toBe('databricks_list_catalogs')
    expect(databricksListCatalogsTool.request.method).toBe('GET')
    const u =
      typeof databricksListCatalogsTool.request.url === 'function'
        ? (databricksListCatalogsTool.request.url as any)(P)
        : databricksListCatalogsTool.request.url
    expect(String(u)).toContain('databricks')
    expect(Object.keys(databricksListCatalogsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof databricksListCatalogsTool.transformResponse).toBe('function')
  })

  it('databricks_list_clusters: builds its request', () => {
    expect(databricksListClustersTool.id).toBe('databricks_list_clusters')
    expect(databricksListClustersTool.request.method).toBe('GET')
    const u =
      typeof databricksListClustersTool.request.url === 'function'
        ? (databricksListClustersTool.request.url as any)(P)
        : databricksListClustersTool.request.url
    expect(String(u)).toContain('databricks')
    expect(Object.keys(databricksListClustersTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof databricksListClustersTool.transformResponse).toBe('function')
  })

  it('databricks_list_jobs: builds its request', () => {
    expect(databricksListJobsTool.id).toBe('databricks_list_jobs')
    expect(databricksListJobsTool.request.method).toBe('GET')
    const u =
      typeof databricksListJobsTool.request.url === 'function'
        ? (databricksListJobsTool.request.url as any)(P)
        : databricksListJobsTool.request.url
    expect(String(u)).toContain('databricks')
    expect(Object.keys(databricksListJobsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof databricksListJobsTool.transformResponse).toBe('function')
  })

  it('databricks_run_job: builds its request', () => {
    expect(databricksRunJobTool.id).toBe('databricks_run_job')
    expect(databricksRunJobTool.request.method).toBe('POST')
    const u =
      typeof databricksRunJobTool.request.url === 'function'
        ? (databricksRunJobTool.request.url as any)(P)
        : databricksRunJobTool.request.url
    expect(String(u)).toContain('databricks')
    expect(Object.keys(databricksRunJobTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof databricksRunJobTool.transformResponse).toBe('function')
  })
})
