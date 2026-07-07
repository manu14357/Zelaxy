/**
 * Config tests for the Webhook block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { WebhookBlock } from '@/blocks/blocks/webhook'

describe('Webhook Block Config', () => {
  it('has the correct block type', () => {
    expect(WebhookBlock.type).toBe('webhook')
  })

  it("is in the 'triggers' category", () => {
    expect(WebhookBlock.category).toBe('triggers')
  })

  it('has no registry tools (trigger entry-point)', () => {
    expect(WebhookBlock.tools.access).toEqual([])
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of WebhookBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has no static runtime outputs (trigger)', () => {
    expect(Object.keys(WebhookBlock.outputs)).toHaveLength(0)
  })

  it('has a name and description', () => {
    expect(WebhookBlock.name).toBeTruthy()
    expect(WebhookBlock.description).toBeTruthy()
  })
})
