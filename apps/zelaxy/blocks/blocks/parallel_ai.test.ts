/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ParallelAiBlock } from '@/blocks/blocks/parallel_ai'
import { tools } from '@/tools/registry'

describe('ParallelAiBlock', () => {
  it('is named parallel_ai (not the control-flow parallel block)', () => {
    expect(ParallelAiBlock.type).toBe('parallel_ai')
    expect(ParallelAiBlock.name).toBe('Parallel AI')
  })

  it('every tools.access id resolves in the tool registry', () => {
    for (const id of ParallelAiBlock.tools.access) {
      expect(tools[id], `tool ${id} must be registered`).toBeDefined()
    }
  })

  it('routes each operation to the matching tool', () => {
    const pick = ParallelAiBlock.tools.config?.tool
    expect(pick).toBeTypeOf('function')
    expect(pick?.({ operation: 'search' } as any)).toBe('parallel_search')
    expect(pick?.({ operation: 'extract' } as any)).toBe('parallel_extract')
    expect(pick?.({ operation: 'deep_research' } as any)).toBe('parallel_deep_research')
    // Unknown operation falls back to search.
    expect(pick?.({ operation: 'nonsense' } as any)).toBe('parallel_search')
  })

  it('builds search params: comma queries -> array, non-default mode passthrough', () => {
    const build = ParallelAiBlock.tools.config?.params as (p: any) => Record<string, unknown>
    const out = build({
      operation: 'search',
      search_queries: 'a, b ,,c',
      search_mode: 'agentic',
      max_results: '5',
    })
    expect(out.search_queries).toEqual(['a', 'b', 'c'])
    expect(out.mode).toBe('agentic')
    expect(out.max_results).toBe(5)
  })

  it('builds extract params: excerpts defaults true, full_content defaults false', () => {
    const build = ParallelAiBlock.tools.config?.params as (p: any) => Record<string, unknown>
    const out = build({ operation: 'extract', urls: 'https://a.com' })
    expect(out.excerpts).toBe(true)
    expect(out.full_content).toBe(false)
    const out2 = build({ operation: 'extract', excerpts: 'false', full_content: 'true' })
    expect(out2.excerpts).toBe(false)
    expect(out2.full_content).toBe(true)
  })
})
