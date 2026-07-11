/**
 * Request-builder tests for the Google Docs tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { createTool } from '@/tools/google_docs/create'
import { readTool } from '@/tools/google_docs/read'
import { writeTool } from '@/tools/google_docs/write'

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

describe('Google Docs tools', () => {
  it('google_docs_create: builds its request', () => {
    expect(createTool.id).toBe('google_docs_create')
    expect(createTool.request.method).toBe('POST')
    const u =
      typeof createTool.request.url === 'function'
        ? (createTool.request.url as any)(P)
        : createTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(createTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof createTool.transformResponse).toBe('function')
  })

  it('google_docs_read: builds its request', () => {
    expect(readTool.id).toBe('google_docs_read')
    expect(readTool.request.method).toBe('GET')
    const u =
      typeof readTool.request.url === 'function'
        ? (readTool.request.url as any)(P)
        : readTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(readTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof readTool.transformResponse).toBe('function')
  })

  it('google_docs_write: builds its request', () => {
    expect(writeTool.id).toBe('google_docs_write')
    expect(writeTool.request.method).toBe('POST')
    const u =
      typeof writeTool.request.url === 'function'
        ? (writeTool.request.url as any)(P)
        : writeTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(writeTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof writeTool.transformResponse).toBe('function')
  })
})
