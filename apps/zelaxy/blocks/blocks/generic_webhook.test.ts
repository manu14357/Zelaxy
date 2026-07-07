/**
 * Config tests for the Generic Webhook block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GenericWebhookBlock } from '@/blocks/blocks/generic_webhook'

describe('Generic Webhook Block Config', () => {
  it('has the correct block type', () => {
    expect(GenericWebhookBlock.type).toBe('generic_webhook')
  })

  it("is in the 'triggers' category", () => {
    expect(GenericWebhookBlock.category).toBe('triggers')
  })

  it('has no registry tools (trigger entry-point)', () => {
    expect(GenericWebhookBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GenericWebhookBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(GenericWebhookBlock.outputs.payload).toBeDefined()
    expect(GenericWebhookBlock.outputs.headers).toBeDefined()
    expect(GenericWebhookBlock.outputs.method).toBeDefined()
    expect(GenericWebhookBlock.outputs.url).toBeDefined()
    expect(GenericWebhookBlock.outputs.timestamp).toBeDefined()
    expect(GenericWebhookBlock.outputs.event).toBeDefined()
    expect(GenericWebhookBlock.outputs.id).toBeDefined()
    expect(GenericWebhookBlock.outputs.data).toBeDefined()
  })

  it('has a name and description', () => {
    expect(GenericWebhookBlock.name).toBeTruthy()
    expect(GenericWebhookBlock.description).toBeTruthy()
  })
})
