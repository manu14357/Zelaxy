/**
 * Config tests for the CodePipeline block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { CodepipelineBlock } from '@/blocks/blocks/codepipeline'

describe('CodePipeline Block Config', () => {
  it('has the correct block type', () => {
    expect(CodepipelineBlock.type).toBe('codepipeline')
  })

  it("is in the 'tools' category", () => {
    expect(CodepipelineBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(CodepipelineBlock.tools.access.length).toBeGreaterThan(0)
    expect(CodepipelineBlock.tools.access).toContain('codepipeline_list_pipelines')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of CodepipelineBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(CodepipelineBlock.name).toBeTruthy()
    expect(CodepipelineBlock.description).toBeTruthy()
  })
})
