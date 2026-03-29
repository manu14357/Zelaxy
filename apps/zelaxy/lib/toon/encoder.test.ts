import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getToonSystemHint,
  isToonEnabled,
  toonEncodeForLLM,
  toonEncodeWithStats,
  tryParseThenEncode,
} from './encoder'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setToonEnabled(value: string | undefined) {
  if (value === undefined) {
    process.env.TOON_ENABLED = undefined
  } else {
    process.env.TOON_ENABLED = value
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TOON Encoder', () => {
  const originalEnv = process.env.TOON_ENABLED

  afterEach(() => {
    // Restore original env
    if (originalEnv === undefined) {
      process.env.TOON_ENABLED = undefined
    } else {
      process.env.TOON_ENABLED = originalEnv
    }
  })

  // ── isToonEnabled ─────────────────────────────────────────────────────

  describe('isToonEnabled', () => {
    it('returns false when TOON_ENABLED is not set', () => {
      setToonEnabled(undefined)
      expect(isToonEnabled()).toBe(false)
    })

    it('returns false for empty string', () => {
      setToonEnabled('')
      expect(isToonEnabled()).toBe(false)
    })

    it('returns false for "false"', () => {
      setToonEnabled('false')
      expect(isToonEnabled()).toBe(false)
    })

    it.each(['true', 'TRUE', 'True', '1', 'yes', 'YES'])('returns true for "%s"', (val) => {
      setToonEnabled(val)
      expect(isToonEnabled()).toBe(true)
    })
  })

  // ── toonEncodeForLLM ──────────────────────────────────────────────────

  describe('toonEncodeForLLM', () => {
    describe('when TOON is disabled', () => {
      beforeEach(() => setToonEnabled('false'))

      it('returns JSON.stringify for objects', () => {
        const data = { name: 'Alice', role: 'admin' }
        expect(toonEncodeForLLM(data)).toBe(JSON.stringify(data))
      })

      it('returns JSON.stringify for arrays', () => {
        const data = [1, 2, 3]
        expect(toonEncodeForLLM(data)).toBe(JSON.stringify(data))
      })

      it('returns "null" for null/undefined', () => {
        expect(toonEncodeForLLM(null)).toBe('null')
        expect(toonEncodeForLLM(undefined)).toBe('null')
      })
    })

    describe('when TOON is enabled', () => {
      beforeEach(() => setToonEnabled('true'))

      it('encodes a flat object as TOON', () => {
        const data = { name: 'Alice', role: 'admin' }
        const result = toonEncodeForLLM(data)
        // TOON flat object uses key: value lines
        expect(result).toContain('name: Alice')
        expect(result).toContain('role: admin')
        // Should NOT look like JSON
        expect(result).not.toContain('"name"')
      })

      it('encodes a uniform array of objects as tabular TOON', () => {
        const data = [
          { id: 1, name: 'Alice', role: 'admin' },
          { id: 2, name: 'Bob', role: 'user' },
          { id: 3, name: 'Charlie', role: 'user' },
        ]
        const result = toonEncodeForLLM(data)
        // Should contain the tabular header with [N]{fields}:
        expect(result).toMatch(/\[3\]\{id,name,role\}:/)
        // Should contain row data
        expect(result).toContain('Alice')
        expect(result).toContain('Bob')
        expect(result).toContain('Charlie')
      })

      it('encodes nested objects', () => {
        const data = {
          context: { task: 'test', location: 'NYC' },
          users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
        }
        const result = toonEncodeForLLM(data)
        // Should be shorter than JSON
        expect(result.length).toBeLessThan(JSON.stringify(data).length)
      })

      it('returns "null" for null/undefined even when enabled', () => {
        expect(toonEncodeForLLM(null)).toBe('null')
        expect(toonEncodeForLLM(undefined)).toBe('null')
      })

      it('handles primitive values', () => {
        expect(toonEncodeForLLM(42)).toBe('42')
        expect(toonEncodeForLLM('hello')).toBe('hello')
        expect(toonEncodeForLLM(true)).toBe('true')
      })

      it('does not crash on circular references — falls back gracefully', () => {
        const obj: any = { a: 1 }
        obj.self = obj
        // Both TOON encode and JSON.stringify will fail on circular refs,
        // so we just verify it doesn't throw and returns something
        expect(() => toonEncodeForLLM(obj)).not.toThrow()
        const result = toonEncodeForLLM(obj)
        expect(typeof result).toBe('string')
      })
    })
  })

  // ── toonEncodeWithStats ───────────────────────────────────────────────

  describe('toonEncodeWithStats', () => {
    it('returns json format when disabled', () => {
      setToonEnabled('false')
      const data = [{ id: 1, name: 'Alice' }]
      const stats = toonEncodeWithStats(data)
      expect(stats.format).toBe('json')
      expect(stats.savingsPercent).toBe(0)
      expect(stats.output).toBe(JSON.stringify(data))
    })

    it('returns toon format with savings when enabled', () => {
      setToonEnabled('true')
      const data = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        department: 'Engineering',
        active: true,
      }))
      const stats = toonEncodeWithStats(data)
      expect(stats.format).toBe('toon')
      expect(stats.savingsPercent).toBeGreaterThan(0)
      expect(stats.encodedLength).toBeLessThan(stats.originalLength)
    })
  })

  // ── tryParseThenEncode ────────────────────────────────────────────────

  describe('tryParseThenEncode', () => {
    it('returns the original string when TOON is disabled', () => {
      setToonEnabled('false')
      const json = JSON.stringify([{ id: 1, name: 'Alice' }])
      expect(tryParseThenEncode(json)).toBe(json)
    })

    it('returns plain text unchanged when TOON is enabled', () => {
      setToonEnabled('true')
      const text = 'Hello, this is a plain text document.'
      expect(tryParseThenEncode(text)).toBe(text)
    })

    it('converts JSON string to TOON when enabled', () => {
      setToonEnabled('true')
      const data = [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' },
      ]
      const json = JSON.stringify(data)
      const result = tryParseThenEncode(json)
      // Should not be the original JSON
      expect(result).not.toBe(json)
      // Should contain TOON tabular syntax
      expect(result).toMatch(/\[2\]\{id,name,role\}:/)
    })

    it('leaves JSON primitives unchanged', () => {
      setToonEnabled('true')
      expect(tryParseThenEncode('"hello"')).toBe('"hello"')
      expect(tryParseThenEncode('42')).toBe('42')
    })

    it('handles markdown content gracefully', () => {
      setToonEnabled('true')
      const md = '# Title\n\nSome **bold** text with `code`.'
      expect(tryParseThenEncode(md)).toBe(md)
    })
  })

  // ── getToonSystemHint ─────────────────────────────────────────────────

  describe('getToonSystemHint', () => {
    it('returns empty string when TOON is disabled', () => {
      setToonEnabled('false')
      expect(getToonSystemHint()).toBe('')
    })

    it('returns a non-empty hint when TOON is enabled', () => {
      setToonEnabled('true')
      const hint = getToonSystemHint()
      expect(hint).toContain('TOON')
      expect(hint).toContain('Token-Oriented Object Notation')
    })
  })
})
