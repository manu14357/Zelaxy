/**
 * Config tests for the AppConfig block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AppConfigBlock } from '@/blocks/blocks/appconfig'

describe('AppConfig Block Config', () => {
  it('has the correct block type', () => {
    expect(AppConfigBlock.type).toBe('appconfig')
  })

  it("is in the 'tools' category", () => {
    expect(AppConfigBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AppConfigBlock.tools.access.length).toBeGreaterThan(0)
    expect(AppConfigBlock.tools.access).toContain('appconfig_list_applications')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AppConfigBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(AppConfigBlock.name).toBeTruthy()
    expect(AppConfigBlock.description).toBeTruthy()
  })
})
