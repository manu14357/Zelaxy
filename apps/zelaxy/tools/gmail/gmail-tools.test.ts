/**
 * Request-builder tests for the Gmail tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { gmailDraftTool } from '@/tools/gmail/draft'
import { gmailReadTool } from '@/tools/gmail/read'
import { gmailSearchTool } from '@/tools/gmail/search'
import { gmailSendTool } from '@/tools/gmail/send'

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

describe('Gmail tools', () => {
  it('gmail_draft: builds its request', () => {
    expect(gmailDraftTool.id).toBe('gmail_draft')
    expect(gmailDraftTool.request.method).toBe('POST')
    const u =
      typeof gmailDraftTool.request.url === 'function'
        ? (gmailDraftTool.request.url as any)(P)
        : gmailDraftTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(gmailDraftTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof gmailDraftTool.transformResponse).toBe('function')
  })

  it('gmail_read: builds its request', () => {
    expect(gmailReadTool.id).toBe('gmail_read')
    expect(gmailReadTool.request.method).toBe('GET')
    const u =
      typeof gmailReadTool.request.url === 'function'
        ? (gmailReadTool.request.url as any)(P)
        : gmailReadTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(gmailReadTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof gmailReadTool.transformResponse).toBe('function')
  })

  it('gmail_search: builds its request', () => {
    expect(gmailSearchTool.id).toBe('gmail_search')
    expect(gmailSearchTool.request.method).toBe('GET')
    const u =
      typeof gmailSearchTool.request.url === 'function'
        ? (gmailSearchTool.request.url as any)(P)
        : gmailSearchTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(gmailSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof gmailSearchTool.transformResponse).toBe('function')
  })

  it('gmail_send: builds its request', () => {
    expect(gmailSendTool.id).toBe('gmail_send')
    expect(gmailSendTool.request.method).toBe('POST')
    const u =
      typeof gmailSendTool.request.url === 'function'
        ? (gmailSendTool.request.url as any)(P)
        : gmailSendTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(gmailSendTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof gmailSendTool.transformResponse).toBe('function')
  })
})
