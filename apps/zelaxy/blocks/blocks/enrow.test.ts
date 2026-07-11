/**
 * Config tests for the Enrow block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { EnrowBlock } from '@/blocks/blocks/enrow'

describe('Enrow Block Config', () => {
  it('has the correct block type', () => {
    expect(EnrowBlock.type).toBe('enrow')
  })

  it("is in the 'tools' category", () => {
    expect(EnrowBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(EnrowBlock.tools.access.length).toBeGreaterThan(0)
    expect(EnrowBlock.tools.access).toContain('enrow_find_email')
    expect(EnrowBlock.tools.access).toContain('enrow_verify_email')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of EnrowBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(EnrowBlock.name).toBeTruthy()
    expect(EnrowBlock.description).toBeTruthy()
  })
})
