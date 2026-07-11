/**
 * Config tests for the GitHub block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GitHubBlock } from '@/blocks/blocks/github'

describe('GitHub Block Config', () => {
  it('has the correct block type', () => {
    expect(GitHubBlock.type).toBe('github')
  })

  it("is in the 'tools' category", () => {
    expect(GitHubBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(GitHubBlock.tools.access.length).toBeGreaterThan(0)
    expect(GitHubBlock.tools.access).toContain('github_pr')
    expect(GitHubBlock.tools.access).toContain('github_comment')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GitHubBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(GitHubBlock.name).toBeTruthy()
    expect(GitHubBlock.description).toBeTruthy()
  })
})
