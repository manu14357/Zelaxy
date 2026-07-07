/**
 * Config tests for the ZelaxyArena block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ZelaxyArenaBlock } from '@/blocks/blocks/zelaxy_arena'

describe('ZelaxyArena Block Config', () => {
  it('has the correct block type', () => {
    expect(ZelaxyArenaBlock.type).toBe('zelaxy-arena')
  })

  it("is in the 'blocks' category", () => {
    expect(ZelaxyArenaBlock.category).toBe('blocks')
  })

  it('has no registry tools (handled by its dedicated executor handler)', () => {
    expect(ZelaxyArenaBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ZelaxyArenaBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected inputs', () => {
    expect(ZelaxyArenaBlock.inputs.model).toBeDefined()
    expect(ZelaxyArenaBlock.inputs.conversationId).toBeDefined()
    expect(ZelaxyArenaBlock.inputs.systemPrompt).toBeDefined()
    expect(ZelaxyArenaBlock.inputs.messages).toBeDefined()
    expect(ZelaxyArenaBlock.inputs.temperature).toBeDefined()
    expect(ZelaxyArenaBlock.inputs.maxTokens).toBeDefined()
    expect(ZelaxyArenaBlock.inputs.stream).toBeDefined()
  })

  it('defines its expected outputs', () => {
    expect(ZelaxyArenaBlock.outputs.content).toBeDefined()
    expect(ZelaxyArenaBlock.outputs.model).toBeDefined()
    expect(ZelaxyArenaBlock.outputs.conversationId).toBeDefined()
    expect(ZelaxyArenaBlock.outputs.tokens).toBeDefined()
    expect(ZelaxyArenaBlock.outputs.toolCalls).toBeDefined()
    expect(ZelaxyArenaBlock.outputs.cost).toBeDefined()
  })

  it('has a name and description', () => {
    expect(ZelaxyArenaBlock.name).toBeTruthy()
    expect(ZelaxyArenaBlock.description).toBeTruthy()
  })
})
