/**
 * Config tests for the Discord block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DiscordBlock } from '@/blocks/blocks/discord'

describe('Discord Block Config', () => {
  it('has the correct block type', () => {
    expect(DiscordBlock.type).toBe('discord')
  })

  it("is in the 'tools' category", () => {
    expect(DiscordBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DiscordBlock.tools.access.length).toBeGreaterThan(0)
    expect(DiscordBlock.tools.access).toContain('discord_send_message')
    expect(DiscordBlock.tools.access).toContain('discord_get_messages')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DiscordBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DiscordBlock.name).toBeTruthy()
    expect(DiscordBlock.description).toBeTruthy()
  })
})
