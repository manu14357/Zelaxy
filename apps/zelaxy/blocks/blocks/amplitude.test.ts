/**
 * Config tests for the Amplitude block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AmplitudeBlock } from '@/blocks/blocks/amplitude'

describe('Amplitude Block Config', () => {
  it('has the correct block type', () => {
    expect(AmplitudeBlock.type).toBe('amplitude')
  })

  it("is in the 'tools' category", () => {
    expect(AmplitudeBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AmplitudeBlock.tools.access.length).toBeGreaterThan(0)
    expect(AmplitudeBlock.tools.access).toContain('amplitude_send_event')
    expect(AmplitudeBlock.tools.access).toContain('amplitude_identify_user')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AmplitudeBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(AmplitudeBlock.name).toBeTruthy()
    expect(AmplitudeBlock.description).toBeTruthy()
  })
})
