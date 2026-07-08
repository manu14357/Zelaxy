/**
 * Request-builder tests for the Airweave tools — asserts each operation's endpoint,
 * method, params and response transform without making network calls.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { airweaveSearchTool } from '@/tools/airweave/search'

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

describe('Airweave tools', () => {
  it('airweave_search: builds its request', () => {
    expect(airweaveSearchTool.id).toBe('airweave_search')
    expect(airweaveSearchTool.request.method).toBe('POST')
    const u =
      typeof airweaveSearchTool.request.url === 'function'
        ? (airweaveSearchTool.request.url as any)(P)
        : airweaveSearchTool.request.url
    expect(String(u)).toContain('api.airweave.ai/collections')
    expect(Object.keys(airweaveSearchTool.params ?? {}).length).toBeGreaterThan(0)
    expect(airweaveSearchTool.outputs).toBeDefined()
    expect(typeof airweaveSearchTool.transformResponse).toBe('function')
  })
})
