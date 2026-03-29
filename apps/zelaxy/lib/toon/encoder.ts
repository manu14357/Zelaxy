/**
 * TOON (Token-Oriented Object Notation) Encoding Utilities
 *
 * Provides a central encoding layer that converts JSON data to TOON format
 * before sending to LLMs, reducing token usage by ~30-60% for tabular data.
 *
 * Controlled via the TOON_ENABLED environment variable.
 * When disabled (or on encoding failure), falls back to JSON.stringify.
 *
 * @see https://github.com/toon-format/toon
 */

import { encode } from '@toon-format/toon'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('TOON')

// ---------------------------------------------------------------------------
// Feature flag
// ---------------------------------------------------------------------------

/**
 * Returns `true` when TOON encoding is enabled via the `TOON_ENABLED` env var.
 * Accepted truthy values: "true", "1", "yes" (case-insensitive).
 */
export function isToonEnabled(): boolean {
  const val = (process.env.TOON_ENABLED ?? '').trim().toLowerCase()
  return val === 'true' || val === '1' || val === 'yes'
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Safely encode `data` as a TOON string.
 * Returns `null` when encoding fails (circular refs, unsupported types, etc.).
 */
function tryToonEncode(data: unknown): string | null {
  try {
    return encode(data as any)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encode `data` for inclusion in an LLM prompt.
 *
 * - When `TOON_ENABLED` is truthy, attempts TOON encoding first.
 * - Falls back to `JSON.stringify(data)` on failure or when the flag is off.
 * - For `undefined` / `null` inputs, returns the string `"null"`.
 */
export function toonEncodeForLLM(data: unknown): string {
  if (data === undefined || data === null) return 'null'

  if (!isToonEnabled()) {
    return JSON.stringify(data)
  }

  const toon = tryToonEncode(data)
  if (toon !== null) {
    logger.debug('Encoded data as TOON', {
      jsonLength: JSON.stringify(data).length,
      toonLength: toon.length,
    })
    return toon
  }

  // Fallback — encoding failed
  logger.warn('TOON encoding failed, falling back to JSON')
  try {
    return JSON.stringify(data)
  } catch {
    // Both TOON and JSON failed (e.g. circular references)
    return String(data)
  }
}

/**
 * Encode `data` and return metadata about the encoding for observability.
 */
export function toonEncodeWithStats(data: unknown): {
  output: string
  format: 'toon' | 'json'
  originalLength: number
  encodedLength: number
  savingsPercent: number
} {
  const jsonStr = JSON.stringify(data ?? null)
  const originalLength = jsonStr.length

  if (!isToonEnabled() || data === undefined || data === null) {
    return {
      output: jsonStr,
      format: 'json',
      originalLength,
      encodedLength: originalLength,
      savingsPercent: 0,
    }
  }

  const toon = tryToonEncode(data)
  if (toon !== null) {
    const savings =
      originalLength > 0 ? Math.round(((originalLength - toon.length) / originalLength) * 100) : 0
    return {
      output: toon,
      format: 'toon',
      originalLength,
      encodedLength: toon.length,
      savingsPercent: savings,
    }
  }

  return {
    output: jsonStr,
    format: 'json',
    originalLength,
    encodedLength: originalLength,
    savingsPercent: 0,
  }
}

/**
 * Try to parse `content` as JSON and, if successful, re-encode it as TOON.
 * If `content` is not valid JSON (e.g. plain text, markdown), returns it unchanged.
 *
 * Useful for file attachment text that *might* be JSON/CSV-converted data.
 */
export function tryParseThenEncode(content: string): string {
  if (!isToonEnabled()) return content

  try {
    const parsed = JSON.parse(content)
    // Only encode objects/arrays — primitive values don't benefit from TOON
    if (typeof parsed === 'object' && parsed !== null) {
      const toon = tryToonEncode(parsed)
      if (toon !== null) return toon
    }
  } catch {
    // Not JSON — return as-is
  }

  return content
}

/**
 * A one-liner system prompt fragment that tells the LLM about TOON format.
 * Returns an empty string when TOON is disabled.
 */
export function getToonSystemHint(): string {
  if (!isToonEnabled()) return ''
  return (
    '\n\nSome data in this conversation uses TOON format ' +
    '(Token-Oriented Object Notation) — a compact encoding of JSON. ' +
    'Arrays show [N]{fields}: headers followed by comma-separated rows. ' +
    'Nested objects use indentation. Treat TOON data the same as JSON.'
  )
}
