/**
 * Request-builder tests for the Asana tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { asanaAddCommentTool } from '@/tools/asana/add_comment'
import { asanaCreateTaskTool } from '@/tools/asana/create_task'
import { asanaDeleteTaskTool } from '@/tools/asana/delete_task'
import { asanaGetProjectsTool } from '@/tools/asana/get_projects'
import { asanaGetTaskTool } from '@/tools/asana/get_task'
import { asanaSearchTasksTool } from '@/tools/asana/search_tasks'
import { asanaUpdateTaskTool } from '@/tools/asana/update_task'

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

describe('Asana tools', () => {
  it('asana_add_comment: builds its request', () => {
    expect(asanaAddCommentTool.id).toBe('asana_add_comment')
    expect(asanaAddCommentTool.request.method).toBe('POST')
    const u =
      typeof asanaAddCommentTool.request.url === 'function'
        ? (asanaAddCommentTool.request.url as any)(P)
        : asanaAddCommentTool.request.url
    expect(String(u)).toContain('/api/tools/asana/')
    expect(Object.keys(asanaAddCommentTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof asanaAddCommentTool.transformResponse).toBe('function')
  })

  it('asana_create_task: builds its request', () => {
    expect(asanaCreateTaskTool.id).toBe('asana_create_task')
    expect(asanaCreateTaskTool.request.method).toBe('POST')
    const u =
      typeof asanaCreateTaskTool.request.url === 'function'
        ? (asanaCreateTaskTool.request.url as any)(P)
        : asanaCreateTaskTool.request.url
    expect(String(u)).toContain('/api/tools/asana/')
    expect(Object.keys(asanaCreateTaskTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof asanaCreateTaskTool.transformResponse).toBe('function')
  })

  it('asana_delete_task: builds its request', () => {
    expect(asanaDeleteTaskTool.id).toBe('asana_delete_task')
    expect(asanaDeleteTaskTool.request.method).toBe('DELETE')
    const u =
      typeof asanaDeleteTaskTool.request.url === 'function'
        ? (asanaDeleteTaskTool.request.url as any)(P)
        : asanaDeleteTaskTool.request.url
    expect(String(u)).toContain('/api/tools/asana/')
    expect(Object.keys(asanaDeleteTaskTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof asanaDeleteTaskTool.transformResponse).toBe('function')
  })

  it('asana_get_projects: builds its request', () => {
    expect(asanaGetProjectsTool.id).toBe('asana_get_projects')
    expect(asanaGetProjectsTool.request.method).toBe('POST')
    const u =
      typeof asanaGetProjectsTool.request.url === 'function'
        ? (asanaGetProjectsTool.request.url as any)(P)
        : asanaGetProjectsTool.request.url
    expect(String(u)).toContain('/api/tools/asana/')
    expect(Object.keys(asanaGetProjectsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof asanaGetProjectsTool.transformResponse).toBe('function')
  })

  it('asana_get_task: builds its request', () => {
    expect(asanaGetTaskTool.id).toBe('asana_get_task')
    expect(asanaGetTaskTool.request.method).toBe('POST')
    const u =
      typeof asanaGetTaskTool.request.url === 'function'
        ? (asanaGetTaskTool.request.url as any)(P)
        : asanaGetTaskTool.request.url
    expect(String(u)).toContain('/api/tools/asana/')
    expect(Object.keys(asanaGetTaskTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof asanaGetTaskTool.transformResponse).toBe('function')
  })

  it('asana_search_tasks: builds its request', () => {
    expect(asanaSearchTasksTool.id).toBe('asana_search_tasks')
    expect(asanaSearchTasksTool.request.method).toBe('POST')
    const u =
      typeof asanaSearchTasksTool.request.url === 'function'
        ? (asanaSearchTasksTool.request.url as any)(P)
        : asanaSearchTasksTool.request.url
    expect(String(u)).toContain('/api/tools/asana/')
    expect(Object.keys(asanaSearchTasksTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof asanaSearchTasksTool.transformResponse).toBe('function')
  })

  it('asana_update_task: builds its request', () => {
    expect(asanaUpdateTaskTool.id).toBe('asana_update_task')
    expect(asanaUpdateTaskTool.request.method).toBe('PUT')
    const u =
      typeof asanaUpdateTaskTool.request.url === 'function'
        ? (asanaUpdateTaskTool.request.url as any)(P)
        : asanaUpdateTaskTool.request.url
    expect(String(u)).toContain('/api/tools/asana/')
    expect(Object.keys(asanaUpdateTaskTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof asanaUpdateTaskTool.transformResponse).toBe('function')
  })
})
