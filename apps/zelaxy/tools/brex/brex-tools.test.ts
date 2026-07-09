/**
 * Request-builder tests for the Brex tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { listCashAccountsTool } from '@/tools/brex/list_cash_accounts'
import { listCashTransactionsTool } from '@/tools/brex/list_cash_transactions'
import { listUsersTool } from '@/tools/brex/list_users'

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

describe('Brex tools', () => {
  it('brex_list_cash_accounts: builds its request', () => {
    expect(listCashAccountsTool.id).toBe('brex_list_cash_accounts')
    expect(listCashAccountsTool.request.method).toBe('GET')
    const u =
      typeof listCashAccountsTool.request.url === 'function'
        ? (listCashAccountsTool.request.url as any)(P)
        : listCashAccountsTool.request.url
    expect(String(u)).toContain('api.brex.com/v2')
    expect(Object.keys(listCashAccountsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listCashAccountsTool.transformResponse).toBe('function')
  })

  it('brex_list_cash_transactions: builds its request', () => {
    expect(listCashTransactionsTool.id).toBe('brex_list_cash_transactions')
    expect(listCashTransactionsTool.request.method).toBe('GET')
    const u =
      typeof listCashTransactionsTool.request.url === 'function'
        ? (listCashTransactionsTool.request.url as any)(P)
        : listCashTransactionsTool.request.url
    expect(String(u)).toContain('api.brex.com/v2')
    expect(Object.keys(listCashTransactionsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listCashTransactionsTool.transformResponse).toBe('function')
  })

  it('brex_list_users: builds its request', () => {
    expect(listUsersTool.id).toBe('brex_list_users')
    expect(listUsersTool.request.method).toBe('GET')
    const u =
      typeof listUsersTool.request.url === 'function'
        ? (listUsersTool.request.url as any)(P)
        : listUsersTool.request.url
    expect(String(u)).toContain('api.brex.com/v2')
    expect(Object.keys(listUsersTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listUsersTool.transformResponse).toBe('function')
  })
})
