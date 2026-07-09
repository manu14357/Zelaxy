/**
 * Request-builder tests for the Brandfetch tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { brandfetchGetBrandTool } from '@/tools/brandfetch/get_brand'
import { brandfetchSearchTool } from '@/tools/brandfetch/search'

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
  identifier: 'id',
  name: 'n',
  accountId: 'acc',
  eventTypeUuid: 'etu',
  eventUuid: 'evu',
  taskId: 't',
}

describe('Brandfetch tools', () => {
  it('brandfetch_get_brand: builds its request', () => {
    expect(brandfetchGetBrandTool.id).toBe('brandfetch_get_brand')
    expect(brandfetchGetBrandTool.request.method).toBe('GET')
    const u =
      typeof brandfetchGetBrandTool.request.url === 'function'
        ? (brandfetchGetBrandTool.request.url as any)(P)
        : brandfetchGetBrandTool.request.url
    expect(String(u)).toContain('api.brandfetch.io/v2')
    expect(Object.keys(brandfetchGetBrandTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof brandfetchGetBrandTool.transformResponse).toBe('function')
  })

  it('brandfetch_search: builds its request', () => {
    expect(brandfetchSearchTool.id).toBe('brandfetch_search')
    expect(brandfetchSearchTool.request.method).toBe('GET')
    const u =
      typeof brandfetchSearchTool.request.url === 'function'
        ? (brandfetchSearchTool.request.url as any)(P)
        : brandfetchSearchTool.request.url
    expect(String(u)).toContain('api.brandfetch.io/v2')
    expect(Object.keys(brandfetchSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof brandfetchSearchTool.transformResponse).toBe('function')
  })
})
