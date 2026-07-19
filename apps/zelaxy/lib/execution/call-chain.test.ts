/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import {
  buildNextCallChain,
  MAX_CALL_CHAIN_DEPTH,
  parseCallChain,
  serializeCallChain,
  validateCallChain,
  ZELAXY_VIA_HEADER,
} from '@/lib/execution/call-chain'

describe('call-chain', () => {
  it('parses an absent or empty header as an empty chain', () => {
    expect(parseCallChain(null)).toEqual([])
    expect(parseCallChain(undefined)).toEqual([])
    expect(parseCallChain('')).toEqual([])
    expect(parseCallChain('   ')).toEqual([])
  })

  it('parses a comma-separated header, trimming and dropping empties', () => {
    expect(parseCallChain('a, b ,,c')).toEqual(['a', 'b', 'c'])
  })

  it('round-trips through serialize/parse', () => {
    const chain = ['wf1', 'wf2', 'wf3']
    expect(parseCallChain(serializeCallChain(chain))).toEqual(chain)
  })

  it('appends the current workflow id without mutating the input', () => {
    const chain = ['a', 'b']
    const next = buildNextCallChain(chain, 'c')
    expect(next).toEqual(['a', 'b', 'c'])
    expect(chain).toEqual(['a', 'b']) // unchanged
  })

  it('permits a chain below the depth limit', () => {
    expect(validateCallChain([])).toBeNull()
    expect(validateCallChain(new Array(MAX_CALL_CHAIN_DEPTH - 1).fill('x'))).toBeNull()
  })

  it('rejects a chain at or above the depth limit', () => {
    const error = validateCallChain(new Array(MAX_CALL_CHAIN_DEPTH).fill('x'))
    expect(error).toContain(String(MAX_CALL_CHAIN_DEPTH))
  })

  it('catches a cross-execution cycle by depth: A->B->A->B... terminates', () => {
    // Simulate workflows A and B calling each other across the API boundary.
    let chain: string[] = []
    let hops = 0
    while (validateCallChain(chain) === null) {
      const current = hops % 2 === 0 ? 'A' : 'B'
      chain = buildNextCallChain(chain, current)
      hops++
      if (hops > 1000) break // safety: must terminate well before this
    }
    expect(hops).toBe(MAX_CALL_CHAIN_DEPTH)
  })

  it('exposes the Zelaxy-branded header name', () => {
    expect(ZELAXY_VIA_HEADER).toBe('X-Zelaxy-Via')
  })
})
