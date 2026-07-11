/**
 * Request-builder tests for the Google Contacts tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { createContactTool } from '@/tools/google_contacts/create_contact'
import { getContactTool } from '@/tools/google_contacts/get_contact'
import { listContactsTool } from '@/tools/google_contacts/list_contacts'
import { searchContactsTool } from '@/tools/google_contacts/search_contacts'

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

describe('Google Contacts tools', () => {
  it('google_contacts_create_contact: builds its request', () => {
    expect(createContactTool.id).toBe('google_contacts_create_contact')
    expect(createContactTool.request.method).toBe('POST')
    const u =
      typeof createContactTool.request.url === 'function'
        ? (createContactTool.request.url as any)(P)
        : createContactTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(createContactTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof createContactTool.transformResponse).toBe('function')
  })

  it('google_contacts_get_contact: builds its request', () => {
    expect(getContactTool.id).toBe('google_contacts_get_contact')
    expect(getContactTool.request.method).toBe('GET')
    const u =
      typeof getContactTool.request.url === 'function'
        ? (getContactTool.request.url as any)(P)
        : getContactTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(getContactTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getContactTool.transformResponse).toBe('function')
  })

  it('google_contacts_list_contacts: builds its request', () => {
    expect(listContactsTool.id).toBe('google_contacts_list_contacts')
    expect(listContactsTool.request.method).toBe('GET')
    const u =
      typeof listContactsTool.request.url === 'function'
        ? (listContactsTool.request.url as any)(P)
        : listContactsTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(listContactsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listContactsTool.transformResponse).toBe('function')
  })

  it('google_contacts_search_contacts: builds its request', () => {
    expect(searchContactsTool.id).toBe('google_contacts_search_contacts')
    expect(searchContactsTool.request.method).toBe('GET')
    const u =
      typeof searchContactsTool.request.url === 'function'
        ? (searchContactsTool.request.url as any)(P)
        : searchContactsTool.request.url
    expect(String(u)).toContain('googleapis.com')
    expect(Object.keys(searchContactsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof searchContactsTool.transformResponse).toBe('function')
  })
})
