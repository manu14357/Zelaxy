/**
 * Request-builder tests for the Apify tools — asserts each operation's endpoint,
 * method, params and response transform without making network calls.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { apifyGetDatasetTool } from '@/tools/apify/get_dataset'
import { apifyGetRunTool } from '@/tools/apify/get_run'
import { apifyRunActorAsyncTool } from '@/tools/apify/run_actor_async'
import { apifyRunActorSyncTool } from '@/tools/apify/run_actor_sync'

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

describe('Apify tools', () => {
  it('apify_get_dataset: builds its request', () => {
    expect(apifyGetDatasetTool.id).toBe('apify_get_dataset')
    expect(apifyGetDatasetTool.request.method).toBe('GET')
    const u =
      typeof apifyGetDatasetTool.request.url === 'function'
        ? (apifyGetDatasetTool.request.url as any)(P)
        : apifyGetDatasetTool.request.url
    expect(String(u)).toContain('api.apify.com/v2/datasets')
    expect(Object.keys(apifyGetDatasetTool.params ?? {}).length).toBeGreaterThan(0)
    expect(apifyGetDatasetTool.outputs).toBeDefined()
    expect(typeof apifyGetDatasetTool.transformResponse).toBe('function')
  })

  it('apify_get_run: builds its request', () => {
    expect(apifyGetRunTool.id).toBe('apify_get_run')
    expect(apifyGetRunTool.request.method).toBe('GET')
    const u =
      typeof apifyGetRunTool.request.url === 'function'
        ? (apifyGetRunTool.request.url as any)(P)
        : apifyGetRunTool.request.url
    expect(String(u)).toContain('api.apify.com/v2/acts')
    expect(Object.keys(apifyGetRunTool.params ?? {}).length).toBeGreaterThan(0)
    expect(apifyGetRunTool.outputs).toBeDefined()
    expect(typeof apifyGetRunTool.transformResponse).toBe('function')
  })

  it('apify_run_actor_async: builds its request', () => {
    expect(apifyRunActorAsyncTool.id).toBe('apify_run_actor_async')
    expect(apifyRunActorAsyncTool.request.method).toBe('POST')
    const u =
      typeof apifyRunActorAsyncTool.request.url === 'function'
        ? (apifyRunActorAsyncTool.request.url as any)(P)
        : apifyRunActorAsyncTool.request.url
    expect(String(u)).toContain('api.apify.com/v2/acts')
    expect(Object.keys(apifyRunActorAsyncTool.params ?? {}).length).toBeGreaterThan(0)
    expect(apifyRunActorAsyncTool.outputs).toBeDefined()
    expect(typeof apifyRunActorAsyncTool.transformResponse).toBe('function')
  })

  it('apify_run_actor_sync: builds its request', () => {
    expect(apifyRunActorSyncTool.id).toBe('apify_run_actor_sync')
    expect(apifyRunActorSyncTool.request.method).toBe('POST')
    const u =
      typeof apifyRunActorSyncTool.request.url === 'function'
        ? (apifyRunActorSyncTool.request.url as any)(P)
        : apifyRunActorSyncTool.request.url
    expect(String(u)).toContain('api.apify.com/v2/acts')
    expect(Object.keys(apifyRunActorSyncTool.params ?? {}).length).toBeGreaterThan(0)
    expect(apifyRunActorSyncTool.outputs).toBeDefined()
    expect(typeof apifyRunActorSyncTool.transformResponse).toBe('function')
  })
})
