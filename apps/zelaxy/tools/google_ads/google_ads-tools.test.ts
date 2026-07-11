/**
 * Request-builder tests for the Google Ads tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { listCampaignsTool } from '@/tools/google_ads/list_campaigns'
import { searchTool } from '@/tools/google_ads/search'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  owner: 'o',
  repo: 'r',
  issueNumber: '1',
  pullNumber: '1',
  body: 'b',
  title: 't',
  projectId: 'p',
  filePath: 'f.txt',
  ref: 'main',
  branch: 'main',
  messageId: 'm',
  threadId: 'th',
  calendarId: 'primary',
  eventId: 'e',
  documentId: 'd',
  customerId: '123',
  datasetId: 'ds',
  tableId: 'tb',
  volumeId: 'v',
  resourceName: 'people/c1',
  personFields: 'names',
  query: 'q',
  attendees: 'a@x.com',
  contactId: 'c',
  content: 'c',
  campaignId: 'cmp',
  sql: 'SELECT 1',
  id: 'id',
  name: 'n',
  to: 'a@x.com',
  subject: 's',
  maxResults: 5,
  pageToken: 'pt',
  summary: 'sum',
  startDateTime: '2026-01-01T00:00:00Z',
  endDateTime: '2026-01-01T01:00:00Z',
}

describe('Google Ads tools', () => {
  it('google_ads_list_campaigns: builds its request', () => {
    expect(listCampaignsTool.id).toBe('google_ads_list_campaigns')
    expect(listCampaignsTool.request.method).toBe('POST')
    const u =
      typeof listCampaignsTool.request.url === 'function'
        ? (listCampaignsTool.request.url as any)(P)
        : listCampaignsTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(listCampaignsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listCampaignsTool.transformResponse).toBe('function')
  })

  it('google_ads_search: builds its request', () => {
    expect(searchTool.id).toBe('google_ads_search')
    expect(searchTool.request.method).toBe('POST')
    const u =
      typeof searchTool.request.url === 'function'
        ? (searchTool.request.url as any)(P)
        : searchTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(searchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof searchTool.transformResponse).toBe('function')
  })
})
