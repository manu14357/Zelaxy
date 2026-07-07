/**
 * Functional tests for the AgentPhone tools — request-builder logic only.
 * The outward create-call / create-number paths are asserted here but never fired.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { agentphoneCreateCallTool } from '@/tools/agentphone/create_call'
import { agentphoneCreateNumberTool } from '@/tools/agentphone/create_number'
import { agentphoneListNumbersTool } from '@/tools/agentphone/list_numbers'

describe('agentphone_list_numbers tool', () => {
  it('GETs the numbers endpoint with a bearer token', () => {
    const p: any = { apiKey: 'sk_x' }
    expect((agentphoneListNumbersTool.request.url as any)(p)).toContain(
      'https://api.agentphone.to/v1/numbers'
    )
    expect(agentphoneListNumbersTool.request.method).toBe('GET')
    expect((agentphoneListNumbersTool.request.headers as any)(p).Authorization).toBe('Bearer sk_x')
  })
})

describe('agentphone_create_call tool', () => {
  it('POSTs to the calls endpoint', () => {
    expect(agentphoneCreateCallTool.request.url).toBe('https://api.agentphone.to/v1/calls')
    expect(agentphoneCreateCallTool.request.method).toBe('POST')
  })

  it('builds a call body with agent + destination and optional fields', () => {
    const body: any = agentphoneCreateCallTool.request.body!({
      apiKey: 'k',
      agentId: 'agent-1',
      toNumber: '+15550001111',
      systemPrompt: 'be brief',
    } as any)
    expect(body.agentId).toBe('agent-1')
    expect(body.toNumber).toBe('+15550001111')
    expect(body.systemPrompt).toBe('be brief')
  })
})

describe('agentphone_create_number tool', () => {
  it('POSTs to the numbers endpoint', () => {
    expect(agentphoneCreateNumberTool.request.url).toBe('https://api.agentphone.to/v1/numbers')
    expect(agentphoneCreateNumberTool.request.method).toBe('POST')
  })
})
