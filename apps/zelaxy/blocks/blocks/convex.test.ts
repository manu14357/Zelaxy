/**
 * Config tests for the Convex block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ConvexBlock } from '@/blocks/blocks/convex'

describe('Convex Block Config', () => {
  it('has the correct block type', () => {
    expect(ConvexBlock.type).toBe('convex')
  })

  it("is in the 'tools' category", () => {
    expect(ConvexBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ConvexBlock.tools.access.length).toBeGreaterThan(0)
    expect(ConvexBlock.tools.access).toContain('convex_run_query')
    expect(ConvexBlock.tools.access).toContain('convex_run_mutation')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ConvexBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ConvexBlock.name).toBeTruthy()
    expect(ConvexBlock.description).toBeTruthy()
  })
})
