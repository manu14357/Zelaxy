/**
 * Request-builder tests for the Secrets Manager tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { createSecretTool } from '@/tools/secrets_manager/create_secret'
import { getSecretValueTool } from '@/tools/secrets_manager/get_secret_value'
import { listSecretsTool } from '@/tools/secrets_manager/list_secrets'

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

describe('Secrets Manager tools', () => {
  it('secrets_manager_create_secret: builds its request', () => {
    expect(createSecretTool.id).toBe('secrets_manager_create_secret')
    expect(createSecretTool.request.method).toBe('POST')
    const u =
      typeof createSecretTool.request.url === 'function'
        ? (createSecretTool.request.url as any)(P)
        : createSecretTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(createSecretTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof createSecretTool.transformResponse).toBe('function')
  })

  it('secrets_manager_get_secret_value: builds its request', () => {
    expect(getSecretValueTool.id).toBe('secrets_manager_get_secret_value')
    expect(getSecretValueTool.request.method).toBe('POST')
    const u =
      typeof getSecretValueTool.request.url === 'function'
        ? (getSecretValueTool.request.url as any)(P)
        : getSecretValueTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(getSecretValueTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getSecretValueTool.transformResponse).toBe('function')
  })

  it('secrets_manager_list_secrets: builds its request', () => {
    expect(listSecretsTool.id).toBe('secrets_manager_list_secrets')
    expect(listSecretsTool.request.method).toBe('POST')
    const u =
      typeof listSecretsTool.request.url === 'function'
        ? (listSecretsTool.request.url as any)(P)
        : listSecretsTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(listSecretsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listSecretsTool.transformResponse).toBe('function')
  })
})
