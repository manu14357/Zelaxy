/**
 * Request-builder tests for the Dagster tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { dagsterGetRunTool } from '@/tools/dagster/get_run'
import { dagsterGetRunLogsTool } from '@/tools/dagster/get_run_logs'
import { dagsterLaunchRunTool } from '@/tools/dagster/launch_run'
import { dagsterListJobsTool } from '@/tools/dagster/list_jobs'
import { dagsterListRunsTool } from '@/tools/dagster/list_runs'
import { dagsterListSchedulesTool } from '@/tools/dagster/list_schedules'
import { dagsterTerminateRunTool } from '@/tools/dagster/terminate_run'

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

describe('Dagster tools', () => {
  it('dagster_get_run: builds its request', () => {
    expect(dagsterGetRunTool.id).toBe('dagster_get_run')
    expect(dagsterGetRunTool.request.method).toBe('POST')
    const u =
      typeof dagsterGetRunTool.request.url === 'function'
        ? (dagsterGetRunTool.request.url as any)(P)
        : dagsterGetRunTool.request.url
    expect(String(u)).toContain('/graphql')
    expect(Object.keys(dagsterGetRunTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dagsterGetRunTool.transformResponse).toBe('function')
  })

  it('dagster_get_run_logs: builds its request', () => {
    expect(dagsterGetRunLogsTool.id).toBe('dagster_get_run_logs')
    expect(dagsterGetRunLogsTool.request.method).toBe('POST')
    const u =
      typeof dagsterGetRunLogsTool.request.url === 'function'
        ? (dagsterGetRunLogsTool.request.url as any)(P)
        : dagsterGetRunLogsTool.request.url
    expect(String(u)).toContain('/graphql')
    expect(Object.keys(dagsterGetRunLogsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dagsterGetRunLogsTool.transformResponse).toBe('function')
  })

  it('dagster_launch_run: builds its request', () => {
    expect(dagsterLaunchRunTool.id).toBe('dagster_launch_run')
    expect(dagsterLaunchRunTool.request.method).toBe('POST')
    const u =
      typeof dagsterLaunchRunTool.request.url === 'function'
        ? (dagsterLaunchRunTool.request.url as any)(P)
        : dagsterLaunchRunTool.request.url
    expect(String(u)).toContain('/graphql')
    expect(Object.keys(dagsterLaunchRunTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dagsterLaunchRunTool.transformResponse).toBe('function')
  })

  it('dagster_list_jobs: builds its request', () => {
    expect(dagsterListJobsTool.id).toBe('dagster_list_jobs')
    expect(dagsterListJobsTool.request.method).toBe('POST')
    const u =
      typeof dagsterListJobsTool.request.url === 'function'
        ? (dagsterListJobsTool.request.url as any)(P)
        : dagsterListJobsTool.request.url
    expect(String(u)).toContain('/graphql')
    expect(Object.keys(dagsterListJobsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dagsterListJobsTool.transformResponse).toBe('function')
  })

  it('dagster_list_runs: builds its request', () => {
    expect(dagsterListRunsTool.id).toBe('dagster_list_runs')
    expect(dagsterListRunsTool.request.method).toBe('POST')
    const u =
      typeof dagsterListRunsTool.request.url === 'function'
        ? (dagsterListRunsTool.request.url as any)(P)
        : dagsterListRunsTool.request.url
    expect(String(u)).toContain('/graphql')
    expect(Object.keys(dagsterListRunsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dagsterListRunsTool.transformResponse).toBe('function')
  })

  it('dagster_list_schedules: builds its request', () => {
    expect(dagsterListSchedulesTool.id).toBe('dagster_list_schedules')
    expect(dagsterListSchedulesTool.request.method).toBe('POST')
    const u =
      typeof dagsterListSchedulesTool.request.url === 'function'
        ? (dagsterListSchedulesTool.request.url as any)(P)
        : dagsterListSchedulesTool.request.url
    expect(String(u)).toContain('/graphql')
    expect(Object.keys(dagsterListSchedulesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dagsterListSchedulesTool.transformResponse).toBe('function')
  })

  it('dagster_terminate_run: builds its request', () => {
    expect(dagsterTerminateRunTool.id).toBe('dagster_terminate_run')
    expect(dagsterTerminateRunTool.request.method).toBe('POST')
    const u =
      typeof dagsterTerminateRunTool.request.url === 'function'
        ? (dagsterTerminateRunTool.request.url as any)(P)
        : dagsterTerminateRunTool.request.url
    expect(String(u)).toContain('/graphql')
    expect(Object.keys(dagsterTerminateRunTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof dagsterTerminateRunTool.transformResponse).toBe('function')
  })
})
