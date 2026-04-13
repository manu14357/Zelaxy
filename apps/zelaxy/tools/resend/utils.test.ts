/**
 * Tests for Resend utility functions
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import {
  parseJsonSafe,
  validateApiKey,
  validateEmailAddress,
  validateEmailList,
  validateSendParams,
} from '@/tools/resend/utils'

describe('validateApiKey', () => {
  it('should reject empty/null/undefined API key', () => {
    expect(validateApiKey('')).toHaveLength(1)
    expect(validateApiKey(null as any)).toHaveLength(1)
    expect(validateApiKey(undefined as any)).toHaveLength(1)
  })

  it('should reject key not starting with re_', () => {
    const errors = validateApiKey('sk_1234567890')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('re_')
  })

  it('should accept valid API key', () => {
    expect(validateApiKey('re_1234567890abcdef')).toHaveLength(0)
  })

  it('should reject whitespace-only key', () => {
    expect(validateApiKey('   ')).toHaveLength(1)
  })
})

describe('validateEmailAddress', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmailAddress('user@example.com')).toBe(true)
    expect(validateEmailAddress('test.name@domain.org')).toBe(true)
    expect(validateEmailAddress('a+b@c.co')).toBe(true)
  })

  it('should reject invalid email addresses', () => {
    expect(validateEmailAddress('notanemail')).toBe(false)
    expect(validateEmailAddress('@missing.com')).toBe(false)
    expect(validateEmailAddress('user@')).toBe(false)
    expect(validateEmailAddress('')).toBe(false)
  })
})

describe('validateEmailList', () => {
  it('should accept valid comma-separated emails', () => {
    expect(validateEmailList('a@b.com, c@d.com')).toHaveLength(0)
  })

  it('should accept a single email', () => {
    expect(validateEmailList('user@example.com')).toHaveLength(0)
  })

  it('should reject empty string', () => {
    const errors = validateEmailList('')
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid emails in list', () => {
    const errors = validateEmailList('valid@email.com, notvalid')
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('Invalid email address')
  })

  it('should reject more than 50 recipients', () => {
    const emails = Array.from({ length: 51 }, (_, i) => `user${i}@test.com`).join(', ')
    const errors = validateEmailList(emails)
    expect(errors[0]).toContain('Maximum 50')
  })

  it('should handle friendly name format', () => {
    expect(validateEmailList('John Doe <john@example.com>')).toHaveLength(0)
  })
})

describe('validateSendParams', () => {
  const validParams = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test Subject',
    html: '<p>Hello</p>',
  }

  it('should accept valid send params', () => {
    expect(validateSendParams(validParams)).toHaveLength(0)
  })

  it('should require from address', () => {
    const errors = validateSendParams({ ...validParams, from: '' })
    expect(errors.some((e) => e.includes('From'))).toBe(true)
  })

  it('should require to address', () => {
    const errors = validateSendParams({ ...validParams, to: '' })
    expect(errors.some((e) => e.includes('To'))).toBe(true)
  })

  it('should require subject', () => {
    const errors = validateSendParams({ ...validParams, subject: '' })
    expect(errors.some((e) => e.includes('Subject'))).toBe(true)
  })

  it('should require html or text', () => {
    const errors = validateSendParams({ ...validParams, html: '', text: '' })
    expect(errors.some((e) => e.includes('html or text'))).toBe(true)
  })

  it('should accept text instead of html', () => {
    const errors = validateSendParams({ ...validParams, html: '', text: 'Plain text body' })
    expect(errors).toHaveLength(0)
  })

  it('should validate from email format', () => {
    const errors = validateSendParams({ ...validParams, from: 'notanemail' })
    expect(errors.some((e) => e.includes('Invalid from'))).toBe(true)
  })

  it('should accept friendly name from format', () => {
    const errors = validateSendParams({ ...validParams, from: 'Acme <onboarding@acme.com>' })
    expect(errors).toHaveLength(0)
  })
})

describe('parseJsonSafe', () => {
  it('should parse valid JSON', () => {
    expect(parseJsonSafe('{"key": "value"}')).toEqual({ key: 'value' })
  })

  it('should parse valid JSON array', () => {
    expect(parseJsonSafe('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('should return fallback for invalid JSON', () => {
    expect(parseJsonSafe('not json')).toBeUndefined()
    expect(parseJsonSafe('not json', null)).toBeNull()
  })

  it('should return fallback for empty/undefined input', () => {
    expect(parseJsonSafe('')).toBeUndefined()
    expect(parseJsonSafe(undefined)).toBeUndefined()
    expect(parseJsonSafe('   ')).toBeUndefined()
  })

  it('should use custom fallback value', () => {
    expect(parseJsonSafe('bad', [])).toEqual([])
  })
})
