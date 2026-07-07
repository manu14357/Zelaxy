/**
 * Config tests for the Agiloft block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AgiloftBlock } from '@/blocks/blocks/agiloft'

describe('Agiloft Block Config', () => {
  it('has the correct block type', () => {
    expect(AgiloftBlock.type).toBe('agiloft')
  })

  it("is in the 'tools' category", () => {
    expect(AgiloftBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AgiloftBlock.tools.access.length).toBeGreaterThan(0)
    expect(AgiloftBlock.tools.access).toContain('agiloft_create_record')
    expect(AgiloftBlock.tools.access).toContain('agiloft_read_record')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AgiloftBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(AgiloftBlock.outputs.recordId).toBeDefined()
    expect(AgiloftBlock.outputs.data).toBeDefined()
    expect(AgiloftBlock.outputs.records).toBeDefined()
    expect(AgiloftBlock.outputs.recordCount).toBeDefined()
  })

  it('has a name and description', () => {
    expect(AgiloftBlock.name).toBeTruthy()
    expect(AgiloftBlock.description).toBeTruthy()
  })
})
