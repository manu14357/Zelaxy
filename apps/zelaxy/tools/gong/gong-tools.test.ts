/**
 * Request-builder tests for the Gong tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { getCallTool } from '@/tools/gong/get_call'
import { listCallsTool } from '@/tools/gong/list_calls'
import { listUsersTool } from '@/tools/gong/list_users'

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

describe('Gong tools', () => {
  it('gong_get_call: builds its request', () => {
    expect(getCallTool.id).toBe('gong_get_call')
    expect(getCallTool.request.method).toBe('GET')
    const u =
      typeof getCallTool.request.url === 'function'
        ? (getCallTool.request.url as any)(P)
        : getCallTool.request.url
    expect(String(u)).toContain('api.gong.io/v2')
    expect(Object.keys(getCallTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getCallTool.transformResponse).toBe('function')
  })

  it('gong_list_calls: builds its request', () => {
    expect(listCallsTool.id).toBe('gong_list_calls')
    expect(listCallsTool.request.method).toBe('GET')
    const u =
      typeof listCallsTool.request.url === 'function'
        ? (listCallsTool.request.url as any)(P)
        : listCallsTool.request.url
    expect(String(u)).toContain('api.gong.io/v2')
    expect(Object.keys(listCallsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listCallsTool.transformResponse).toBe('function')
  })

  it('gong_list_users: builds its request', () => {
    expect(listUsersTool.id).toBe('gong_list_users')
    expect(listUsersTool.request.method).toBe('GET')
    const u =
      typeof listUsersTool.request.url === 'function'
        ? (listUsersTool.request.url as any)(P)
        : listUsersTool.request.url
    expect(String(u)).toContain('api.gong.io/v2')
    expect(Object.keys(listUsersTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listUsersTool.transformResponse).toBe('function')
  })
})
