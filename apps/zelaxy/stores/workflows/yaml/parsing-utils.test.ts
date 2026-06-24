import { describe, expect, it } from 'vitest'
import { generateBlockConnections, parseBlockConnections } from './parsing-utils'

describe('condition branch handles', () => {
  it('maps a condition if/else onto the node true/false handles on import', () => {
    // The `condition` node renders two always-visible source handles: `true` (if) and `false`
    // (else). An imported edge must target those ids or it renders disconnected on the canvas.
    const { edges } = parseBlockConnections(
      'gate',
      { conditions: { if: 'send_alert', else: 'log_done' } },
      'condition'
    )
    const byTarget = Object.fromEntries(edges.map((e) => [e.target, e.sourceHandle]))
    expect(byTarget.send_alert).toBe('true')
    expect(byTarget.log_done).toBe('false')
  })

  it('round-trips true/false condition edges back to if/else on export', () => {
    const conns = generateBlockConnections('gate', [
      { source: 'gate', target: 'send_alert', sourceHandle: 'true' },
      { source: 'gate', target: 'log_done', sourceHandle: 'false' },
    ])
    expect(conns.conditions).toEqual({ if: 'send_alert', else: 'log_done' })
  })

  it('keeps a non-binary else-if branch in the block-scoped condition- handle form', () => {
    // The binary node has no handle for else-if, so those keep the expanded multi-condition form.
    const { edges } = parseBlockConnections(
      'gate',
      { conditions: { 'else-if': 'middle' } },
      'condition'
    )
    expect(edges[0]?.sourceHandle).toBe('condition-gate-else-if')
  })

  it('still uses condition-<blockId>-<id> for non-condition block types', () => {
    const { edges } = parseBlockConnections('router1', { conditions: { if: 'a' } }, 'router')
    expect(edges[0]?.sourceHandle).toBe('condition-router1-if')
  })
})
