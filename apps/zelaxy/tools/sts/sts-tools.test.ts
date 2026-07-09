/**
 * Request-builder tests for the AWS STS tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { getCallerIdentityTool } from '@/tools/sts/get_caller_identity'
import { getSessionTokenTool } from '@/tools/sts/get_session_token'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  awsRegion: 'us-east-1',
  region: 'us-east-1',
  organization: 'org',
  project: 'proj',
  pipelineId: 'pl',
  runId: 'r',
  workItemId: '1',
  id: 'id',
  fileId: 'f',
  folderId: '0',
  brandId: 'b',
  domain: 'x.com',
  query: 'q',
  webhookURL: 'https://clay.example/webhook',
  bookingUid: 'bk',
  eventTypeId: 'et',
  uuid: 'uid',
  uri: 'https://api.calendly.com/x',
  userUri: 'https://api.calendly.com/u',
  inviteeUuid: 'iv',
  secretId: 's',
  taskId: 't',
}

describe('AWS STS tools', () => {
  it('sts_get_caller_identity: builds its request', () => {
    expect(getCallerIdentityTool.id).toBe('sts_get_caller_identity')
    expect(getCallerIdentityTool.request.method).toBe('POST')
    const u =
      typeof getCallerIdentityTool.request.url === 'function'
        ? (getCallerIdentityTool.request.url as any)(P)
        : getCallerIdentityTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(getCallerIdentityTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getCallerIdentityTool.transformResponse).toBe('function')
  })

  it('sts_get_session_token: builds its request', () => {
    expect(getSessionTokenTool.id).toBe('sts_get_session_token')
    expect(getSessionTokenTool.request.method).toBe('POST')
    const u =
      typeof getSessionTokenTool.request.url === 'function'
        ? (getSessionTokenTool.request.url as any)(P)
        : getSessionTokenTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(getSessionTokenTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getSessionTokenTool.transformResponse).toBe('function')
  })
})
