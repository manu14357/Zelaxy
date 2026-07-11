/**
 * Config tests for the ElevenLabs block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ElevenLabsBlock } from '@/blocks/blocks/elevenlabs'

describe('ElevenLabs Block Config', () => {
  it('has the correct block type', () => {
    expect(ElevenLabsBlock.type).toBe('elevenlabs')
  })

  it("is in the 'tools' category", () => {
    expect(ElevenLabsBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ElevenLabsBlock.tools.access.length).toBeGreaterThan(0)
    expect(ElevenLabsBlock.tools.access).toContain('elevenlabs_tts')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ElevenLabsBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ElevenLabsBlock.name).toBeTruthy()
    expect(ElevenLabsBlock.description).toBeTruthy()
  })
})
