/**
 * Config tests for the Chat Trigger block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ChatTriggerBlock } from '@/blocks/blocks/chat_trigger'

describe('Chat Trigger Block Config', () => {
  it('has the correct block type', () => {
    expect(ChatTriggerBlock.type).toBe('chat_trigger')
  })

  it("is in the 'triggers' category", () => {
    expect(ChatTriggerBlock.category).toBe('triggers')
  })

  it('has no registry tools (entry-point trigger, executed by the trigger handler)', () => {
    expect(ChatTriggerBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ChatTriggerBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(ChatTriggerBlock.outputs.input).toBeDefined()
    expect(ChatTriggerBlock.outputs.conversationId).toBeDefined()
    expect(ChatTriggerBlock.outputs.files).toBeDefined()
  })

  it('has a name and description', () => {
    expect(ChatTriggerBlock.name).toBeTruthy()
    expect(ChatTriggerBlock.description).toBeTruthy()
  })
})
