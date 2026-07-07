/**
 * Config tests for the Logs block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { LogsBlock } from '@/blocks/blocks/logs'

describe('Logs Block Config', () => {
  it('has the correct block type', () => {
    expect(LogsBlock.type).toBe('logs')
  })

  it("is in the 'blocks' category", () => {
    expect(LogsBlock.category).toBe('blocks')
  })

  it('declares its tool access', () => {
    expect(LogsBlock.tools.access).toContain('logs_query')
    expect(LogsBlock.tools.access).toContain('logs_get')
    expect(LogsBlock.tools.access).toContain('logs_get_execution')
  })

  it('exposes its expected input sub-blocks', () => {
    const ids = LogsBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('operation')
    expect(ids).toContain('workflowIds')
    expect(ids).toContain('limit')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of LogsBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(LogsBlock.outputs.logs).toBeDefined()
    expect(LogsBlock.outputs.total).toBeDefined()
    expect(LogsBlock.outputs.nextCursor).toBeDefined()
    expect(LogsBlock.outputs.log).toBeDefined()
    expect(LogsBlock.outputs.execution).toBeDefined()
  })

  it('resolves the correct tool per operation', () => {
    const tool = LogsBlock.tools.config!.tool
    expect(tool({ operation: 'get_log' })).toBe('logs_get')
    expect(tool({ operation: 'get_execution' })).toBe('logs_get_execution')
    expect(tool({ operation: 'query' })).toBe('logs_query')
    expect(tool({})).toBe('logs_query')
  })

  it('has a name and description', () => {
    expect(LogsBlock.name).toBeTruthy()
    expect(LogsBlock.description).toBeTruthy()
  })
})
