/**
 * Config tests for the AgentPhone block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AgentPhoneBlock } from '@/blocks/blocks/agentphone'

describe('AgentPhone Block Config', () => {
  it('has the correct block type', () => {
    expect(AgentPhoneBlock.type).toBe('agentphone')
  })

  it("is in the 'tools' category", () => {
    expect(AgentPhoneBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AgentPhoneBlock.tools.access.length).toBeGreaterThan(0)
    expect(AgentPhoneBlock.tools.access).toContain('agentphone_create_number')
    expect(AgentPhoneBlock.tools.access).toContain('agentphone_list_numbers')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AgentPhoneBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(AgentPhoneBlock.outputs.phoneNumber).toBeDefined()
    expect(AgentPhoneBlock.outputs.numberId).toBeDefined()
    expect(AgentPhoneBlock.outputs.callId).toBeDefined()
    expect(AgentPhoneBlock.outputs.status).toBeDefined()
  })

  it('has a name and description', () => {
    expect(AgentPhoneBlock.name).toBeTruthy()
    expect(AgentPhoneBlock.description).toBeTruthy()
  })
})
