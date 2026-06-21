import { describe, expect, it } from 'vitest'
import {
  computeLayeredPositions,
  type LayoutBlockLike,
} from '@/lib/workflows/autolayout/layered-layout'

function block(overrides: Partial<LayoutBlockLike> = {}): LayoutBlockLike {
  return { position: { x: 0, y: 0 }, height: 90, ...overrides }
}

describe('computeLayeredPositions', () => {
  it('lays a linear workflow out as a clean left-to-right line (same y, increasing x)', () => {
    const blocks: Record<string, LayoutBlockLike> = {
      schedule: block({ type: 'schedule' }),
      gmail: block(),
      agent: block(),
      telegram: block(),
    }
    const edges = [
      { source: 'schedule', target: 'gmail' },
      { source: 'gmail', target: 'agent' },
      { source: 'agent', target: 'telegram' },
    ]

    const positions = computeLayeredPositions(blocks, edges)

    // All four blocks line up on the same row...
    const ys = Object.values(positions).map((p) => p.y)
    expect(new Set(ys).size).toBe(1)

    // ...and march strictly left-to-right following the edges.
    expect(positions.schedule.x).toBeLessThan(positions.gmail.x)
    expect(positions.gmail.x).toBeLessThan(positions.agent.x)
    expect(positions.agent.x).toBeLessThan(positions.telegram.x)

    // The trigger (no incoming edges) is the leftmost block.
    const minX = Math.min(...Object.values(positions).map((p) => p.x))
    expect(positions.schedule.x).toBe(minX)
  })

  it('puts a branch into the same layer (same x), stacked vertically', () => {
    const blocks: Record<string, LayoutBlockLike> = {
      start: block(),
      a: block(),
      b: block(),
    }
    const edges = [
      { source: 'start', target: 'a' },
      { source: 'start', target: 'b' },
    ]

    const positions = computeLayeredPositions(blocks, edges)

    expect(positions.a.x).toBe(positions.b.x)
    expect(positions.a.x).toBeGreaterThan(positions.start.x)
    expect(positions.a.y).not.toBe(positions.b.y)
  })

  it('ignores note blocks and container children', () => {
    const blocks: Record<string, LayoutBlockLike> = {
      start: block(),
      note: block({ type: 'note', position: { x: 999, y: 999 } }),
      child: block({ data: { parentId: 'loop1' }, position: { x: 5, y: 5 } }),
    }

    const positions = computeLayeredPositions(blocks, [])

    expect(positions.note).toBeUndefined()
    expect(positions.child).toBeUndefined()
    expect(positions.start).toBeDefined()
  })

  it('handles a cycle without throwing (every block still gets a position)', () => {
    const blocks: Record<string, LayoutBlockLike> = {
      a: block(),
      b: block(),
    }
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'a' },
    ]

    const positions = computeLayeredPositions(blocks, edges)
    expect(Object.keys(positions).sort()).toEqual(['a', 'b'])
  })
})
