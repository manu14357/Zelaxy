/**
 * Config tests for the Credential block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { CredentialBlock } from '@/blocks/blocks/credential'

describe('Credential Block Config', () => {
  it('has the correct block type', () => {
    expect(CredentialBlock.type).toBe('credential')
  })

  it("is in the 'blocks' category", () => {
    expect(CredentialBlock.category).toBe('blocks')
  })

  it('has no registry tools (handled by its dedicated executor handler)', () => {
    expect(CredentialBlock.tools.access).toEqual([])
  })

  it('exposes its expected input sub-blocks', () => {
    const ids = CredentialBlock.subBlocks.map((sb) => sb.id)
    expect(ids).toContain('operation')
    expect(ids).toContain('credentialId')
    expect(ids).toContain('provider')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of CredentialBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('defines its expected outputs', () => {
    expect(CredentialBlock.outputs.credentialId).toBeDefined()
    expect(CredentialBlock.outputs.displayName).toBeDefined()
    expect(CredentialBlock.outputs.providerId).toBeDefined()
    expect(CredentialBlock.outputs.token).toBeDefined()
    expect(CredentialBlock.outputs.credentials).toBeDefined()
    expect(CredentialBlock.outputs.count).toBeDefined()
  })

  it('has a name and description', () => {
    expect(CredentialBlock.name).toBeTruthy()
    expect(CredentialBlock.description).toBeTruthy()
  })
})
