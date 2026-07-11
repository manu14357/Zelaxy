/**
 * Request-builder tests for the Google Books tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { getVolumeTool } from '@/tools/google_books/get_volume'
import { searchVolumesTool } from '@/tools/google_books/search_volumes'

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

describe('Google Books tools', () => {
  it('google_books_get_volume: builds its request', () => {
    expect(getVolumeTool.id).toBe('google_books_get_volume')
    expect(getVolumeTool.request.method).toBe('GET')
    const u =
      typeof getVolumeTool.request.url === 'function'
        ? (getVolumeTool.request.url as any)(P)
        : getVolumeTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(getVolumeTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getVolumeTool.transformResponse).toBe('function')
  })

  it('google_books_search_volumes: builds its request', () => {
    expect(searchVolumesTool.id).toBe('google_books_search_volumes')
    expect(searchVolumesTool.request.method).toBe('GET')
    const u =
      typeof searchVolumesTool.request.url === 'function'
        ? (searchVolumesTool.request.url as any)(P)
        : searchVolumesTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(searchVolumesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof searchVolumesTool.transformResponse).toBe('function')
  })
})
