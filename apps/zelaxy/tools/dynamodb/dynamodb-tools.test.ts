/**
 * Request-builder tests for the DynamoDB tools — asserts each operation's endpoint,
 * method, params and response transform without making network calls.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { dynamodbBatchWriteTool } from '@/tools/dynamodb/batch_write'
import { dynamodbDeleteItemTool } from '@/tools/dynamodb/delete_item'
import { dynamodbGetItemTool } from '@/tools/dynamodb/get_item'
import { dynamodbPutItemTool } from '@/tools/dynamodb/put_item'
import { dynamodbQueryTool } from '@/tools/dynamodb/query'
import { dynamodbScanTool } from '@/tools/dynamodb/scan'
import { dynamodbUpdateItemTool } from '@/tools/dynamodb/update_item'

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

describe('DynamoDB tools', () => {
  it('dynamodb_get_item: builds its request', () => {
    expect(dynamodbGetItemTool.id).toBe('dynamodb_get_item')
    expect(dynamodbGetItemTool.request.method).toBe('POST')
    const u =
      typeof dynamodbGetItemTool.request.url === 'function'
        ? (dynamodbGetItemTool.request.url as any)(P)
        : dynamodbGetItemTool.request.url
    expect(String(u)).toContain('/api/tools/dynamodb')
    expect(Object.keys(dynamodbGetItemTool.params ?? {}).length).toBeGreaterThan(0)
    expect(dynamodbGetItemTool.outputs).toBeDefined()
    expect(typeof dynamodbGetItemTool.transformResponse).toBe('function')
  })

  it('dynamodb_put_item: builds its request', () => {
    expect(dynamodbPutItemTool.id).toBe('dynamodb_put_item')
    expect(dynamodbPutItemTool.request.method).toBe('POST')
    const u =
      typeof dynamodbPutItemTool.request.url === 'function'
        ? (dynamodbPutItemTool.request.url as any)(P)
        : dynamodbPutItemTool.request.url
    expect(String(u)).toContain('/api/tools/dynamodb')
    expect(Object.keys(dynamodbPutItemTool.params ?? {}).length).toBeGreaterThan(0)
    expect(dynamodbPutItemTool.outputs).toBeDefined()
    expect(typeof dynamodbPutItemTool.transformResponse).toBe('function')
  })

  it('dynamodb_query: builds its request', () => {
    expect(dynamodbQueryTool.id).toBe('dynamodb_query')
    expect(dynamodbQueryTool.request.method).toBe('POST')
    const u =
      typeof dynamodbQueryTool.request.url === 'function'
        ? (dynamodbQueryTool.request.url as any)(P)
        : dynamodbQueryTool.request.url
    expect(String(u)).toContain('/api/tools/dynamodb')
    expect(Object.keys(dynamodbQueryTool.params ?? {}).length).toBeGreaterThan(0)
    expect(dynamodbQueryTool.outputs).toBeDefined()
    expect(typeof dynamodbQueryTool.transformResponse).toBe('function')
  })

  it('dynamodb_scan: builds its request', () => {
    expect(dynamodbScanTool.id).toBe('dynamodb_scan')
    expect(dynamodbScanTool.request.method).toBe('POST')
    const u =
      typeof dynamodbScanTool.request.url === 'function'
        ? (dynamodbScanTool.request.url as any)(P)
        : dynamodbScanTool.request.url
    expect(String(u)).toContain('/api/tools/dynamodb')
    expect(Object.keys(dynamodbScanTool.params ?? {}).length).toBeGreaterThan(0)
    expect(dynamodbScanTool.outputs).toBeDefined()
    expect(typeof dynamodbScanTool.transformResponse).toBe('function')
  })

  it('dynamodb_update_item: builds its request', () => {
    expect(dynamodbUpdateItemTool.id).toBe('dynamodb_update_item')
    expect(dynamodbUpdateItemTool.request.method).toBe('POST')
    const u =
      typeof dynamodbUpdateItemTool.request.url === 'function'
        ? (dynamodbUpdateItemTool.request.url as any)(P)
        : dynamodbUpdateItemTool.request.url
    expect(String(u)).toContain('/api/tools/dynamodb')
    expect(Object.keys(dynamodbUpdateItemTool.params ?? {}).length).toBeGreaterThan(0)
    expect(dynamodbUpdateItemTool.outputs).toBeDefined()
    expect(typeof dynamodbUpdateItemTool.transformResponse).toBe('function')
  })

  it('dynamodb_delete_item: builds its request', () => {
    expect(dynamodbDeleteItemTool.id).toBe('dynamodb_delete_item')
    expect(dynamodbDeleteItemTool.request.method).toBe('POST')
    const u =
      typeof dynamodbDeleteItemTool.request.url === 'function'
        ? (dynamodbDeleteItemTool.request.url as any)(P)
        : dynamodbDeleteItemTool.request.url
    expect(String(u)).toContain('/api/tools/dynamodb')
    expect(Object.keys(dynamodbDeleteItemTool.params ?? {}).length).toBeGreaterThan(0)
    expect(dynamodbDeleteItemTool.outputs).toBeDefined()
    expect(typeof dynamodbDeleteItemTool.transformResponse).toBe('function')
  })

  it('dynamodb_batch_write: builds its request', () => {
    expect(dynamodbBatchWriteTool.id).toBe('dynamodb_batch_write')
    expect(dynamodbBatchWriteTool.request.method).toBe('POST')
    const u =
      typeof dynamodbBatchWriteTool.request.url === 'function'
        ? (dynamodbBatchWriteTool.request.url as any)(P)
        : dynamodbBatchWriteTool.request.url
    expect(String(u)).toContain('/api/tools/dynamodb')
    expect(Object.keys(dynamodbBatchWriteTool.params ?? {}).length).toBeGreaterThan(0)
    expect(dynamodbBatchWriteTool.outputs).toBeDefined()
    expect(typeof dynamodbBatchWriteTool.transformResponse).toBe('function')
  })
})
