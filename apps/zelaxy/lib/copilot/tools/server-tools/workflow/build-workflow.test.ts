import { describe, expect, it } from 'vitest'
import { rewriteBlockRefsToIds } from './build-workflow'

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
