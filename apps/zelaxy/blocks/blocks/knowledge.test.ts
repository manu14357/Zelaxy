/**
 * Config tests for the Knowledge block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { KnowledgeBlock } from '@/blocks/blocks/knowledge'

describe('Knowledge Block Config', () => {
  it('has the correct block type', () => {
    expect(KnowledgeBlock.type).toBe('knowledge')
  })

  it("is in the 'blocks' category", () => {
    expect(KnowledgeBlock.category).toBe('blocks')
  })

  it('declares its tool access', () => {
    expect(KnowledgeBlock.tools.access).toContain('knowledge_search')
    expect(KnowledgeBlock.tools.access).toContain('knowledge_upload_chunk')
    expect(KnowledgeBlock.tools.access).toContain('knowledge_create_document')
  })

  it('exposes its expected input sub-blocks', () => {
    const ids = KnowledgeBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('operation')
    expect(ids).toContain('knowledgeBaseId')
    expect(ids).toContain('query')
    expect(ids).toContain('topK')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of KnowledgeBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(KnowledgeBlock.outputs.results).toBeDefined()
    expect(KnowledgeBlock.outputs.query).toBeDefined()
    expect(KnowledgeBlock.outputs.totalResults).toBeDefined()
  })

  it('resolves the correct tool per operation', () => {
    const tool = KnowledgeBlock.tools.config!.tool
    expect(tool({ operation: 'search' })).toBe('knowledge_search')
    expect(tool({ operation: 'upload_chunk' })).toBe('knowledge_upload_chunk')
    expect(tool({ operation: 'create_document' })).toBe('knowledge_create_document')
    expect(tool({})).toBe('knowledge_search')
  })

  it('has a name and description', () => {
    expect(KnowledgeBlock.name).toBeTruthy()
    expect(KnowledgeBlock.description).toBeTruthy()
  })
})
