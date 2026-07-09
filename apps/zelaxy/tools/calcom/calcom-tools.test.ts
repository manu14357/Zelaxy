/**
 * Request-builder tests for the Cal.com tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import {
  calcomCancelBookingTool,
  calcomCreateBookingTool,
  calcomGetBookingTool,
  calcomGetSlotsTool,
  calcomListBookingsTool,
  calcomListEventTypesTool,
} from '@/tools/calcom'

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

describe('Cal.com tools', () => {
  it('calcom_list_bookings: builds its request', () => {
    expect(calcomListBookingsTool.id).toBe('calcom_list_bookings')
    expect(calcomListBookingsTool.request.method).toBeTruthy()
    const u =
      typeof calcomListBookingsTool.request.url === 'function'
        ? (calcomListBookingsTool.request.url as any)(P)
        : calcomListBookingsTool.request.url
    expect(String(u)).toContain('api.cal.com')
    expect(Object.keys(calcomListBookingsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calcomListBookingsTool.transformResponse).toBe('function')
  })

  it('calcom_create_booking: builds its request', () => {
    expect(calcomCreateBookingTool.id).toBe('calcom_create_booking')
    expect(calcomCreateBookingTool.request.method).toBeTruthy()
    const u =
      typeof calcomCreateBookingTool.request.url === 'function'
        ? (calcomCreateBookingTool.request.url as any)(P)
        : calcomCreateBookingTool.request.url
    expect(String(u)).toContain('api.cal.com')
    expect(Object.keys(calcomCreateBookingTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calcomCreateBookingTool.transformResponse).toBe('function')
  })

  it('calcom_get_booking: builds its request', () => {
    expect(calcomGetBookingTool.id).toBe('calcom_get_booking')
    expect(calcomGetBookingTool.request.method).toBe('GET')
    const u =
      typeof calcomGetBookingTool.request.url === 'function'
        ? (calcomGetBookingTool.request.url as any)(P)
        : calcomGetBookingTool.request.url
    expect(String(u)).toContain('api.cal.com')
    expect(Object.keys(calcomGetBookingTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calcomGetBookingTool.transformResponse).toBe('function')
  })

  it('calcom_cancel_booking: builds its request', () => {
    expect(calcomCancelBookingTool.id).toBe('calcom_cancel_booking')
    expect(calcomCancelBookingTool.request.method).toBe('POST')
    const u =
      typeof calcomCancelBookingTool.request.url === 'function'
        ? (calcomCancelBookingTool.request.url as any)(P)
        : calcomCancelBookingTool.request.url
    expect(String(u)).toContain('api.cal.com')
    expect(Object.keys(calcomCancelBookingTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calcomCancelBookingTool.transformResponse).toBe('function')
  })

  it('calcom_get_slots: builds its request', () => {
    expect(calcomGetSlotsTool.id).toBe('calcom_get_slots')
    expect(calcomGetSlotsTool.request.method).toBeTruthy()
    const u =
      typeof calcomGetSlotsTool.request.url === 'function'
        ? (calcomGetSlotsTool.request.url as any)(P)
        : calcomGetSlotsTool.request.url
    expect(String(u)).toContain('api.cal.com')
    expect(Object.keys(calcomGetSlotsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calcomGetSlotsTool.transformResponse).toBe('function')
  })

  it('calcom_list_event_types: builds its request', () => {
    expect(calcomListEventTypesTool.id).toBe('calcom_list_event_types')
    expect(calcomListEventTypesTool.request.method).toBe('GET')
    const u =
      typeof calcomListEventTypesTool.request.url === 'function'
        ? (calcomListEventTypesTool.request.url as any)(P)
        : calcomListEventTypesTool.request.url
    expect(String(u)).toContain('api.cal.com')
    expect(Object.keys(calcomListEventTypesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof calcomListEventTypesTool.transformResponse).toBe('function')
  })
})
