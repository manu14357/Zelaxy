/**
 * Config tests for the GitLab block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GitlabBlock } from '@/blocks/blocks/gitlab'

describe('GitLab Block Config', () => {
  it('has the correct block type', () => {
    expect(GitlabBlock.type).toBe('gitlab')
  })

  it("is in the 'tools' category", () => {
    expect(GitlabBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(GitlabBlock.tools.access.length).toBeGreaterThan(0)
    expect(GitlabBlock.tools.access).toContain('gitlab_list_projects')
    expect(GitlabBlock.tools.access).toContain('gitlab_create_issue')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GitlabBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(GitlabBlock.name).toBeTruthy()
    expect(GitlabBlock.description).toBeTruthy()
  })
})
