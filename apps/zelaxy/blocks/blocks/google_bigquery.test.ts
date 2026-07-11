/**
 * Config tests for the Google BigQuery block definition.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { GoogleBigQueryBlock } from '@/blocks/blocks/google_bigquery'

describe('Google BigQuery Block Config', () => {
  it('has the correct block type', () => {
    expect(GoogleBigQueryBlock.type).toBe('google_bigquery')
  })

  it("is in the 'tools' category", () => {
    expect(GoogleBigQueryBlock.category).toBe('tools')
  })

  it('declares its tool access', () => {
    expect(GoogleBigQueryBlock.tools.access.length).toBeGreaterThan(0)
    expect(GoogleBigQueryBlock.tools.access).toContain('google_bigquery_query')
    expect(GoogleBigQueryBlock.tools.access).toContain('google_bigquery_list_datasets')
  })

  it('has every sub-block with an id and a type', () => {
    for (const sb of GoogleBigQueryBlock.subBlocks) {
      expect(sb.id).toBeTruthy()
      expect(sb.type).toBeTruthy()
    }
  })

  it('has a name and description', () => {
    expect(GoogleBigQueryBlock.name).toBeTruthy()
    expect(GoogleBigQueryBlock.description).toBeTruthy()
  })
})
