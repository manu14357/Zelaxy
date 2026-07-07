/**
 * Config tests for the AgentMail block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AgentMailBlock } from '@/blocks/blocks/agentmail'

describe('AgentMail Block Config', () => {
  it('has the correct block type', () => {
    expect(AgentMailBlock.type).toBe('agentmail')
  })

  it("is in the 'tools' category", () => {
    expect(AgentMailBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AgentMailBlock.tools.access.length).toBeGreaterThan(0)
    expect(AgentMailBlock.tools.access).toContain('agentmail_send_message')
    expect(AgentMailBlock.tools.access).toContain('agentmail_list_threads')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AgentMailBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(AgentMailBlock.outputs.threadId).toBeDefined()
    expect(AgentMailBlock.outputs.messageId).toBeDefined()
    expect(AgentMailBlock.outputs.status).toBeDefined()
    expect(AgentMailBlock.outputs.draftId).toBeDefined()
  })

  it('has a name and description', () => {
    expect(AgentMailBlock.name).toBeTruthy()
    expect(AgentMailBlock.description).toBeTruthy()
  })
})
