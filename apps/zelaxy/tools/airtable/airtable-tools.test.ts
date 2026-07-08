/**
 * Request-builder tests for the Airtable tools — asserts each operation's endpoint,
 * method, params and response transform without making network calls.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { airtableCreateRecordsTool } from '@/tools/airtable/create_records'
import { airtableGetRecordTool } from '@/tools/airtable/get_record'
import { airtableListRecordsTool } from '@/tools/airtable/list_records'
import { airtableUpdateMultipleRecordsTool } from '@/tools/airtable/update_multiple_records'
import { airtableUpdateRecordTool } from '@/tools/airtable/update_record'

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
}

describe('Airtable tools', () => {
  it('airtable_get_record: builds its request', () => {
    expect(airtableGetRecordTool.id).toBe('airtable_get_record')
    expect(airtableGetRecordTool.request.method).toBe('GET')
    const u =
      typeof airtableGetRecordTool.request.url === 'function'
        ? (airtableGetRecordTool.request.url as any)(P)
        : airtableGetRecordTool.request.url
    expect(String(u)).toContain('api.airtable.com/v0')
    expect(Object.keys(airtableGetRecordTool.params ?? {}).length).toBeGreaterThan(0)
    expect(airtableGetRecordTool.outputs).toBeDefined()
    expect(typeof airtableGetRecordTool.transformResponse).toBe('function')
  })

  it('airtable_create_records: builds its request', () => {
    expect(airtableCreateRecordsTool.id).toBe('airtable_create_records')
    expect(airtableCreateRecordsTool.request.method).toBe('POST')
    const u =
      typeof airtableCreateRecordsTool.request.url === 'function'
        ? (airtableCreateRecordsTool.request.url as any)(P)
        : airtableCreateRecordsTool.request.url
    expect(String(u)).toContain('api.airtable.com/v0')
    expect(Object.keys(airtableCreateRecordsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(airtableCreateRecordsTool.outputs).toBeDefined()
    expect(typeof airtableCreateRecordsTool.transformResponse).toBe('function')
  })

  it('airtable_update_record: builds its request', () => {
    expect(airtableUpdateRecordTool.id).toBe('airtable_update_record')
    expect(airtableUpdateRecordTool.request.method).toBe('PATCH')
    const u =
      typeof airtableUpdateRecordTool.request.url === 'function'
        ? (airtableUpdateRecordTool.request.url as any)(P)
        : airtableUpdateRecordTool.request.url
    expect(String(u)).toContain('api.airtable.com/v0')
    expect(Object.keys(airtableUpdateRecordTool.params ?? {}).length).toBeGreaterThan(0)
    expect(airtableUpdateRecordTool.outputs).toBeDefined()
    expect(typeof airtableUpdateRecordTool.transformResponse).toBe('function')
  })

  it('airtable_update_multiple_records: builds its request', () => {
    expect(airtableUpdateMultipleRecordsTool.id).toBe('airtable_update_multiple_records')
    expect(airtableUpdateMultipleRecordsTool.request.method).toBe('PATCH')
    const u =
      typeof airtableUpdateMultipleRecordsTool.request.url === 'function'
        ? (airtableUpdateMultipleRecordsTool.request.url as any)(P)
        : airtableUpdateMultipleRecordsTool.request.url
    expect(String(u)).toContain('api.airtable.com/v0')
    expect(Object.keys(airtableUpdateMultipleRecordsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(airtableUpdateMultipleRecordsTool.outputs).toBeDefined()
    expect(typeof airtableUpdateMultipleRecordsTool.transformResponse).toBe('function')
  })

  it('airtable_list_records: builds its request', () => {
    expect(airtableListRecordsTool.id).toBe('airtable_list_records')
    expect(airtableListRecordsTool.request.method).toBe('GET')
    const u =
      typeof airtableListRecordsTool.request.url === 'function'
        ? (airtableListRecordsTool.request.url as any)(P)
        : airtableListRecordsTool.request.url
    expect(String(u)).toContain('api.airtable.com/v0')
    expect(Object.keys(airtableListRecordsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(airtableListRecordsTool.outputs).toBeDefined()
    expect(typeof airtableListRecordsTool.transformResponse).toBe('function')
  })
})
