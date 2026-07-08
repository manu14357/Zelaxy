/**
 * Request-builder tests for the Amazon SQS tools — asserts each operation's endpoint,
 * method, params and response transform without making network calls.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { listQueuesTool } from '@/tools/sqs/list_queues'
import { receiveMessageTool } from '@/tools/sqs/receive_message'
import { sendMessageTool } from '@/tools/sqs/send_message'

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

describe('Amazon SQS tools', () => {
  it('sqs_send_message: builds its request', () => {
    expect(sendMessageTool.id).toBe('sqs_send_message')
    expect(sendMessageTool.request.method).toBe('POST')
    const u =
      typeof sendMessageTool.request.url === 'function'
        ? (sendMessageTool.request.url as any)(P)
        : sendMessageTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(sendMessageTool.params ?? {}).length).toBeGreaterThan(0)
    expect(sendMessageTool.outputs).toBeDefined()
    expect(typeof sendMessageTool.transformResponse).toBe('function')
  })

  it('sqs_receive_message: builds its request', () => {
    expect(receiveMessageTool.id).toBe('sqs_receive_message')
    expect(receiveMessageTool.request.method).toBe('POST')
    const u =
      typeof receiveMessageTool.request.url === 'function'
        ? (receiveMessageTool.request.url as any)(P)
        : receiveMessageTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(receiveMessageTool.params ?? {}).length).toBeGreaterThan(0)
    expect(receiveMessageTool.outputs).toBeDefined()
    expect(typeof receiveMessageTool.transformResponse).toBe('function')
  })

  it('sqs_list_queues: builds its request', () => {
    expect(listQueuesTool.id).toBe('sqs_list_queues')
    expect(listQueuesTool.request.method).toBe('POST')
    const u =
      typeof listQueuesTool.request.url === 'function'
        ? (listQueuesTool.request.url as any)(P)
        : listQueuesTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(listQueuesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(listQueuesTool.outputs).toBeDefined()
    expect(typeof listQueuesTool.transformResponse).toBe('function')
  })
})
