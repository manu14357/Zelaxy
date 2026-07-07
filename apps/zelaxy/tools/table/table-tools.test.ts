/**
 * Functional tests for the Table tools (insert / query / schema / update / delete).
 * Exercises the real request-builder logic — no DB required.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { tableDeleteRowTool } from '@/tools/table/delete_row'
import { tableGetSchemaTool } from '@/tools/table/get_schema'
import { tableInsertRowTool } from '@/tools/table/insert_row'
import { tableQueryRowsTool } from '@/tools/table/query_rows'
import { tableUpdateRowTool } from '@/tools/table/update_row'

const ctx = (workspaceId?: string) => ({ _context: workspaceId ? { workspaceId } : undefined })

describe('table_insert_row tool', () => {
  it('posts to the table rows endpoint', () => {
    expect((tableInsertRowTool.request.url as any)({ tableId: 't1' })).toBe('/api/table/t1/rows')
    expect(tableInsertRowTool.request.method).toBe('POST')
  })

  it('requires a workspaceId in context', () => {
    expect(() => tableInsertRowTool.request.body!({ tableId: 't1', data: {} } as any)).toThrow(
      /Workspace ID is required/
    )
  })

  it('builds a body carrying the row data and workspace', () => {
    const body: any = tableInsertRowTool.request.body!({
      tableId: 't1',
      data: { name: 'Ada' },
      ...ctx('ws-1'),
    } as any)
    expect(body).toEqual({ data: { name: 'Ada' }, workspaceId: 'ws-1' })
  })
})

describe('table_query_rows tool', () => {
  it('requires a workspaceId', () => {
    expect(() => (tableQueryRowsTool.request.url as any)({ tableId: 't1' })).toThrow(
      /Workspace ID is required/
    )
  })

  it('builds a GET url with encoded filter/sort/limit/offset', () => {
    const url = (tableQueryRowsTool.request.url as any)({
      tableId: 't1',
      filter: { name: 'Ada' },
      sort: [{ col: 'name' }],
      limit: 10,
      offset: 5,
      ...ctx('ws-1'),
    })
    expect(url.startsWith('/api/table/t1/rows?')).toBe(true)
    const qs = new URLSearchParams(url.split('?')[1])
    expect(qs.get('workspaceId')).toBe('ws-1')
    expect(JSON.parse(qs.get('filter')!)).toEqual({ name: 'Ada' })
    expect(qs.get('limit')).toBe('10')
    expect(qs.get('offset')).toBe('5')
    expect(tableQueryRowsTool.request.method).toBe('GET')
  })
})

describe('table_get_schema tool', () => {
  it('builds a GET url scoped to the workspace', () => {
    const url = (tableGetSchemaTool.request.url as any)({ tableId: 't1', ...ctx('ws-1') })
    expect(url).toBe('/api/table/t1?workspaceId=ws-1')
    expect(tableGetSchemaTool.request.method).toBe('GET')
  })
})

describe('table_update_row / delete_row tools', () => {
  it('update targets a specific row via PATCH', () => {
    expect((tableUpdateRowTool.request.url as any)({ tableId: 't1', rowId: 'r1' })).toBe(
      '/api/table/t1/rows/r1'
    )
    expect(tableUpdateRowTool.request.method).toBe('PATCH')
  })

  it('delete targets a specific row via DELETE', () => {
    expect((tableDeleteRowTool.request.url as any)({ tableId: 't1', rowId: 'r1' })).toBe(
      '/api/table/t1/rows/r1'
    )
    expect(tableDeleteRowTool.request.method).toBe('DELETE')
  })
})
