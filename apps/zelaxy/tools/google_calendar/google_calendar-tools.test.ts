/**
 * Request-builder tests for the Google Calendar tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { createTool } from '@/tools/google_calendar/create'
import { getTool } from '@/tools/google_calendar/get'
import { inviteTool } from '@/tools/google_calendar/invite'
import { listTool } from '@/tools/google_calendar/list'
import { quickAddTool } from '@/tools/google_calendar/quick_add'
import { updateTool } from '@/tools/google_calendar/update'

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

describe('Google Calendar tools', () => {
  it('google_calendar_create: builds its request', () => {
    expect(createTool.id).toBe('google_calendar_create')
    expect(createTool.request.method).toBe('POST')
    const u =
      typeof createTool.request.url === 'function'
        ? (createTool.request.url as any)(P)
        : createTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(createTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof createTool.transformResponse).toBe('function')
  })

  it('google_calendar_get: builds its request', () => {
    expect(getTool.id).toBe('google_calendar_get')
    expect(getTool.request.method).toBe('GET')
    const u =
      typeof getTool.request.url === 'function'
        ? (getTool.request.url as any)(P)
        : getTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(getTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getTool.transformResponse).toBe('function')
  })

  it('google_calendar_invite: builds its request', () => {
    expect(inviteTool.id).toBe('google_calendar_invite')
    expect(inviteTool.request.method).toBe('GET')
    const u =
      typeof inviteTool.request.url === 'function'
        ? (inviteTool.request.url as any)(P)
        : inviteTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(inviteTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof inviteTool.transformResponse).toBe('function')
  })

  it('google_calendar_list: builds its request', () => {
    expect(listTool.id).toBe('google_calendar_list')
    expect(listTool.request.method).toBe('GET')
    const u =
      typeof listTool.request.url === 'function'
        ? (listTool.request.url as any)(P)
        : listTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(listTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listTool.transformResponse).toBe('function')
  })

  it('google_calendar_quick_add: builds its request', () => {
    expect(quickAddTool.id).toBe('google_calendar_quick_add')
    expect(quickAddTool.request.method).toBe('POST')
    const u =
      typeof quickAddTool.request.url === 'function'
        ? (quickAddTool.request.url as any)(P)
        : quickAddTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(quickAddTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof quickAddTool.transformResponse).toBe('function')
  })

  it('google_calendar_update: builds its request', () => {
    expect(updateTool.id).toBe('google_calendar_update')
    expect(updateTool.request.method).toBe('GET')
    const u =
      typeof updateTool.request.url === 'function'
        ? (updateTool.request.url as any)(P)
        : updateTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(updateTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof updateTool.transformResponse).toBe('function')
  })
})
