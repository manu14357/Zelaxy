/**
 * SKILL.md parsing + validation for the Agent Skills feature.
 *
 * The open SKILL.md format is a markdown file with YAML frontmatter carrying `name` and
 * `description`; the markdown body is the skill content. We keep the parser dependency-free
 * (no yaml lib) since the frontmatter we care about is just two scalar fields.
 */

export interface ParsedSkill {
  name: string
  description: string
  content: string
}

/** kebab-case, ≤64 chars. Returns a normalized name or throws. */
export function normalizeSkillName(raw: string): string {
  const name = (raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!name) throw new Error('Skill name is required')
  if (name.length > 64) throw new Error('Skill name must be 64 characters or fewer')
  return name
}

function stripQuotes(value: string): string {
  const v = value.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1)
  }
  return v
}

/**
 * Parse a SKILL.md document. Supports YAML frontmatter (`--- ... ---`) with `name`/`description`;
 * falls back to the first H1 as the name and the first paragraph as the description.
 */
export function parseSkillMarkdown(raw: string): ParsedSkill {
  const text = (raw || '').replace(/\r\n/g, '\n').trim()
  let name = ''
  let description = ''
  let body = text

  const fm = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (fm) {
    const front = fm[1]
    body = fm[2].trim()
    for (const line of front.split('\n')) {
      const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
      if (!m) continue
      const key = m[1].toLowerCase()
      const val = stripQuotes(m[2])
      if (key === 'name') name = val
      else if (key === 'description') description = val
    }
  }

  const firstPara = body
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#'))

  if (!name) {
    const h1 = body.match(/^#\s+(.+)$/m)
    // Prefer an H1; otherwise derive a name from the first line of content.
    name = h1 ? h1[1].trim() : (firstPara || '').split(/\s+/).slice(0, 6).join(' ')
  }
  if (!description) {
    if (firstPara) description = firstPara.slice(0, 1024)
  }

  if (!name) throw new Error('Could not determine a skill name (add frontmatter `name:` or an H1)')
  if (!body) throw new Error('Skill content is empty')

  return {
    name: normalizeSkillName(name),
    description: (description || name).slice(0, 1024),
    content: body,
  }
}
