/**
 * Request-builder tests for the Devin tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { devinAddSecretTool } from '@/tools/devin/add_secret'
import { devinCreateSessionTool } from '@/tools/devin/create_session'
import { devinDeleteSecretTool } from '@/tools/devin/delete_secret'
import { devinGetSessionTool } from '@/tools/devin/get_session'
import { devinGetSnapshotTool } from '@/tools/devin/get_snapshot'
import { devinListSessionsTool } from '@/tools/devin/list_sessions'
import { devinSendMessageTool } from '@/tools/devin/send_message'

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

describe('Devin tools', () => {
  it('devin_add_secret: builds its request', () => {
    expect(devinAddSecretTool.id).toBe('devin_add_secret')
    expect(devinAddSecretTool.request.method).toBe('POST')
    const u =
      typeof devinAddSecretTool.request.url === 'function'
        ? (devinAddSecretTool.request.url as any)(P)
        : devinAddSecretTool.request.url
    expect(String(u)).toContain('api.devin.ai/v3')
    expect(Object.keys(devinAddSecretTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof devinAddSecretTool.transformResponse).toBe('function')
  })

  it('devin_create_session: builds its request', () => {
    expect(devinCreateSessionTool.id).toBe('devin_create_session')
    expect(devinCreateSessionTool.request.method).toBe('POST')
    const u =
      typeof devinCreateSessionTool.request.url === 'function'
        ? (devinCreateSessionTool.request.url as any)(P)
        : devinCreateSessionTool.request.url
    expect(String(u)).toContain('api.devin.ai/v3')
    expect(Object.keys(devinCreateSessionTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof devinCreateSessionTool.transformResponse).toBe('function')
  })

  it('devin_delete_secret: builds its request', () => {
    expect(devinDeleteSecretTool.id).toBe('devin_delete_secret')
    expect(devinDeleteSecretTool.request.method).toBe('DELETE')
    const u =
      typeof devinDeleteSecretTool.request.url === 'function'
        ? (devinDeleteSecretTool.request.url as any)(P)
        : devinDeleteSecretTool.request.url
    expect(String(u)).toContain('api.devin.ai/v3')
    expect(Object.keys(devinDeleteSecretTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof devinDeleteSecretTool.transformResponse).toBe('function')
  })

  it('devin_get_session: builds its request', () => {
    expect(devinGetSessionTool.id).toBe('devin_get_session')
    expect(devinGetSessionTool.request.method).toBe('GET')
    const u =
      typeof devinGetSessionTool.request.url === 'function'
        ? (devinGetSessionTool.request.url as any)(P)
        : devinGetSessionTool.request.url
    expect(String(u)).toContain('api.devin.ai/v3')
    expect(Object.keys(devinGetSessionTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof devinGetSessionTool.transformResponse).toBe('function')
  })

  it('devin_get_snapshot: builds its request', () => {
    expect(devinGetSnapshotTool.id).toBe('devin_get_snapshot')
    expect(devinGetSnapshotTool.request.method).toBe('GET')
    const u =
      typeof devinGetSnapshotTool.request.url === 'function'
        ? (devinGetSnapshotTool.request.url as any)(P)
        : devinGetSnapshotTool.request.url
    expect(String(u)).toContain('api.devin.ai/v3')
    expect(Object.keys(devinGetSnapshotTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof devinGetSnapshotTool.transformResponse).toBe('function')
  })

  it('devin_list_sessions: builds its request', () => {
    expect(devinListSessionsTool.id).toBe('devin_list_sessions')
    expect(devinListSessionsTool.request.method).toBe('GET')
    const u =
      typeof devinListSessionsTool.request.url === 'function'
        ? (devinListSessionsTool.request.url as any)(P)
        : devinListSessionsTool.request.url
    expect(String(u)).toContain('api.devin.ai/v3')
    expect(Object.keys(devinListSessionsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof devinListSessionsTool.transformResponse).toBe('function')
  })

  it('devin_send_message: builds its request', () => {
    expect(devinSendMessageTool.id).toBe('devin_send_message')
    expect(devinSendMessageTool.request.method).toBe('POST')
    const u =
      typeof devinSendMessageTool.request.url === 'function'
        ? (devinSendMessageTool.request.url as any)(P)
        : devinSendMessageTool.request.url
    expect(String(u)).toContain('api.devin.ai/v3')
    expect(Object.keys(devinSendMessageTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof devinSendMessageTool.transformResponse).toBe('function')
  })
})
