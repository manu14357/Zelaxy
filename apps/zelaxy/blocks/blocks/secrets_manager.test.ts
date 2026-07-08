/**
 * Config tests for the Secrets Manager block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { SecretsManagerBlock } from '@/blocks/blocks/secrets_manager'

describe('Secrets Manager Block Config', () => {
  it('has the correct block type', () => {
    expect(SecretsManagerBlock.type).toBe('secrets_manager')
  })

  it("is in the 'tools' category", () => {
    expect(SecretsManagerBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(SecretsManagerBlock.tools.access.length).toBeGreaterThan(0)
    expect(SecretsManagerBlock.tools.access).toContain('secrets_manager_get_secret_value')
    expect(SecretsManagerBlock.tools.access).toContain('secrets_manager_list_secrets')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of SecretsManagerBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(SecretsManagerBlock.name).toBeTruthy()
    expect(SecretsManagerBlock.description).toBeTruthy()
  })
})
