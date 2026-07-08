/**
 * Regression guard: every block that ships an `oauth-input` sub-block must reference an OAuth
 * provider that is actually registered in OAUTH_PROVIDERS — otherwise the block asks for a
 * credential that can never be connected (it won't appear in Settings → Credentials and has no
 * backend flow). Catches the "block references an unwired OAuth provider" bug class.
 *
 * @vitest-environment node
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { OAUTH_PROVIDERS } from '@/lib/oauth/oauth'

// Blocks that ship an oauth-input but whose backend OAuth is intentionally NOT wired yet because
// their auth is non-standard (Snowflake is account-scoped; DocuSign has base-URI/consent quirks).
// Documented gaps — remove from here once wired.
const KNOWN_UNWIRED = new Set(['snowflake', 'docusign'])

function registeredProviderIds(): Set<string> {
  const ids = new Set<string>()
  for (const provider of Object.values(OAUTH_PROVIDERS)) {
    for (const service of Object.values(provider.services)) ids.add(service.providerId)
  }
  return ids
}

function providersUsedByBlocks(): Set<string> {
  const dir = join(process.cwd(), 'blocks', 'blocks')
  const used = new Set<string>()
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue
    const src = readFileSync(join(dir, file), 'utf8')
    const re = /type:\s*'oauth-input'/g
    let m: RegExpExecArray | null = re.exec(src)
    while (m !== null) {
      const segment = src.slice(m.index, m.index + 400)
      const provider = /provider:\s*'([^']+)'/.exec(segment)
      if (provider) used.add(provider[1])
      m = re.exec(src)
    }
  }
  return used
}

describe('OAuth provider coverage', () => {
  const registered = registeredProviderIds()
  const used = providersUsedByBlocks()

  it('finds oauth-input blocks to check', () => {
    expect(used.size).toBeGreaterThan(0)
  })

  it('every oauth-input provider is registered (except documented gaps)', () => {
    const missing = [...used].filter((p) => !registered.has(p) && !KNOWN_UNWIRED.has(p)).sort()
    expect(missing).toEqual([])
  })

  it('registers the providers added for Asana, Box, Dropbox, Cal.com and Attio', () => {
    for (const p of ['asana', 'box', 'dropbox', 'calcom', 'attio']) {
      expect(registered.has(p)).toBe(true)
    }
  })
})
