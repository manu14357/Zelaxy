import { describe, expect, it } from 'vitest'
import { rewriteBlockRefsToIds, sanitizeLlmBlockConfigs } from './build-workflow'

describe('sanitizeLlmBlockConfigs', () => {
  it('clears a too-short timeout and a tiny maxTokens on an agent block', () => {
    const blocks = {
      a: {
        id: 'a',
        type: 'agent',
        subBlocks: { timeout: { value: 10 }, maxTokens: { value: 100 } },
      },
    }
    const fixes = sanitizeLlmBlockConfigs(blocks)
    expect(blocks.a.subBlocks.timeout.value).toBeNull()
    expect(blocks.a.subBlocks.maxTokens.value).toBeNull()
    expect(fixes).toHaveLength(2)
  })

  it('keeps generous values untouched', () => {
    const blocks = {
      a: {
        id: 'a',
        type: 'agent',
        subBlocks: { timeout: { value: 120 }, maxTokens: { value: 8000 } },
      },
    }
    sanitizeLlmBlockConfigs(blocks)
    expect(blocks.a.subBlocks.timeout.value).toBe(120)
    expect(blocks.a.subBlocks.maxTokens.value).toBe(8000)
  })

  it('ignores non-LLM blocks (e.g. a function block with a small timeout)', () => {
    const blocks = {
      f: { id: 'f', type: 'function', subBlocks: { timeout: { value: 5 } } },
    }
    sanitizeLlmBlockConfigs(blocks)
    expect(blocks.f.subBlocks.timeout.value).toBe(5)
  })
})

describe('rewriteBlockRefsToIds', () => {
  const mapping = new Map<string, string>([
    ['search_sk', 'preview-1-aaaa'],
    ['analyze_updates', 'preview-2-bbbb'],
  ])

  it('rewrites a {{key.field}} reference to the new preview id', () => {
    expect(rewriteBlockRefsToIds('Summarize: {{search_sk.content}}', mapping)).toBe(
      'Summarize: {{preview-1-aaaa.content}}'
    )
  })

  it('rewrites a bare {{key}} reference (no field)', () => {
    expect(rewriteBlockRefsToIds('{{search_sk}}', mapping)).toBe('{{preview-1-aaaa}}')
  })

  it('preserves nested field paths', () => {
    expect(rewriteBlockRefsToIds('{{search_sk.content.0.text}}', mapping)).toBe(
      '{{preview-1-aaaa.content.0.text}}'
    )
  })

  it('rewrites multiple distinct references in one value', () => {
    const out = rewriteBlockRefsToIds(
      '{{search_sk.content}} + {{analyze_updates.content}}',
      mapping
    )
    expect(out).toBe('{{preview-1-aaaa.content}} + {{preview-2-bbbb.content}}')
  })

  it('leaves env-var references ({{VAR}}, not in the mapping) untouched', () => {
    expect(rewriteBlockRefsToIds('apiKey {{JINA_API_KEY}}', mapping)).toBe(
      'apiKey {{JINA_API_KEY}}'
    )
  })

  it('does not partial-match a longer key', () => {
    // `search_sk` must NOT rewrite inside `search_sk_news`.
    expect(rewriteBlockRefsToIds('{{search_sk_news.content}}', mapping)).toBe(
      '{{search_sk_news.content}}'
    )
  })
})
