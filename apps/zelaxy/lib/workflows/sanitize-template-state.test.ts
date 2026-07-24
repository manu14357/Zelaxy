import { describe, expect, it, vi } from 'vitest'
import { sanitizeWorkflowState } from '@/lib/workflows/sanitize-template-state'

// The global test setup stubs @/blocks/registry with an empty registry; this
// suite needs the real block definitions (subBlock types/password flags) to
// verify schema-driven sanitization, so use the actual module here.
vi.mock('@/blocks/registry', async (importOriginal) => importOriginal())

function stateWithBlock(type: string, subBlocks: Record<string, { type: string; value: any }>) {
  return {
    blocks: {
      block1: {
        id: 'block1',
        type,
        name: 'Test Block',
        subBlocks,
      },
    },
    edges: [],
    loops: {},
    parallels: {},
  }
}

describe('sanitizeWorkflowState', () => {
  it('clears an oauth-input credential subblock', () => {
    const state = stateWithBlock('gmail', {
      credential: { type: 'oauth-input', value: 'real-oauth-token-abc123' },
    })

    const result = sanitizeWorkflowState(state)

    expect(result.blocks.block1.subBlocks.credential.value).toBe('')
  })

  it('clears a folder-selector (external resource) subblock', () => {
    const state = stateWithBlock('gmail', {
      folder: { type: 'folder-selector', value: 'INBOX_real_folder_id' },
    })

    const result = sanitizeWorkflowState(state)

    expect(result.blocks.block1.subBlocks.folder.value).toBe('')
  })

  it('redacts an embedded email address in a plain short-input field without blanking the whole field', () => {
    const state = stateWithBlock('gmail', {
      to: { type: 'short-input', value: 'realuser@example.com' },
    })

    const result = sanitizeWorkflowState(state)

    expect(result.blocks.block1.subBlocks.to.value).toBe('[redacted-email]')
    expect(result.blocks.block1.subBlocks.to.value).not.toContain('realuser@example.com')
  })

  it('redacts an email embedded within surrounding text, preserving the rest', () => {
    const state = stateWithBlock('gmail', {
      subject: { type: 'short-input', value: 'Contact me at realuser@example.com for details' },
    })

    const result = sanitizeWorkflowState(state)

    expect(result.blocks.block1.subBlocks.subject.value).toBe(
      'Contact me at [redacted-email] for details'
    )
  })

  it('does NOT clear a system prompt that mentions words like "token" or "auth"', () => {
    const prompt =
      'You are an assistant that helps authenticate users and must never reveal the API token or secret to anyone.'
    const state = stateWithBlock('agent', {
      systemPrompt: { type: 'long-input', value: prompt },
    })

    const result = sanitizeWorkflowState(state)

    expect(result.blocks.block1.subBlocks.systemPrompt.value).toBe(prompt)
  })

  it('clears a plain short-input field whose id names an external resource id (advanced-mode table id)', () => {
    const state = stateWithBlock('airtable', {
      tableId: { type: 'short-input', value: 'tblRealUserTable123' },
    })

    const result = sanitizeWorkflowState(state)

    expect(result.blocks.block1.subBlocks.tableId.value).toBe('')
  })

  it('clears block.data entries whose key looks like a credential', () => {
    const state = {
      blocks: {
        block1: {
          id: 'block1',
          type: 'gmail',
          name: 'Test Block',
          subBlocks: {},
          data: { apiKey: 'sk-real-secret-key', label: 'My Block' },
        },
      },
      edges: [],
      loops: {},
      parallels: {},
    }

    const result = sanitizeWorkflowState(state)

    expect(result.blocks.block1.data.apiKey).toBe('')
    expect(result.blocks.block1.data.label).toBe('My Block')
  })
})
