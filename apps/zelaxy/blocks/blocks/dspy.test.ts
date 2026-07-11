/**
 * Config tests for the DSPy block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DSPyBlock } from '@/blocks/blocks/dspy'

describe('DSPy Block Config', () => {
  it('has the correct block type', () => {
    expect(DSPyBlock.type).toBe('dspy')
  })

  it("is in the 'tools' category", () => {
    expect(DSPyBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DSPyBlock.tools.access.length).toBeGreaterThan(0)
    expect(DSPyBlock.tools.access).toContain('dspy_run')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DSPyBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DSPyBlock.name).toBeTruthy()
    expect(DSPyBlock.description).toBeTruthy()
  })
})
