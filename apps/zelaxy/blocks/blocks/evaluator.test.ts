/**
 * Config tests for the Evaluator block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { EvaluatorBlock } from '@/blocks/blocks/evaluator'

describe('Evaluator Block Config', () => {
  it('has the correct block type', () => {
    expect(EvaluatorBlock.type).toBe('evaluator')
  })

  it("is in the 'tools' category", () => {
    expect(EvaluatorBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(EvaluatorBlock.tools.access.length).toBeGreaterThan(0)
    expect(EvaluatorBlock.tools.access).toContain('openai_chat')
    expect(EvaluatorBlock.tools.access).toContain('anthropic_chat')
  })

  it('is provider-driven (config.tool returns a provider id, executed by its handler)', () => {
    expect(EvaluatorBlock.tools.config?.tool).toBeDefined()
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of EvaluatorBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(EvaluatorBlock.name).toBeTruthy()
    expect(EvaluatorBlock.description).toBeTruthy()
  })
})
