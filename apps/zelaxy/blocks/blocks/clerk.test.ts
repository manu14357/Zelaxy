/**
 * Config tests for the Clerk block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ClerkBlock } from '@/blocks/blocks/clerk'

describe('Clerk Block Config', () => {
  it('has the correct block type', () => {
    expect(ClerkBlock.type).toBe('clerk')
  })

  it("is in the 'tools' category", () => {
    expect(ClerkBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ClerkBlock.tools.access.length).toBeGreaterThan(0)
    expect(ClerkBlock.tools.access).toContain('clerk_list_users')
    expect(ClerkBlock.tools.access).toContain('clerk_get_user')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ClerkBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ClerkBlock.name).toBeTruthy()
    expect(ClerkBlock.description).toBeTruthy()
  })
})
