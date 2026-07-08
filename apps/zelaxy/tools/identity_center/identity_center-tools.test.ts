/**
 * Request-builder tests for the Identity Center tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { getUserIdTool } from '@/tools/identity_center/get_user_id'
import { listGroupsTool } from '@/tools/identity_center/list_groups'
import { listUsersTool } from '@/tools/identity_center/list_users'

const P: any = {
  apiKey: 'k',
  accessToken: 't',
  awsRegion: 'us-east-1',
  region: 'us-east-1',
  objectType: 'people',
  objectId: 'o',
  recordId: 'r',
  noteId: 'n',
  taskGid: 'tg',
  authorId: 'a',
  id: 'id',
  paperId: 'p',
  applicationId: 'app',
  environmentId: 'env',
  configurationProfileId: 'cp',
  secretId: 's',
  secretName: 'sec',
  queryExecutionId: 'q',
  pipelineName: 'pipe',
  userName: 'u',
  groupId: 'g',
  query: 'q',
  searchQuery: 'q',
  ids: 'x',
}

describe('Identity Center tools', () => {
  it('identity_center_get_user_id: builds its request', () => {
    expect(getUserIdTool.id).toBe('identity_center_get_user_id')
    expect(getUserIdTool.request.method).toBe('POST')
    const u =
      typeof getUserIdTool.request.url === 'function'
        ? (getUserIdTool.request.url as any)(P)
        : getUserIdTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(getUserIdTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getUserIdTool.transformResponse).toBe('function')
  })

  it('identity_center_list_groups: builds its request', () => {
    expect(listGroupsTool.id).toBe('identity_center_list_groups')
    expect(listGroupsTool.request.method).toBe('POST')
    const u =
      typeof listGroupsTool.request.url === 'function'
        ? (listGroupsTool.request.url as any)(P)
        : listGroupsTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(listGroupsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listGroupsTool.transformResponse).toBe('function')
  })

  it('identity_center_list_users: builds its request', () => {
    expect(listUsersTool.id).toBe('identity_center_list_users')
    expect(listUsersTool.request.method).toBe('POST')
    const u =
      typeof listUsersTool.request.url === 'function'
        ? (listUsersTool.request.url as any)(P)
        : listUsersTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(listUsersTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listUsersTool.transformResponse).toBe('function')
  })
})
