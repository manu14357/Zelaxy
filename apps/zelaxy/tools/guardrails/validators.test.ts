import { describe, expect, it } from 'vitest'
import { validateJson, validateRegex } from './validators'

describe('validateJson', () => {
  it('passes for valid JSON object', () => {
    const result = validateJson('{"name": "John", "age": 30}')
    expect(result.passed).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('passes for valid JSON array', () => {
    const result = validateJson('[1, 2, 3]')
    expect(result.passed).toBe(true)
  })

  it('passes for valid JSON string', () => {
    const result = validateJson('"hello"')
    expect(result.passed).toBe(true)
  })

  it('passes for valid JSON number', () => {
    const result = validateJson('42')
    expect(result.passed).toBe(true)
  })

  it('passes for valid JSON null', () => {
    const result = validateJson('null')
    expect(result.passed).toBe(true)
  })

  it('fails for invalid JSON', () => {
    const result = validateJson('{invalid json}')
    expect(result.passed).toBe(false)
    expect(result.error).toContain('Invalid JSON')
  })

  it('fails for empty string', () => {
    const result = validateJson('')
    expect(result.passed).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('fails for plain text', () => {
    const result = validateJson('hello world')
    expect(result.passed).toBe(false)
  })

  it('fails for trailing comma', () => {
    const result = validateJson('{"a": 1,}')
    expect(result.passed).toBe(false)
  })

  it('passes for nested JSON', () => {
    const result = validateJson('{"user": {"name": "John", "address": {"city": "NYC"}}}')
    expect(result.passed).toBe(true)
  })
})

describe('validateRegex', () => {
  it('passes when input matches pattern', () => {
    const result = validateRegex(
      'test@example.com',
      '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    )
    expect(result.passed).toBe(true)
  })

  it('fails when input does not match pattern', () => {
    const result = validateRegex(
      'not-an-email',
      '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    )
    expect(result.passed).toBe(false)
    expect(result.error).toContain('does not match')
  })

  it('passes for JSON object pattern', () => {
    const result = validateRegex('{"key": "value"}', '^\\{.*\\}$')
    expect(result.passed).toBe(true)
  })

  it('fails for invalid regex pattern', () => {
    const result = validateRegex('test', '[invalid')
    expect(result.passed).toBe(false)
    expect(result.error).toContain('Invalid regex')
  })

  it('passes for phone number pattern', () => {
    const result = validateRegex('+1-555-123-4567', '\\+?\\d[\\d\\-]+')
    expect(result.passed).toBe(true)
  })

  it('passes for URL pattern', () => {
    const result = validateRegex('https://example.com/path', '^https?://[^\\s]+$')
    expect(result.passed).toBe(true)
  })

  it('passes for date pattern', () => {
    const result = validateRegex('2025-01-15', '^\\d{4}-\\d{2}-\\d{2}$')
    expect(result.passed).toBe(true)
  })
})
