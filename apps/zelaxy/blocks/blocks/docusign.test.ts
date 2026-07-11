/**
 * Config tests for the DocuSign block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { DocusignBlock } from '@/blocks/blocks/docusign'

describe('DocuSign Block Config', () => {
  it('has the correct block type', () => {
    expect(DocusignBlock.type).toBe('docusign')
  })

  it("is in the 'tools' category", () => {
    expect(DocusignBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(DocusignBlock.tools.access.length).toBeGreaterThan(0)
    expect(DocusignBlock.tools.access).toContain('docusign_create_envelope')
    expect(DocusignBlock.tools.access).toContain('docusign_send_envelope')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of DocusignBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(DocusignBlock.name).toBeTruthy()
    expect(DocusignBlock.description).toBeTruthy()
  })
})
