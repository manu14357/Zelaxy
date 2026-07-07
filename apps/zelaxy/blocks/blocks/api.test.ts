/**
 * Config tests for the API block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { ApiBlock } from '@/blocks/blocks/api'

describe('API Block Config', () => {
  it('has the correct block type', () => {
    expect(ApiBlock.type).toBe('api')
  })

  it("is in the 'blocks' category", () => {
    expect(ApiBlock.category).toBe('blocks')
  })

  it('declares its tool access', () => {
    expect(ApiBlock.tools.access).toContain('http_request')
  })

  it('exposes its expected input sub-blocks', () => {
    const ids = ApiBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('url')
    expect(ids).toContain('method')
    expect(ids).toContain('params')
    expect(ids).toContain('headers')
    expect(ids).toContain('body')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of ApiBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(ApiBlock.outputs.data).toBeDefined()
    expect(ApiBlock.outputs.status).toBeDefined()
    expect(ApiBlock.outputs.headers).toBeDefined()
  })

  it('has a name and description', () => {
    expect(ApiBlock.name).toBeTruthy()
    expect(ApiBlock.description).toBeTruthy()
  })
})
