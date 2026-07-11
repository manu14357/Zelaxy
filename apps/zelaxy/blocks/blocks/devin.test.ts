/**
 * Config tests for the Devin block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DevinBlock } from '@/blocks/blocks/devin'

describe('Devin Block Config', () => {
  it('has the correct block type', () => {
    expect(DevinBlock.type).toBe('devin')
  })

  it("is in the 'tools' category", () => {
    expect(DevinBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DevinBlock.tools.access.length).toBeGreaterThan(0)
    expect(DevinBlock.tools.access).toContain('devin_create_session')
    expect(DevinBlock.tools.access).toContain('devin_send_message')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DevinBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DevinBlock.name).toBeTruthy()
    expect(DevinBlock.description).toBeTruthy()
  })
})
