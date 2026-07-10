/**
 * Config tests for the CloudFormation block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { CloudFormationBlock } from '@/blocks/blocks/cloudformation'

describe('CloudFormation Block Config', () => {
  it('has the correct block type', () => {
    expect(CloudFormationBlock.type).toBe('cloudformation')
  })

  it("is in the 'tools' category", () => {
    expect(CloudFormationBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(CloudFormationBlock.tools.access.length).toBeGreaterThan(0)
    expect(CloudFormationBlock.tools.access).toContain('cloudformation_describe_stacks')
    expect(CloudFormationBlock.tools.access).toContain('cloudformation_get_template')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of CloudFormationBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(CloudFormationBlock.name).toBeTruthy()
    expect(CloudFormationBlock.description).toBeTruthy()
  })
})
