/**
 * Request-builder tests for the Bright Data tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { brightDataDiscoverTool } from '@/tools/brightdata/discover'
import { brightDataScrapeUrlTool } from '@/tools/brightdata/scrape_url'
import { brightDataSerpSearchTool } from '@/tools/brightdata/serp_search'

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

describe('Bright Data tools', () => {
  it('brightdata_discover: builds its request', () => {
    expect(brightDataDiscoverTool.id).toBe('brightdata_discover')
    expect(brightDataDiscoverTool.request.method).toBe('POST')
    const u =
      typeof brightDataDiscoverTool.request.url === 'function'
        ? (brightDataDiscoverTool.request.url as any)(P)
        : brightDataDiscoverTool.request.url
    expect(String(u)).toContain('api.brightdata.com')
    expect(Object.keys(brightDataDiscoverTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof brightDataDiscoverTool.transformResponse).toBe('function')
  })

  it('brightdata_scrape_url: builds its request', () => {
    expect(brightDataScrapeUrlTool.id).toBe('brightdata_scrape_url')
    expect(brightDataScrapeUrlTool.request.method).toBe('POST')
    const u =
      typeof brightDataScrapeUrlTool.request.url === 'function'
        ? (brightDataScrapeUrlTool.request.url as any)(P)
        : brightDataScrapeUrlTool.request.url
    expect(String(u)).toContain('api.brightdata.com')
    expect(Object.keys(brightDataScrapeUrlTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof brightDataScrapeUrlTool.transformResponse).toBe('function')
  })

  it('brightdata_serp_search: builds its request', () => {
    expect(brightDataSerpSearchTool.id).toBe('brightdata_serp_search')
    expect(brightDataSerpSearchTool.request.method).toBe('POST')
    const u =
      typeof brightDataSerpSearchTool.request.url === 'function'
        ? (brightDataSerpSearchTool.request.url as any)(P)
        : brightDataSerpSearchTool.request.url
    expect(String(u)).toContain('api.brightdata.com')
    expect(Object.keys(brightDataSerpSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof brightDataSerpSearchTool.transformResponse).toBe('function')
  })
})
