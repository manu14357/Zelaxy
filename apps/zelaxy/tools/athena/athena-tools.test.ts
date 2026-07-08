/**
 * Request-builder tests for the Athena tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { athenaGetQueryExecutionTool } from '@/tools/athena/get_query_execution'
import { athenaGetQueryResultsTool } from '@/tools/athena/get_query_results'
import { athenaListQueryExecutionsTool } from '@/tools/athena/list_query_executions'
import { athenaStartQueryTool } from '@/tools/athena/start_query'
import { athenaStopQueryTool } from '@/tools/athena/stop_query'

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

describe('Athena tools', () => {
  it('athena_get_query_execution: builds its request', () => {
    expect(athenaGetQueryExecutionTool.id).toBe('athena_get_query_execution')
    expect(athenaGetQueryExecutionTool.request.method).toBe('POST')
    const u =
      typeof athenaGetQueryExecutionTool.request.url === 'function'
        ? (athenaGetQueryExecutionTool.request.url as any)(P)
        : athenaGetQueryExecutionTool.request.url
    expect(String(u)).toContain('/api/tools/athena/')
    expect(Object.keys(athenaGetQueryExecutionTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof athenaGetQueryExecutionTool.transformResponse).toBe('function')
  })

  it('athena_get_query_results: builds its request', () => {
    expect(athenaGetQueryResultsTool.id).toBe('athena_get_query_results')
    expect(athenaGetQueryResultsTool.request.method).toBe('POST')
    const u =
      typeof athenaGetQueryResultsTool.request.url === 'function'
        ? (athenaGetQueryResultsTool.request.url as any)(P)
        : athenaGetQueryResultsTool.request.url
    expect(String(u)).toContain('/api/tools/athena/')
    expect(Object.keys(athenaGetQueryResultsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof athenaGetQueryResultsTool.transformResponse).toBe('function')
  })

  it('athena_list_query_executions: builds its request', () => {
    expect(athenaListQueryExecutionsTool.id).toBe('athena_list_query_executions')
    expect(athenaListQueryExecutionsTool.request.method).toBe('POST')
    const u =
      typeof athenaListQueryExecutionsTool.request.url === 'function'
        ? (athenaListQueryExecutionsTool.request.url as any)(P)
        : athenaListQueryExecutionsTool.request.url
    expect(String(u)).toContain('/api/tools/athena/')
    expect(Object.keys(athenaListQueryExecutionsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof athenaListQueryExecutionsTool.transformResponse).toBe('function')
  })

  it('athena_start_query: builds its request', () => {
    expect(athenaStartQueryTool.id).toBe('athena_start_query')
    expect(athenaStartQueryTool.request.method).toBe('POST')
    const u =
      typeof athenaStartQueryTool.request.url === 'function'
        ? (athenaStartQueryTool.request.url as any)(P)
        : athenaStartQueryTool.request.url
    expect(String(u)).toContain('/api/tools/athena/')
    expect(Object.keys(athenaStartQueryTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof athenaStartQueryTool.transformResponse).toBe('function')
  })

  it('athena_stop_query: builds its request', () => {
    expect(athenaStopQueryTool.id).toBe('athena_stop_query')
    expect(athenaStopQueryTool.request.method).toBe('POST')
    const u =
      typeof athenaStopQueryTool.request.url === 'function'
        ? (athenaStopQueryTool.request.url as any)(P)
        : athenaStopQueryTool.request.url
    expect(String(u)).toContain('/api/tools/athena/')
    expect(Object.keys(athenaStopQueryTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof athenaStopQueryTool.transformResponse).toBe('function')
  })
})
