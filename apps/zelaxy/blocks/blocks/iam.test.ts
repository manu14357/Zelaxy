/**
 * Config tests for the IAM block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { IamBlock } from '@/blocks/blocks/iam'

describe('IAM Block Config', () => {
  it('has the correct block type', () => {
    expect(IamBlock.type).toBe('iam')
  })

  it("is in the 'tools' category", () => {
    expect(IamBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(IamBlock.tools.access.length).toBeGreaterThan(0)
    expect(IamBlock.tools.access).toContain('iam_list_users')
    expect(IamBlock.tools.access).toContain('iam_get_user')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of IamBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(IamBlock.name).toBeTruthy()
    expect(IamBlock.description).toBeTruthy()
  })
})
