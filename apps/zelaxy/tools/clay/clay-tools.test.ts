/**
 * Request-builder tests for the Clay tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { clayPopulateTool } from '@/tools/clay/populate'

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

describe('Clay tools', () => {
  it('clay_populate: builds its request', () => {
    expect(clayPopulateTool.id).toBe('clay_populate')
    expect(clayPopulateTool.request.method).toBe('POST')
    const u =
      typeof clayPopulateTool.request.url === 'function'
        ? (clayPopulateTool.request.url as any)(P)
        : clayPopulateTool.request.url
    expect(String(u)).toContain('clay.example')
    expect(Object.keys(clayPopulateTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof clayPopulateTool.transformResponse).toBe('function')
  })
})
