/**
 * Request-builder tests for the Attio tools.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { attioCreateNoteTool } from '@/tools/attio/create_note'
import { attioCreateRecordTool } from '@/tools/attio/create_record'
import { attioDeleteRecordTool } from '@/tools/attio/delete_record'
import { attioGetRecordTool } from '@/tools/attio/get_record'
import { attioListNotesTool } from '@/tools/attio/list_notes'
import { attioListRecordsTool } from '@/tools/attio/list_records'
import { attioUpdateRecordTool } from '@/tools/attio/update_record'

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

describe('Attio tools', () => {
  it('attio_create_note: builds its request', () => {
    expect(attioCreateNoteTool.id).toBe('attio_create_note')
    expect(attioCreateNoteTool.request.method).toBe('POST')
    const u =
      typeof attioCreateNoteTool.request.url === 'function'
        ? (attioCreateNoteTool.request.url as any)(P)
        : attioCreateNoteTool.request.url
    expect(String(u)).toContain('api.attio.com/v2')
    expect(Object.keys(attioCreateNoteTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof attioCreateNoteTool.transformResponse).toBe('function')
  })

  it('attio_create_record: builds its request', () => {
    expect(attioCreateRecordTool.id).toBe('attio_create_record')
    expect(attioCreateRecordTool.request.method).toBe('POST')
    const u =
      typeof attioCreateRecordTool.request.url === 'function'
        ? (attioCreateRecordTool.request.url as any)(P)
        : attioCreateRecordTool.request.url
    expect(String(u)).toContain('api.attio.com/v2')
    expect(Object.keys(attioCreateRecordTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof attioCreateRecordTool.transformResponse).toBe('function')
  })

  it('attio_delete_record: builds its request', () => {
    expect(attioDeleteRecordTool.id).toBe('attio_delete_record')
    expect(attioDeleteRecordTool.request.method).toBe('DELETE')
    const u =
      typeof attioDeleteRecordTool.request.url === 'function'
        ? (attioDeleteRecordTool.request.url as any)(P)
        : attioDeleteRecordTool.request.url
    expect(String(u)).toContain('api.attio.com/v2')
    expect(Object.keys(attioDeleteRecordTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof attioDeleteRecordTool.transformResponse).toBe('function')
  })

  it('attio_get_record: builds its request', () => {
    expect(attioGetRecordTool.id).toBe('attio_get_record')
    expect(attioGetRecordTool.request.method).toBe('GET')
    const u =
      typeof attioGetRecordTool.request.url === 'function'
        ? (attioGetRecordTool.request.url as any)(P)
        : attioGetRecordTool.request.url
    expect(String(u)).toContain('api.attio.com/v2')
    expect(Object.keys(attioGetRecordTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof attioGetRecordTool.transformResponse).toBe('function')
  })

  it('attio_list_notes: builds its request', () => {
    expect(attioListNotesTool.id).toBe('attio_list_notes')
    expect(attioListNotesTool.request.method).toBe('GET')
    const u =
      typeof attioListNotesTool.request.url === 'function'
        ? (attioListNotesTool.request.url as any)(P)
        : attioListNotesTool.request.url
    expect(String(u)).toContain('api.attio.com/v2')
    expect(Object.keys(attioListNotesTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof attioListNotesTool.transformResponse).toBe('function')
  })

  it('attio_list_records: builds its request', () => {
    expect(attioListRecordsTool.id).toBe('attio_list_records')
    expect(attioListRecordsTool.request.method).toBe('POST')
    const u =
      typeof attioListRecordsTool.request.url === 'function'
        ? (attioListRecordsTool.request.url as any)(P)
        : attioListRecordsTool.request.url
    expect(String(u)).toContain('api.attio.com/v2')
    expect(Object.keys(attioListRecordsTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof attioListRecordsTool.transformResponse).toBe('function')
  })

  it('attio_update_record: builds its request', () => {
    expect(attioUpdateRecordTool.id).toBe('attio_update_record')
    expect(attioUpdateRecordTool.request.method).toBe('PATCH')
    const u =
      typeof attioUpdateRecordTool.request.url === 'function'
        ? (attioUpdateRecordTool.request.url as any)(P)
        : attioUpdateRecordTool.request.url
    expect(String(u)).toContain('api.attio.com/v2')
    expect(Object.keys(attioUpdateRecordTool.params ?? {}).length).toBeGreaterThan(0)
    expect(typeof attioUpdateRecordTool.transformResponse).toBe('function')
  })
})
