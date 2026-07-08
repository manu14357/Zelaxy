/**
 * Request-builder tests for the IAM tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { getUserTool } from '@/tools/iam/get_user'
import { listRolesTool } from '@/tools/iam/list_roles'
import { listUsersTool } from '@/tools/iam/list_users'

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

describe('IAM tools', () => {
  it('iam_get_user: builds its request', () => {
    expect(getUserTool.id).toBe('iam_get_user')
    expect(getUserTool.request.method).toBe('POST')
    const u =
      typeof getUserTool.request.url === 'function'
        ? (getUserTool.request.url as any)(P)
        : getUserTool.request.url
    expect(String(u)).toContain('iam.amazonaws.com')
    expect(Object.keys(getUserTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getUserTool.transformResponse).toBe('function')
  })

  it('iam_list_roles: builds its request', () => {
    expect(listRolesTool.id).toBe('iam_list_roles')
    expect(listRolesTool.request.method).toBe('POST')
    const u =
      typeof listRolesTool.request.url === 'function'
        ? (listRolesTool.request.url as any)(P)
        : listRolesTool.request.url
    expect(String(u)).toContain('iam.amazonaws.com')
    expect(Object.keys(listRolesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listRolesTool.transformResponse).toBe('function')
  })

  it('iam_list_users: builds its request', () => {
    expect(listUsersTool.id).toBe('iam_list_users')
    expect(listUsersTool.request.method).toBe('POST')
    const u =
      typeof listUsersTool.request.url === 'function'
        ? (listUsersTool.request.url as any)(P)
        : listUsersTool.request.url
    expect(String(u)).toContain('iam.amazonaws.com')
    expect(Object.keys(listUsersTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listUsersTool.transformResponse).toBe('function')
  })
})
