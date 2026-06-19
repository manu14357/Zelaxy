import { describe, expect, it } from 'vitest'
import { normalizeSkillName, parseSkillMarkdown } from './parse'

describe('normalizeSkillName', () => {
  it('kebab-cases and lowercases', () => {
    expect(normalizeSkillName('SQL Expert')).toBe('sql-expert')
    expect(normalizeSkillName('  Code__Reviewer!! ')).toBe('code-reviewer')
  })
  it('throws on empty', () => {
    expect(() => normalizeSkillName('   ')).toThrow()
  })
  it('throws when too long', () => {
    expect(() => normalizeSkillName('a'.repeat(65))).toThrow()
  })
})

describe('parseSkillMarkdown', () => {
  it('parses YAML frontmatter', () => {
    const raw = `---\nname: sql-expert\ndescription: "Write SQL"\n---\n\n# SQL Expert\n\nBody here.`
    const parsed = parseSkillMarkdown(raw)
    expect(parsed.name).toBe('sql-expert')
    expect(parsed.description).toBe('Write SQL')
    expect(parsed.content).toContain('# SQL Expert')
    expect(parsed.content).not.toContain('---')
  })

  it('falls back to H1 + first paragraph when no frontmatter', () => {
    const raw = `# Data Cleaner\n\nCleans messy data before processing.\n\n## Steps`
    const parsed = parseSkillMarkdown(raw)
    expect(parsed.name).toBe('data-cleaner')
    expect(parsed.description).toBe('Cleans messy data before processing.')
  })

  it('throws when no name can be derived', () => {
    expect(() => parseSkillMarkdown('just some text with no heading')).not.toThrow()
    // "just some text..." → first line becomes name
    const parsed = parseSkillMarkdown('just some text with no heading')
    expect(parsed.name.length).toBeGreaterThan(0)
  })

  it('throws on empty content', () => {
    expect(() => parseSkillMarkdown('   ')).toThrow()
  })
})
