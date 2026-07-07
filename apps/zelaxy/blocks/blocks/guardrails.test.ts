/**
 * Config tests for the Guardrails block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GuardrailsBlock } from '@/blocks/blocks/guardrails'

describe('Guardrails Block Config', () => {
  it('has the correct block type', () => {
    expect(GuardrailsBlock.type).toBe('guardrails')
  })

  it("is in the 'blocks' category", () => {
    expect(GuardrailsBlock.category).toBe('blocks')
  })

  it('declares its tool access', () => {
    expect(GuardrailsBlock.tools.access).toContain('guardrails_validate')
  })

  it('exposes its expected input sub-blocks', () => {
    const ids = GuardrailsBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('input')
    expect(ids).toContain('validationType')
    expect(ids).toContain('threshold')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GuardrailsBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(GuardrailsBlock.outputs.passed).toBeDefined()
    expect(GuardrailsBlock.outputs.validationType).toBeDefined()
    expect(GuardrailsBlock.outputs.input).toBeDefined()
    expect(GuardrailsBlock.outputs.score).toBeDefined()
    expect(GuardrailsBlock.outputs.reasoning).toBeDefined()
    expect(GuardrailsBlock.outputs.detectedEntities).toBeDefined()
    expect(GuardrailsBlock.outputs.maskedText).toBeDefined()
    expect(GuardrailsBlock.outputs.error).toBeDefined()
  })

  it('has a name and description', () => {
    expect(GuardrailsBlock.name).toBeTruthy()
    expect(GuardrailsBlock.description).toBeTruthy()
  })
})
