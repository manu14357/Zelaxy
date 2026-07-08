/**
 * Request-builder tests for the Amplitude tools — asserts each operation's endpoint,
 * method, params and response transform without making network calls.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { amplitudeExportEventsTool } from '@/tools/amplitude/export_events'
import { amplitudeGetUserActivityTool } from '@/tools/amplitude/get_user_activity'
import { amplitudeIdentifyUserTool } from '@/tools/amplitude/identify_user'
import { amplitudeSendEventTool } from '@/tools/amplitude/send_event'
import { amplitudeUserSearchTool } from '@/tools/amplitude/user_search'

const P: any = {
  accessToken: 't',
  apiKey: 'k',
  secretKey: 's',
  baseId: 'b',
  tableId: 'tb',
  recordId: 'r',
  collectionId: 'c',
  applicationId: 'app',
  indexName: 'idx',
  objectID: 'o',
  datasetId: 'd',
  actorId: 'a',
  runId: 'run',
  awsRegion: 'us-east-1',
  region: 'us-east-1',
  queueUrl: 'https://q',
  tableName: 'T',
  userId: 'u',
  email: 'e@x.com',
  domain: 'x.com',
  query: 'q',
  amplitudeId: 'aid',
  user: 'usr',
}

describe('Amplitude tools', () => {
  it('amplitude_export_events: builds its request', () => {
    expect(amplitudeExportEventsTool.id).toBe('amplitude_export_events')
    expect(amplitudeExportEventsTool.request.method).toBe('GET')
    const u =
      typeof amplitudeExportEventsTool.request.url === 'function'
        ? (amplitudeExportEventsTool.request.url as any)(P)
        : amplitudeExportEventsTool.request.url
    expect(String(u)).toContain('amplitude.com/api/2/export')
    expect(Object.keys(amplitudeExportEventsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(amplitudeExportEventsTool.outputs).toBeDefined()
    expect(typeof amplitudeExportEventsTool.transformResponse).toBe('function')
  })

  it('amplitude_get_user_activity: builds its request', () => {
    expect(amplitudeGetUserActivityTool.id).toBe('amplitude_get_user_activity')
    expect(amplitudeGetUserActivityTool.request.method).toBe('GET')
    const u =
      typeof amplitudeGetUserActivityTool.request.url === 'function'
        ? (amplitudeGetUserActivityTool.request.url as any)(P)
        : amplitudeGetUserActivityTool.request.url
    expect(String(u)).toContain('useractivity')
    expect(Object.keys(amplitudeGetUserActivityTool.params ?? {}).length).toBeGreaterThan(0)
    expect(amplitudeGetUserActivityTool.outputs).toBeDefined()
    expect(typeof amplitudeGetUserActivityTool.transformResponse).toBe('function')
  })

  it('amplitude_identify_user: builds its request', () => {
    expect(amplitudeIdentifyUserTool.id).toBe('amplitude_identify_user')
    expect(amplitudeIdentifyUserTool.request.method).toBe('POST')
    const u =
      typeof amplitudeIdentifyUserTool.request.url === 'function'
        ? (amplitudeIdentifyUserTool.request.url as any)(P)
        : amplitudeIdentifyUserTool.request.url
    expect(String(u)).toContain('api2.amplitude.com/identify')
    expect(Object.keys(amplitudeIdentifyUserTool.params ?? {}).length).toBeGreaterThan(0)
    expect(amplitudeIdentifyUserTool.outputs).toBeDefined()
    expect(typeof amplitudeIdentifyUserTool.transformResponse).toBe('function')
  })

  it('amplitude_send_event: builds its request', () => {
    expect(amplitudeSendEventTool.id).toBe('amplitude_send_event')
    expect(amplitudeSendEventTool.request.method).toBe('POST')
    const u =
      typeof amplitudeSendEventTool.request.url === 'function'
        ? (amplitudeSendEventTool.request.url as any)(P)
        : amplitudeSendEventTool.request.url
    expect(String(u)).toContain('api2.amplitude.com/2/httpapi')
    expect(Object.keys(amplitudeSendEventTool.params ?? {}).length).toBeGreaterThan(0)
    expect(amplitudeSendEventTool.outputs).toBeDefined()
    expect(typeof amplitudeSendEventTool.transformResponse).toBe('function')
  })

  it('amplitude_user_search: builds its request', () => {
    expect(amplitudeUserSearchTool.id).toBe('amplitude_user_search')
    expect(amplitudeUserSearchTool.request.method).toBe('GET')
    const u =
      typeof amplitudeUserSearchTool.request.url === 'function'
        ? (amplitudeUserSearchTool.request.url as any)(P)
        : amplitudeUserSearchTool.request.url
    expect(String(u)).toContain('usersearch')
    expect(Object.keys(amplitudeUserSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(amplitudeUserSearchTool.outputs).toBeDefined()
    expect(typeof amplitudeUserSearchTool.transformResponse).toBe('function')
  })
})
