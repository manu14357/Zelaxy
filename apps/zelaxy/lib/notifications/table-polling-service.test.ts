/**
 * Unit tests for the table-row polling service helpers and the trigger/block wiring.
 *
 * The DB-heavy `pollTableTriggers` is covered indirectly: the cursor/dedupe selection and the
 * event-flattening — the parts most likely to break the 3-layer trigger contract — are exercised
 * here as pure functions.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { TableTriggerBlock } from '@/blocks/blocks/table_trigger'
import { tableRowPollingTrigger } from '@/triggers/table'
import {
  buildRowEvent,
  latestCreatedAt,
  pickNewRows,
  type RowRecord,
} from './table-polling-service'

function row(id: string, createdAt: string, data: Record<string, unknown> = {}): RowRecord {
  return { id, tableId: 'tbl_1', data, position: 0, createdAt: new Date(createdAt) }
}

describe('table-polling-service helpers', () => {
  describe('pickNewRows', () => {
    it('excludes already-seen rows and preserves order', () => {
      const rows = [
        row('a', '2024-01-01T00:00:00Z'),
        row('b', '2024-01-02T00:00:00Z'),
        row('c', '2024-01-03T00:00:00Z'),
      ]
      const result = pickNewRows(rows, new Set(['a']), 10)
      expect(result.map((r) => r.id)).toEqual(['b', 'c'])
    })

    it('caps the number of rows returned', () => {
      const rows = [
        row('a', '2024-01-01T00:00:00Z'),
        row('b', '2024-01-02T00:00:00Z'),
        row('c', '2024-01-03T00:00:00Z'),
      ]
      expect(pickNewRows(rows, new Set(), 2).map((r) => r.id)).toEqual(['a', 'b'])
    })

    it('returns nothing when every row was seen (first-poll seed then no new rows)', () => {
      const rows = [row('a', '2024-01-01T00:00:00Z'), row('b', '2024-01-02T00:00:00Z')]
      expect(pickNewRows(rows, new Set(['a', 'b']), 10)).toEqual([])
    })
  })

  describe('buildRowEvent', () => {
    it('flattens a row into the delivered event shape', () => {
      const r: RowRecord = {
        id: 'row_1',
        tableId: 'tbl_1',
        data: { email: 'a@b.com', name: 'A' },
        position: 42,
        createdAt: new Date('2024-01-15T13:14:15.000Z'),
      }
      expect(buildRowEvent(r, 'Signups')).toEqual({
        row_id: 'row_1',
        table_id: 'tbl_1',
        table_name: 'Signups',
        data: { email: 'a@b.com', name: 'A' },
        position: 42,
        created_at: '2024-01-15T13:14:15.000Z',
      })
    })

    it('coerces null data/position defensively', () => {
      const r = {
        id: 'row_2',
        tableId: 'tbl_1',
        data: null as any,
        position: null as any,
        createdAt: new Date('2024-01-15T13:14:15.000Z'),
      }
      const event = buildRowEvent(r, 'T')
      expect(event.data).toEqual({})
      expect(event.position).toBe(0)
    })
  })

  describe('latestCreatedAt', () => {
    it('returns the newest createdAt', () => {
      const rows = [
        row('a', '2024-01-01T00:00:00Z'),
        row('c', '2024-01-03T00:00:00Z'),
        row('b', '2024-01-02T00:00:00Z'),
      ]
      expect(latestCreatedAt(rows)?.toISOString()).toBe('2024-01-03T00:00:00.000Z')
    })

    it('returns undefined for no rows', () => {
      expect(latestCreatedAt([])).toBeUndefined()
    })
  })
})

describe('table trigger contract', () => {
  it('trigger provider derives to `table` from the client suffix strip', () => {
    // The trigger-config client computes provider = id.replace(/_webhook|_poller$/, '').
    expect(tableRowPollingTrigger.id.replace(/_webhook|_poller$/, '')).toBe('table')
    expect(tableRowPollingTrigger.provider).toBe('table')
  })

  it('block subBlock wires to the trigger provider and id', () => {
    const sub = TableTriggerBlock.subBlocks.find((s) => s.type === 'trigger-config')
    expect(sub?.triggerProvider).toBe('table')
    expect(sub?.availableTriggers).toContain('table_poller')
    expect(TableTriggerBlock.triggers?.available).toContain('table_poller')
  })

  it('block outputs match the flattened trigger outputs', () => {
    const triggerKeys = Object.keys(tableRowPollingTrigger.outputs)
    for (const key of Object.keys(TableTriggerBlock.outputs)) {
      expect(triggerKeys).toContain(key)
    }
  })
})
