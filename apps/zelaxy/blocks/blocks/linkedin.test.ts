/**
 * Tests for LinkedIn block definition
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { LinkedInBlock } from '@/blocks/blocks/linkedin'

describe('LinkedIn Block Config', () => {
  it('should have correct block type', () => {
    expect(LinkedInBlock.type).toBe('linkedin')
  })

  it('should be in tools category', () => {
    expect(LinkedInBlock.category).toBe('tools')
  })

  it('should use LinkedIn brand color', () => {
    expect(LinkedInBlock.bgColor).toBe('#0A66C2')
  })

  it('should reference all four LinkedIn tools', () => {
    const tools = LinkedInBlock.tools.access
    expect(tools).toContain('linkedin_create_post')
    expect(tools).toContain('linkedin_get_profile')
    expect(tools).toContain('linkedin_get_company')
    expect(tools).toContain('linkedin_delete_post')
    expect(tools).toHaveLength(4)
  })

  it('should have operation dropdown with four options', () => {
    const operationBlock = LinkedInBlock.subBlocks.find((sb) => sb.id === 'operation')
    expect(operationBlock).toBeDefined()
    expect(operationBlock!.type).toBe('dropdown')
    const options = operationBlock!.options as { label: string; id: string }[]
    expect(options).toHaveLength(4)
    expect(options.map((o) => o.id)).toEqual([
      'linkedin_create_post',
      'linkedin_get_profile',
      'linkedin_get_company',
      'linkedin_delete_post',
    ])
  })

  it('should default operation to create post', () => {
    const operationBlock = LinkedInBlock.subBlocks.find((sb) => sb.id === 'operation')
    expect(operationBlock!.value!({})).toBe('linkedin_create_post')
  })

  it('should have oauth-input credential sub-block', () => {
    const credentialBlock = LinkedInBlock.subBlocks.find((sb) => sb.id === 'credential')
    expect(credentialBlock).toBeDefined()
    expect(credentialBlock!.type).toBe('oauth-input')
    expect(credentialBlock!.provider).toBe('linkedin')
  })

  it('should have text field conditioned on create post', () => {
    const textBlock = LinkedInBlock.subBlocks.find((sb) => sb.id === 'text')
    expect(textBlock).toBeDefined()
    expect(textBlock!.type).toBe('long-input')
    expect(textBlock!.condition).toEqual({ field: 'operation', value: 'linkedin_create_post' })
    expect(textBlock!.required).toBe(true)
  })

  it('should have visibility dropdown conditioned on create post', () => {
    const visibilityBlock = LinkedInBlock.subBlocks.find((sb) => sb.id === 'visibility')
    expect(visibilityBlock).toBeDefined()
    expect(visibilityBlock!.type).toBe('dropdown')
    expect(visibilityBlock!.condition).toEqual({
      field: 'operation',
      value: 'linkedin_create_post',
    })
  })

  it('should have companyOrganizationId conditioned on get company', () => {
    const orgBlock = LinkedInBlock.subBlocks.find((sb) => sb.id === 'companyOrganizationId')
    expect(orgBlock).toBeDefined()
    expect(orgBlock!.condition).toEqual({ field: 'operation', value: 'linkedin_get_company' })
    expect(orgBlock!.required).toBe(true)
  })

  it('should have postId conditioned on delete post', () => {
    const postIdBlock = LinkedInBlock.subBlocks.find((sb) => sb.id === 'postId')
    expect(postIdBlock).toBeDefined()
    expect(postIdBlock!.condition).toEqual({ field: 'operation', value: 'linkedin_delete_post' })
    expect(postIdBlock!.required).toBe(true)
  })

  it('should return correct tool for each operation', () => {
    const config = LinkedInBlock.tools.config!

    expect(config.tool({ operation: 'linkedin_create_post' })).toBe('linkedin_create_post')
    expect(config.tool({ operation: 'linkedin_get_profile' })).toBe('linkedin_get_profile')
    expect(config.tool({ operation: 'linkedin_get_company' })).toBe('linkedin_get_company')
    expect(config.tool({ operation: 'linkedin_delete_post' })).toBe('linkedin_delete_post')
    expect(config.tool({ operation: 'unknown' })).toBe('linkedin_create_post')
  })

  it('should map companyOrganizationId to organizationId in params', () => {
    const config = LinkedInBlock.tools.config!
    const result = config.params!({
      credential: 'test-cred',
      companyOrganizationId: '12345',
    })
    expect(result.organizationId).toBe('12345')
    expect(result.credential).toBe('test-cred')
  })

  it('should define expected inputs', () => {
    expect(LinkedInBlock.inputs.operation).toBeDefined()
    expect(LinkedInBlock.inputs.credential).toBeDefined()
    expect(LinkedInBlock.inputs.text).toBeDefined()
    expect(LinkedInBlock.inputs.visibility).toBeDefined()
    expect(LinkedInBlock.inputs.organizationId).toBeDefined()
    expect(LinkedInBlock.inputs.postId).toBeDefined()
  })

  it('should define expected outputs', () => {
    expect(LinkedInBlock.outputs.post).toBeDefined()
    expect(LinkedInBlock.outputs.profile).toBeDefined()
    expect(LinkedInBlock.outputs.organization).toBeDefined()
    expect(LinkedInBlock.outputs.deleted).toBeDefined()
  })
})
