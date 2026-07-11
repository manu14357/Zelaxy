/**
 * Config tests for the Elasticsearch block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ElasticsearchBlock } from '@/blocks/blocks/elasticsearch'

describe('Elasticsearch Block Config', () => {
  it('has the correct block type', () => {
    expect(ElasticsearchBlock.type).toBe('elasticsearch')
  })

  it("is in the 'tools' category", () => {
    expect(ElasticsearchBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(ElasticsearchBlock.tools.access.length).toBeGreaterThan(0)
    expect(ElasticsearchBlock.tools.access).toContain('elasticsearch_search')
    expect(ElasticsearchBlock.tools.access).toContain('elasticsearch_index')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ElasticsearchBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(ElasticsearchBlock.name).toBeTruthy()
    expect(ElasticsearchBlock.description).toBeTruthy()
  })
})
