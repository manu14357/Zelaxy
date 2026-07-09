/**
 * Config tests for the Azure DevOps block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { AzureDevOpsBlock } from '@/blocks/blocks/azure_devops'

describe('Azure DevOps Block Config', () => {
  it('has the correct block type', () => {
    expect(AzureDevOpsBlock.type).toBe('azure_devops')
  })

  it("is in the 'tools' category", () => {
    expect(AzureDevOpsBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(AzureDevOpsBlock.tools.access.length).toBeGreaterThan(0)
    expect(AzureDevOpsBlock.tools.access).toContain('azure_devops_list_pipelines')
    expect(AzureDevOpsBlock.tools.access).toContain('azure_devops_create_work_item')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of AzureDevOpsBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(AzureDevOpsBlock.name).toBeTruthy()
    expect(AzureDevOpsBlock.description).toBeTruthy()
  })
})
