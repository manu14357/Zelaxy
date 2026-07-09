/**
 * Request-builder tests for the Calendly tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import {
  calendlyCancelEventTool,
  calendlyGetCurrentUserTool,
  calendlyGetEventTypeTool,
  calendlyGetScheduledEventTool,
  calendlyListEventInviteesTool,
  calendlyListEventTypesTool,
  calendlyListScheduledEventsTool,
} from '@/tools/calendly'

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

describe('Calendly tools', () => {
  it('calendly_get_current_user: builds its request', () => {
    expect(calendlyGetCurrentUserTool.id).toBe('calendly_get_current_user')
    expect(calendlyGetCurrentUserTool.request.method).toBe('GET')
    const u =
      typeof calendlyGetCurrentUserTool.request.url === 'function'
        ? (calendlyGetCurrentUserTool.request.url as any)(P)
        : calendlyGetCurrentUserTool.request.url
    expect(String(u)).toContain('api.calendly.com')
    expect(Object.keys(calendlyGetCurrentUserTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calendlyGetCurrentUserTool.transformResponse).toBe('function')
  })

  it('calendly_list_event_types: builds its request', () => {
    expect(calendlyListEventTypesTool.id).toBe('calendly_list_event_types')
    expect(calendlyListEventTypesTool.request.method).toBeTruthy()
    const u =
      typeof calendlyListEventTypesTool.request.url === 'function'
        ? (calendlyListEventTypesTool.request.url as any)(P)
        : calendlyListEventTypesTool.request.url
    expect(String(u)).toContain('api.calendly.com')
    expect(Object.keys(calendlyListEventTypesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calendlyListEventTypesTool.transformResponse).toBe('function')
  })

  it('calendly_get_event_type: builds its request', () => {
    expect(calendlyGetEventTypeTool.id).toBe('calendly_get_event_type')
    expect(calendlyGetEventTypeTool.request.method).toBe('GET')
    const u =
      typeof calendlyGetEventTypeTool.request.url === 'function'
        ? (calendlyGetEventTypeTool.request.url as any)(P)
        : calendlyGetEventTypeTool.request.url
    expect(String(u)).toContain('api.calendly.com')
    expect(Object.keys(calendlyGetEventTypeTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calendlyGetEventTypeTool.transformResponse).toBe('function')
  })

  it('calendly_list_scheduled_events: builds its request', () => {
    expect(calendlyListScheduledEventsTool.id).toBe('calendly_list_scheduled_events')
    expect(calendlyListScheduledEventsTool.request.method).toBeTruthy()
    const u =
      typeof calendlyListScheduledEventsTool.request.url === 'function'
        ? (calendlyListScheduledEventsTool.request.url as any)(P)
        : calendlyListScheduledEventsTool.request.url
    expect(String(u)).toContain('api.calendly.com')
    expect(Object.keys(calendlyListScheduledEventsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calendlyListScheduledEventsTool.transformResponse).toBe('function')
  })

  it('calendly_get_scheduled_event: builds its request', () => {
    expect(calendlyGetScheduledEventTool.id).toBe('calendly_get_scheduled_event')
    expect(calendlyGetScheduledEventTool.request.method).toBe('GET')
    const u =
      typeof calendlyGetScheduledEventTool.request.url === 'function'
        ? (calendlyGetScheduledEventTool.request.url as any)(P)
        : calendlyGetScheduledEventTool.request.url
    expect(String(u)).toContain('api.calendly.com')
    expect(Object.keys(calendlyGetScheduledEventTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calendlyGetScheduledEventTool.transformResponse).toBe('function')
  })

  it('calendly_list_event_invitees: builds its request', () => {
    expect(calendlyListEventInviteesTool.id).toBe('calendly_list_event_invitees')
    expect(calendlyListEventInviteesTool.request.method).toBeTruthy()
    const u =
      typeof calendlyListEventInviteesTool.request.url === 'function'
        ? (calendlyListEventInviteesTool.request.url as any)(P)
        : calendlyListEventInviteesTool.request.url
    expect(String(u)).toContain('api.calendly.com')
    expect(Object.keys(calendlyListEventInviteesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calendlyListEventInviteesTool.transformResponse).toBe('function')
  })

  it('calendly_cancel_event: builds its request', () => {
    expect(calendlyCancelEventTool.id).toBe('calendly_cancel_event')
    expect(calendlyCancelEventTool.request.method).toBe('POST')
    const u =
      typeof calendlyCancelEventTool.request.url === 'function'
        ? (calendlyCancelEventTool.request.url as any)(P)
        : calendlyCancelEventTool.request.url
    expect(String(u)).toContain('api.calendly.com')
    expect(Object.keys(calendlyCancelEventTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calendlyCancelEventTool.transformResponse).toBe('function')
  })
})
