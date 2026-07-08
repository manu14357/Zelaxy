/**
 * Request-builder tests for the CodePipeline tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { getPipelineTool } from '@/tools/codepipeline/get_pipeline'
import { getPipelineStateTool } from '@/tools/codepipeline/get_pipeline_state'
import { listPipelinesTool } from '@/tools/codepipeline/list_pipelines'

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

describe('CodePipeline tools', () => {
  it('codepipeline_get_pipeline: builds its request', () => {
    expect(getPipelineTool.id).toBe('codepipeline_get_pipeline')
    expect(getPipelineTool.request.method).toBe('POST')
    const u =
      typeof getPipelineTool.request.url === 'function'
        ? (getPipelineTool.request.url as any)(P)
        : getPipelineTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(getPipelineTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getPipelineTool.transformResponse).toBe('function')
  })

  it('codepipeline_get_pipeline_state: builds its request', () => {
    expect(getPipelineStateTool.id).toBe('codepipeline_get_pipeline_state')
    expect(getPipelineStateTool.request.method).toBe('POST')
    const u =
      typeof getPipelineStateTool.request.url === 'function'
        ? (getPipelineStateTool.request.url as any)(P)
        : getPipelineStateTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(getPipelineStateTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof getPipelineStateTool.transformResponse).toBe('function')
  })

  it('codepipeline_list_pipelines: builds its request', () => {
    expect(listPipelinesTool.id).toBe('codepipeline_list_pipelines')
    expect(listPipelinesTool.request.method).toBe('POST')
    const u =
      typeof listPipelinesTool.request.url === 'function'
        ? (listPipelinesTool.request.url as any)(P)
        : listPipelinesTool.request.url
    expect(String(u)).toContain('amazonaws.com')
    expect(Object.keys(listPipelinesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof listPipelinesTool.transformResponse).toBe('function')
  })
})
