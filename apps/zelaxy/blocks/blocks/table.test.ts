/**
 * Config tests for the Table block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { TableBlock } from '@/blocks/blocks/table'

describe('Table Block Config', () => {
  it('has the correct block type', () => {
    expect(TableBlock.type).toBe('table')
  })

  it("is in the 'blocks' category", () => {
    expect(TableBlock.category).toBe('blocks')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of TableBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected inputs', () => {
    expect(TableBlock.inputs.operation).toBeDefined()
    expect(TableBlock.inputs.tableId).toBeDefined()
    expect(TableBlock.inputs.data).toBeDefined()
    expect(TableBlock.inputs.rows).toBeDefined()
    expect(TableBlock.inputs.rowId).toBeDefined()
    expect(TableBlock.inputs.filter).toBeDefined()
    expect(TableBlock.inputs.sort).toBeDefined()
    expect(TableBlock.inputs.limit).toBeDefined()
    expect(TableBlock.inputs.offset).toBeDefined()
  })

  it('defines its expected outputs', () => {
    expect(TableBlock.outputs.success).toBeDefined()
    expect(TableBlock.outputs.row).toBeDefined()
    expect(TableBlock.outputs.operation).toBeDefined()
    expect(TableBlock.outputs.rows).toBeDefined()
    expect(TableBlock.outputs.rowCount).toBeDefined()
    expect(TableBlock.outputs.name).toBeDefined()
    expect(TableBlock.outputs.columns).toBeDefined()
    expect(TableBlock.outputs.message).toBeDefined()
  })

  it('resolves the correct tool per operation', () => {
    const tool = TableBlock.tools.config!.tool
    expect(tool({ operation: 'insert_row' })).toBe('table_insert_row')
    expect(tool({ operation: 'query_rows' })).toBe('table_query_rows')
    expect(tool({ operation: 'get_schema' })).toBe('table_get_schema')
    expect(tool({ operation: 'delete_row' })).toBe('table_delete_row')
    expect(tool({})).toBe('table_query_rows')
  })

  it('has a name and description', () => {
    expect(TableBlock.name).toBeTruthy()
    expect(TableBlock.description).toBeTruthy()
  })
})
