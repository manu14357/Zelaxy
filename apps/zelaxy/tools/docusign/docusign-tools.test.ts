/**
 * Request-builder tests for the DocuSign tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { docusignCreateEnvelopeTool } from '@/tools/docusign/create_envelope'
import { docusignGetEnvelopeTool } from '@/tools/docusign/get_envelope'
import { docusignGetSigningUrlTool } from '@/tools/docusign/get_signing_url'
import { docusignListEnvelopesTool } from '@/tools/docusign/list_envelopes'
import { docusignSendEnvelopeTool } from '@/tools/docusign/send_envelope'
import { docusignVoidEnvelopeTool } from '@/tools/docusign/void_envelope'

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

describe('DocuSign tools', () => {
  it('docusign_create_envelope: builds its request', () => {
    expect(docusignCreateEnvelopeTool.id).toBe('docusign_create_envelope')
    expect(docusignCreateEnvelopeTool.request.method).toBe('POST')
    const u =
      typeof docusignCreateEnvelopeTool.request.url === 'function'
        ? (docusignCreateEnvelopeTool.request.url as any)(P)
        : docusignCreateEnvelopeTool.request.url
    expect(String(u)).toContain('/api/tools/docusign')
    expect(Object.keys(docusignCreateEnvelopeTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof docusignCreateEnvelopeTool.transformResponse).toBe('function')
  })

  it('docusign_get_envelope: builds its request', () => {
    expect(docusignGetEnvelopeTool.id).toBe('docusign_get_envelope')
    expect(docusignGetEnvelopeTool.request.method).toBe('POST')
    const u =
      typeof docusignGetEnvelopeTool.request.url === 'function'
        ? (docusignGetEnvelopeTool.request.url as any)(P)
        : docusignGetEnvelopeTool.request.url
    expect(String(u)).toContain('/api/tools/docusign')
    expect(Object.keys(docusignGetEnvelopeTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof docusignGetEnvelopeTool.transformResponse).toBe('function')
  })

  it('docusign_get_signing_url: builds its request', () => {
    expect(docusignGetSigningUrlTool.id).toBe('docusign_get_signing_url')
    expect(docusignGetSigningUrlTool.request.method).toBe('POST')
    const u =
      typeof docusignGetSigningUrlTool.request.url === 'function'
        ? (docusignGetSigningUrlTool.request.url as any)(P)
        : docusignGetSigningUrlTool.request.url
    expect(String(u)).toContain('/api/tools/docusign')
    expect(Object.keys(docusignGetSigningUrlTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof docusignGetSigningUrlTool.transformResponse).toBe('function')
  })

  it('docusign_list_envelopes: builds its request', () => {
    expect(docusignListEnvelopesTool.id).toBe('docusign_list_envelopes')
    expect(docusignListEnvelopesTool.request.method).toBe('POST')
    const u =
      typeof docusignListEnvelopesTool.request.url === 'function'
        ? (docusignListEnvelopesTool.request.url as any)(P)
        : docusignListEnvelopesTool.request.url
    expect(String(u)).toContain('/api/tools/docusign')
    expect(Object.keys(docusignListEnvelopesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof docusignListEnvelopesTool.transformResponse).toBe('function')
  })

  it('docusign_send_envelope: builds its request', () => {
    expect(docusignSendEnvelopeTool.id).toBe('docusign_send_envelope')
    expect(docusignSendEnvelopeTool.request.method).toBe('POST')
    const u =
      typeof docusignSendEnvelopeTool.request.url === 'function'
        ? (docusignSendEnvelopeTool.request.url as any)(P)
        : docusignSendEnvelopeTool.request.url
    expect(String(u)).toContain('/api/tools/docusign')
    expect(Object.keys(docusignSendEnvelopeTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof docusignSendEnvelopeTool.transformResponse).toBe('function')
  })

  it('docusign_void_envelope: builds its request', () => {
    expect(docusignVoidEnvelopeTool.id).toBe('docusign_void_envelope')
    expect(docusignVoidEnvelopeTool.request.method).toBe('POST')
    const u =
      typeof docusignVoidEnvelopeTool.request.url === 'function'
        ? (docusignVoidEnvelopeTool.request.url as any)(P)
        : docusignVoidEnvelopeTool.request.url
    expect(String(u)).toContain('/api/tools/docusign')
    expect(Object.keys(docusignVoidEnvelopeTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof docusignVoidEnvelopeTool.transformResponse).toBe('function')
  })
})
