import { describe, expect, it } from 'vitest'
import { normalizeTableName } from './tables-tools'

// Regression coverage for the near-duplicate-table bug: ZelaxyArena's create_table was only
// idempotent on an EXACT name match, so a model re-proposing the same table under a slightly
// different name within one turn (or across turns) would create a visible duplicate. The fallback
// in resolveTableByName uses this normalization; these cases must keep matching.
describe('normalizeTableName', () => {
  it('treats a name with/without the word "table" as the same', () => {
    expect(normalizeTableName('Leads')).toBe(normalizeTableName('Leads Table'))
  })

  it('is case-insensitive', () => {
    expect(normalizeTableName('Leads')).toBe(normalizeTableName('LEADS'))
  })

  it('collapses underscores, hyphens, and extra whitespace to a single space', () => {
    expect(normalizeTableName('leads_table')).toBe(normalizeTableName('Leads Table'))
    expect(normalizeTableName('leads-table')).toBe(normalizeTableName('Leads Table'))
    expect(normalizeTableName('  Leads   Table  ')).toBe(normalizeTableName('Leads Table'))
  })

  it('does not merge genuinely different table names', () => {
    expect(normalizeTableName('Leads')).not.toBe(normalizeTableName('Customers'))
    expect(normalizeTableName('Leads')).not.toBe(normalizeTableName('Lead Sources'))
  })

  it('only strips "table" as a whole word, not as a substring', () => {
    // "Turntables" must not be mangled into something that collides with an unrelated "Turn" table.
    expect(normalizeTableName('Turntables')).toBe('turntables')
  })
})
