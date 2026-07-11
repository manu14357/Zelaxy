/**
 * Config tests for the Google Contacts block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GoogleContactsBlock } from '@/blocks/blocks/google_contacts'

describe('Google Contacts Block Config', () => {
  it('has the correct block type', () => {
    expect(GoogleContactsBlock.type).toBe('google_contacts')
  })

  it("is in the 'tools' category", () => {
    expect(GoogleContactsBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(GoogleContactsBlock.tools.access.length).toBeGreaterThan(0)
    expect(GoogleContactsBlock.tools.access).toContain('google_contacts_list_contacts')
    expect(GoogleContactsBlock.tools.access).toContain('google_contacts_create_contact')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GoogleContactsBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(GoogleContactsBlock.name).toBeTruthy()
    expect(GoogleContactsBlock.description).toBeTruthy()
  })
})
