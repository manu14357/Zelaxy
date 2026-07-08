/**
 * Request-builder tests for the AppConfig tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { listApplicationsTool } from '@/tools/appconfig/list_applications'
import { listConfigurationProfilesTool } from '@/tools/appconfig/list_configuration_profiles'
import { listEnvironmentsTool } from '@/tools/appconfig/list_environments'

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

describe('AppConfig tools', () => {
  it('appconfig_list_applications: builds its request', () => {
    expect(listApplicationsTool.id).toBe('appconfig_list_applications')
    expect(listApplicationsTool.request.method).toBe('GET')
    const u =
      typeof listApplicationsTool.request.url === 'function'
        ? (listApplicationsTool.request.url as any)(P)
        : listApplicationsTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(listApplicationsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listApplicationsTool.transformResponse).toBe('function')
  })

  it('appconfig_list_configuration_profiles: builds its request', () => {
    expect(listConfigurationProfilesTool.id).toBe('appconfig_list_configuration_profiles')
    expect(listConfigurationProfilesTool.request.method).toBe('GET')
    const u =
      typeof listConfigurationProfilesTool.request.url === 'function'
        ? (listConfigurationProfilesTool.request.url as any)(P)
        : listConfigurationProfilesTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(listConfigurationProfilesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listConfigurationProfilesTool.transformResponse).toBe('function')
  })

  it('appconfig_list_environments: builds its request', () => {
    expect(listEnvironmentsTool.id).toBe('appconfig_list_environments')
    expect(listEnvironmentsTool.request.method).toBe('GET')
    const u =
      typeof listEnvironmentsTool.request.url === 'function'
        ? (listEnvironmentsTool.request.url as any)(P)
        : listEnvironmentsTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(listEnvironmentsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listEnvironmentsTool.transformResponse).toBe('function')
  })
})
