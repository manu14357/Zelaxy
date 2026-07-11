/**
 * Request-builder tests for the Daytona tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { createWorkspaceTool } from '@/tools/daytona/create_workspace'
import { getWorkspaceTool } from '@/tools/daytona/get_workspace'
import { listWorkspacesTool } from '@/tools/daytona/list_workspaces'

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

describe('Daytona tools', () => {
  it('daytona_create_workspace: builds its request', () => {
    expect(createWorkspaceTool.id).toBe('daytona_create_workspace')
    expect(createWorkspaceTool.request.method).toBe('POST')
    const u =
      typeof createWorkspaceTool.request.url === 'function'
        ? (createWorkspaceTool.request.url as any)(P)
        : createWorkspaceTool.request.url
    expect(String(u)).toContain('app.daytona.io')
    expect(Object.keys(createWorkspaceTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof createWorkspaceTool.transformResponse).toBe('function')
  })

  it('daytona_get_workspace: builds its request', () => {
    expect(getWorkspaceTool.id).toBe('daytona_get_workspace')
    expect(getWorkspaceTool.request.method).toBe('GET')
    const u =
      typeof getWorkspaceTool.request.url === 'function'
        ? (getWorkspaceTool.request.url as any)(P)
        : getWorkspaceTool.request.url
    expect(String(u)).toContain('app.daytona.io')
    expect(Object.keys(getWorkspaceTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getWorkspaceTool.transformResponse).toBe('function')
  })

  it('daytona_list_workspaces: builds its request', () => {
    expect(listWorkspacesTool.id).toBe('daytona_list_workspaces')
    expect(listWorkspacesTool.request.method).toBe('GET')
    const u =
      typeof listWorkspacesTool.request.url === 'function'
        ? (listWorkspacesTool.request.url as any)(P)
        : listWorkspacesTool.request.url
    expect(String(u)).toContain('app.daytona.io')
    expect(Object.keys(listWorkspacesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listWorkspacesTool.transformResponse).toBe('function')
  })
})
