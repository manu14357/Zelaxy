/**
 * Request-builder tests for the Google BigQuery tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { listDatasetsTool } from '@/tools/google_bigquery/list_datasets'
import { listTablesTool } from '@/tools/google_bigquery/list_tables'
import { queryTool } from '@/tools/google_bigquery/query'

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

describe('Google BigQuery tools', () => {
  it('google_bigquery_list_datasets: builds its request', () => {
    expect(listDatasetsTool.id).toBe('google_bigquery_list_datasets')
    expect(listDatasetsTool.request.method).toBe('GET')
    const u =
      typeof listDatasetsTool.request.url === 'function'
        ? (listDatasetsTool.request.url as any)(P)
        : listDatasetsTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(listDatasetsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listDatasetsTool.transformResponse).toBe('function')
  })

  it('google_bigquery_list_tables: builds its request', () => {
    expect(listTablesTool.id).toBe('google_bigquery_list_tables')
    expect(listTablesTool.request.method).toBe('GET')
    const u =
      typeof listTablesTool.request.url === 'function'
        ? (listTablesTool.request.url as any)(P)
        : listTablesTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(listTablesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listTablesTool.transformResponse).toBe('function')
  })

  it('google_bigquery_query: builds its request', () => {
    expect(queryTool.id).toBe('google_bigquery_query')
    expect(queryTool.request.method).toBe('POST')
    const u =
      typeof queryTool.request.url === 'function'
        ? (queryTool.request.url as any)(P)
        : queryTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(queryTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof queryTool.transformResponse).toBe('function')
  })
})
