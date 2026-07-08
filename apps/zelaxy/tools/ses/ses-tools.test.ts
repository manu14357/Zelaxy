/**
 * Request-builder tests for the Amazon SES tools — asserts each operation's endpoint,
 * method, params and response transform without making network calls.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { listIdentitiesTool } from '@/tools/ses/list_identities'
import { sendEmailTool } from '@/tools/ses/send_email'

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

describe('Amazon SES tools', () => {
  it('ses_send_email: builds its request', () => {
    expect(sendEmailTool.id).toBe('ses_send_email')
    expect(sendEmailTool.request.method).toBe('POST')
    const u =
      typeof sendEmailTool.request.url === 'function'
        ? (sendEmailTool.request.url as any)(P)
        : sendEmailTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(sendEmailTool.params ?? {}).length).toBeGreaterThan(0)
    expect(sendEmailTool.outputs).toBeDefined()
    expect(typeof sendEmailTool.transformResponse).toBe('function')
  })

  it('ses_list_identities: builds its request', () => {
    expect(listIdentitiesTool.id).toBe('ses_list_identities')
    expect(listIdentitiesTool.request.method).toBe('GET')
    const u =
      typeof listIdentitiesTool.request.url === 'function'
        ? (listIdentitiesTool.request.url as any)(P)
        : listIdentitiesTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(listIdentitiesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(listIdentitiesTool.outputs).toBeDefined()
    expect(typeof listIdentitiesTool.transformResponse).toBe('function')
  })
})
