/**
 * Tests for Resend block definition
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ResendBlock } from '@/blocks/blocks/resend'

describe('Resend Block Config', () => {
  it('should have correct block type', () => {
    expect(ResendBlock.type).toBe('resend')
  })

  it('should be in tools category', () => {
    expect(ResendBlock.category).toBe('tools')
  })

  it('should reference all resend tools', () => {
    expect(ResendBlock.tools.access).toContain('resend_send')
    expect(ResendBlock.tools.access).toContain('resend_batch')
    expect(ResendBlock.tools.access).toContain('resend_get')
    expect(ResendBlock.tools.access).toContain('resend_cancel')
  })

  it('should have tools.config.tool function', () => {
    expect(typeof ResendBlock.tools.config!.tool).toBe('function')
  })

  it('should route to correct tool based on action', () => {
    const toolFn = ResendBlock.tools.config!.tool!
    expect(toolFn({ action: 'send' })).toBe('resend_send')
    expect(toolFn({ action: 'batch' })).toBe('resend_batch')
    expect(toolFn({ action: 'get' })).toBe('resend_get')
    expect(toolFn({ action: 'cancel' })).toBe('resend_cancel')
  })

  it('should default to resend_send for unknown action', () => {
    const toolFn = ResendBlock.tools.config!.tool!
    expect(toolFn({ action: 'unknown' })).toBe('resend_send')
    expect(toolFn({})).toBe('resend_send')
  })

  it('should have apiKey sub-block with password flag', () => {
    const apiKeyBlock = ResendBlock.subBlocks.find((sb) => sb.id === 'apiKey')
    expect(apiKeyBlock).toBeDefined()
    expect(apiKeyBlock!.type).toBe('short-input')
    expect(apiKeyBlock!.password).toBe(true)
    expect(apiKeyBlock!.required).toBe(true)
  })

  it('should have action dropdown with all operations', () => {
    const actionBlock = ResendBlock.subBlocks.find((sb) => sb.id === 'action')
    expect(actionBlock).toBeDefined()
    expect(actionBlock!.type).toBe('dropdown')

    const options = actionBlock!.options as { label: string; id: string }[]
    const optionIds = options.map((o) => o.id)
    expect(optionIds).toContain('send')
    expect(optionIds).toContain('batch')
    expect(optionIds).toContain('get')
    expect(optionIds).toContain('cancel')
  })

  it('should default action to send', () => {
    const actionBlock = ResendBlock.subBlocks.find((sb) => sb.id === 'action')
    expect(actionBlock!.value!({})).toBe('send')
  })

  it('should have from/to/subject sub-blocks for send action', () => {
    const fromBlock = ResendBlock.subBlocks.find((sb) => sb.id === 'from')
    const toBlock = ResendBlock.subBlocks.find((sb) => sb.id === 'to')
    const subjectBlock = ResendBlock.subBlocks.find((sb) => sb.id === 'subject')

    expect(fromBlock).toBeDefined()
    expect(fromBlock!.required).toBe(true)
    expect(fromBlock!.condition).toEqual({ field: 'action', value: 'send' })

    expect(toBlock).toBeDefined()
    expect(toBlock!.required).toBe(true)
    expect(toBlock!.condition).toEqual({ field: 'action', value: 'send' })

    expect(subjectBlock).toBeDefined()
    expect(subjectBlock!.required).toBe(true)
    expect(subjectBlock!.condition).toEqual({ field: 'action', value: 'send' })
  })

  it('should have html body for send action', () => {
    const htmlBlock = ResendBlock.subBlocks.find((sb) => sb.id === 'html')
    expect(htmlBlock).toBeDefined()
    expect(htmlBlock!.type).toBe('long-input')
    expect(htmlBlock!.condition).toEqual({ field: 'action', value: 'send' })
  })

  it('should have advanced email fields (cc, bcc, replyTo, scheduledAt)', () => {
    for (const id of ['cc', 'bcc', 'replyTo', 'scheduledAt']) {
      const block = ResendBlock.subBlocks.find((sb) => sb.id === id)
      expect(block).toBeDefined()
      expect(block!.mode).toBe('advanced')
      expect(block!.condition).toEqual({ field: 'action', value: 'send' })
    }
  })

  it('should have tags, headers, attachments as advanced code blocks', () => {
    for (const id of ['tags', 'headers', 'attachments']) {
      const block = ResendBlock.subBlocks.find((sb) => sb.id === id)
      expect(block).toBeDefined()
      expect(block!.type).toBe('code')
      expect(block!.mode).toBe('advanced')
      expect(block!.condition).toEqual({ field: 'action', value: 'send' })
    }
  })

  it('should have emails sub-block for batch action', () => {
    const emailsBlock = ResendBlock.subBlocks.find((sb) => sb.id === 'emails')
    expect(emailsBlock).toBeDefined()
    expect(emailsBlock!.type).toBe('code')
    expect(emailsBlock!.required).toBe(true)
    expect(emailsBlock!.condition).toEqual({ field: 'action', value: 'batch' })
    expect(emailsBlock!.wandConfig).toBeDefined()
  })

  it('should have emailId sub-block for get/cancel actions', () => {
    const emailIdBlock = ResendBlock.subBlocks.find((sb) => sb.id === 'emailId')
    expect(emailIdBlock).toBeDefined()
    expect(emailIdBlock!.required).toBe(true)
    expect(emailIdBlock!.condition).toEqual({ field: 'action', value: ['get', 'cancel'] })
  })

  it('should define expected inputs', () => {
    expect(ResendBlock.inputs.apiKey).toBeDefined()
    expect(ResendBlock.inputs.action).toBeDefined()
    expect(ResendBlock.inputs.from).toBeDefined()
    expect(ResendBlock.inputs.to).toBeDefined()
    expect(ResendBlock.inputs.subject).toBeDefined()
    expect(ResendBlock.inputs.html).toBeDefined()
    expect(ResendBlock.inputs.text).toBeDefined()
    expect(ResendBlock.inputs.cc).toBeDefined()
    expect(ResendBlock.inputs.bcc).toBeDefined()
    expect(ResendBlock.inputs.replyTo).toBeDefined()
    expect(ResendBlock.inputs.scheduledAt).toBeDefined()
    expect(ResendBlock.inputs.headers).toBeDefined()
    expect(ResendBlock.inputs.tags).toBeDefined()
    expect(ResendBlock.inputs.attachments).toBeDefined()
    expect(ResendBlock.inputs.emails).toBeDefined()
    expect(ResendBlock.inputs.emailId).toBeDefined()
  })

  it('should define expected outputs', () => {
    expect(ResendBlock.outputs.id).toBeDefined()
    expect(ResendBlock.outputs.ids).toBeDefined()
    expect(ResendBlock.outputs.email).toBeDefined()
    expect(ResendBlock.outputs.status).toBeDefined()
    expect(ResendBlock.outputs.error).toBeDefined()
  })

  it('should have black brand color', () => {
    expect(ResendBlock.bgColor).toBe('#000000')
  })

  it('should have an icon', () => {
    expect(ResendBlock.icon).toBeDefined()
  })

  it('should have name and description', () => {
    expect(ResendBlock.name).toBe('Resend')
    expect(ResendBlock.description).toBeTruthy()
    expect(ResendBlock.longDescription).toBeTruthy()
  })
})
