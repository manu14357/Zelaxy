/**
 * Functional tests for the Variables block handler.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { BlockType } from '@/executor/consts'
import { VariablesBlockHandler } from '@/executor/handlers/variables/variables-handler'
import type { ExecutionContext } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

describe('VariablesBlockHandler', () => {
  const handler = new VariablesBlockHandler()
  const block = { id: 'v1', metadata: { id: BlockType.VARIABLES } } as SerializedBlock

  const ctxWith = (vars: Record<string, any>) =>
    ({ workflowVariables: { ...vars } }) as unknown as ExecutionContext

  it('handles only variables blocks', () => {
    expect(handler.canHandle(block)).toBe(true)
    expect(handler.canHandle({ metadata: { id: 'other' } } as SerializedBlock)).toBe(false)
  })

  it('updates an existing workflow variable by name and returns the assignment map', async () => {
    const ctx = ctxWith({ var_1: { name: 'count', value: 0 } })
    const out = await handler.execute(
      block,
      { variables: [{ variableName: 'count', value: 5 }] },
      ctx
    )
    expect(out).toEqual({ count: 5 })
    expect((ctx.workflowVariables as any).var_1.value).toBe(5)
  })

  it('updates by variableId when provided', async () => {
    const ctx = ctxWith({ var_1: { name: 'count', value: 0 } })
    await handler.execute(
      block,
      { variables: [{ variableId: 'var_1', variableName: 'count', value: 9 }] },
      ctx
    )
    expect((ctx.workflowVariables as any).var_1.value).toBe(9)
  })

  it('parses assignments passed as a JSON string', async () => {
    const ctx = ctxWith({ var_1: { name: 'flag', value: false } })
    const out = await handler.execute(
      block,
      { variables: JSON.stringify([{ variableName: 'flag', value: true }]) },
      ctx
    )
    expect(out).toEqual({ flag: true })
    expect((ctx.workflowVariables as any).var_1.value).toBe(true)
  })

  it('still returns the value for an unknown variable (and leaves state untouched)', async () => {
    const ctx = ctxWith({ var_1: { name: 'count', value: 0 } })
    const out = await handler.execute(
      block,
      { variables: [{ variableName: 'missing', value: 1 }] },
      ctx
    )
    expect(out).toEqual({ missing: 1 })
    expect((ctx.workflowVariables as any).var_1.value).toBe(0)
  })

  it('returns an empty map when there are no assignments', async () => {
    const ctx = ctxWith({})
    expect(await handler.execute(block, {}, ctx)).toEqual({})
  })
})
