/**
 * Request-builder tests for the Datagma tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { enrichPersonTool } from '@/tools/datagma/enrich_person'
import { findEmailTool } from '@/tools/datagma/find_email'

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

describe('Datagma tools', () => {
  it('datagma_enrich_person: builds its request', () => {
    expect(enrichPersonTool.id).toBe('datagma_enrich_person')
    expect(enrichPersonTool.request.method).toBe('GET')
    const u =
      typeof enrichPersonTool.request.url === 'function'
        ? (enrichPersonTool.request.url as any)(P)
        : enrichPersonTool.request.url
    expect(String(u)).toContain('gateway.datagma.net')
    expect(Object.keys(enrichPersonTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof enrichPersonTool.transformResponse).toBe('function')
  })

  it('datagma_find_email: builds its request', () => {
    expect(findEmailTool.id).toBe('datagma_find_email')
    expect(findEmailTool.request.method).toBe('GET')
    const u =
      typeof findEmailTool.request.url === 'function'
        ? (findEmailTool.request.url as any)(P)
        : findEmailTool.request.url
    expect(String(u)).toContain('gateway.datagma.net')
    expect(Object.keys(findEmailTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof findEmailTool.transformResponse).toBe('function')
  })
})
