/**
 * Config tests for the Embeddings block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { OpenAIBlock } from '@/blocks/blocks/openai'

describe('Embeddings Block Config', () => {
  it('has the correct block type', () => {
    expect(OpenAIBlock.type).toBe('openai')
  })

  it("is in the 'tools' category", () => {
    expect(OpenAIBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(OpenAIBlock.tools.access.length).toBeGreaterThan(0)
    expect(OpenAIBlock.tools.access).toContain('openai_embeddings')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of OpenAIBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(OpenAIBlock.name).toBeTruthy()
    expect(OpenAIBlock.description).toBeTruthy()
  })
})
