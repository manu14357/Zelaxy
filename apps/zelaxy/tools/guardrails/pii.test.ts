import { describe, expect, it } from 'vitest'
import { validatePII } from './pii'

describe('validatePII', () => {
  describe('email detection', () => {
    it('detects email addresses', async () => {
      const result = await validatePII({
        text: 'Contact me at john@example.com for details',
        entityTypes: ['EMAIL_ADDRESS'],
        mode: 'block',
        requestId: 'test-1',
      })
      expect(result.passed).toBe(false)
      expect(result.detectedEntities).toBeDefined()
      expect(result.detectedEntities!.length).toBeGreaterThan(0)
      expect(result.detectedEntities![0].type).toBe('EMAIL_ADDRESS')
      expect(result.detectedEntities![0].text).toBe('john@example.com')
    })

    it('passes when no email in text', async () => {
      const result = await validatePII({
        text: 'Hello, this is a normal text without any PII.',
        entityTypes: ['EMAIL_ADDRESS'],
        mode: 'block',
        requestId: 'test-2',
      })
      expect(result.passed).toBe(true)
    })
  })

  describe('phone number detection', () => {
    it('detects phone numbers', async () => {
      const result = await validatePII({
        text: 'Call me at +91-9876543210',
        entityTypes: ['PHONE_NUMBER'],
        mode: 'block',
        requestId: 'test-3',
      })
      expect(result.passed).toBe(false)
      expect(result.detectedEntities!.length).toBeGreaterThan(0)
    })
  })

  describe('Indian PII detection', () => {
    it('detects Aadhaar numbers', async () => {
      const result = await validatePII({
        text: 'My Aadhaar is 1234 5678 9012',
        entityTypes: ['IN_AADHAAR'],
        mode: 'block',
        requestId: 'test-4',
      })
      expect(result.passed).toBe(false)
      expect(result.detectedEntities!.some((e) => e.type === 'IN_AADHAAR')).toBe(true)
    })

    it('detects PAN numbers', async () => {
      const result = await validatePII({
        text: 'My PAN is ABCDE1234F',
        entityTypes: ['IN_PAN'],
        mode: 'block',
        requestId: 'test-5',
      })
      expect(result.passed).toBe(false)
      expect(result.detectedEntities!.some((e) => e.type === 'IN_PAN')).toBe(true)
    })
  })

  describe('mask mode', () => {
    it('masks detected PII', async () => {
      const result = await validatePII({
        text: 'Contact john@example.com for details',
        entityTypes: ['EMAIL_ADDRESS'],
        mode: 'mask',
        requestId: 'test-6',
      })
      expect(result.passed).toBe(true)
      expect(result.maskedText).toBeDefined()
      expect(result.maskedText).toContain('<EMAIL_ADDRESS>')
      expect(result.maskedText).not.toContain('john@example.com')
    })

    it('returns original text when no PII in mask mode', async () => {
      const result = await validatePII({
        text: 'Hello world',
        entityTypes: ['EMAIL_ADDRESS'],
        mode: 'mask',
        requestId: 'test-7',
      })
      expect(result.passed).toBe(true)
      expect(result.maskedText).toBe('Hello world')
    })
  })

  describe('empty entity types (detect all)', () => {
    it('detects all PII types when empty array provided', async () => {
      const result = await validatePII({
        text: 'Contact John Doe at john@example.com or call +91-9876543210',
        entityTypes: [],
        mode: 'block',
        requestId: 'test-8',
      })
      expect(result.passed).toBe(false)
      expect(result.detectedEntities!.length).toBeGreaterThan(0)
      // Should detect multiple types
      const types = new Set(result.detectedEntities!.map((e) => e.type))
      expect(types.size).toBeGreaterThan(1)
    })
  })

  describe('custom patterns', () => {
    it('detects custom PII patterns', async () => {
      const result = await validatePII({
        text: 'Employee ID: EMP123456',
        entityTypes: [],
        mode: 'block',
        customPatterns: {
          EMPLOYEE_ID: 'EMP\\d{6}',
        },
        requestId: 'test-9',
      })
      expect(result.passed).toBe(false)
      expect(result.detectedEntities!.some((e) => e.type === 'EMPLOYEE_ID')).toBe(true)
    })

    it('masks custom PII patterns', async () => {
      const result = await validatePII({
        text: 'Employee ID: EMP123456',
        entityTypes: [],
        mode: 'mask',
        customPatterns: {
          EMPLOYEE_ID: 'EMP\\d{6}',
        },
        requestId: 'test-10',
      })
      expect(result.passed).toBe(true)
      expect(result.maskedText).toContain('<EMPLOYEE_ID>')
    })

    it('ignores invalid custom patterns', async () => {
      const result = await validatePII({
        text: 'Some text',
        entityTypes: [],
        mode: 'block',
        customPatterns: {
          INVALID: '[invalid',
        },
        requestId: 'test-11',
      })
      // Should not throw, just skip the invalid pattern
      expect(result.passed).toBe(true)
    })
  })

  describe('multiple entity types', () => {
    it('detects multiple PII types simultaneously', async () => {
      const result = await validatePII({
        text: 'John Doe (john@example.com, PAN: ABCDE1234F)',
        entityTypes: ['EMAIL_ADDRESS', 'IN_PAN', 'PERSON'],
        mode: 'block',
        requestId: 'test-12',
      })
      expect(result.passed).toBe(false)
      const types = new Set(result.detectedEntities!.map((e) => e.type))
      expect(types.has('EMAIL_ADDRESS')).toBe(true)
      expect(types.has('IN_PAN')).toBe(true)
    })
  })

  describe('block mode error message', () => {
    it('provides summary of detected entities', async () => {
      const result = await validatePII({
        text: 'Contact john@example.com and jane@example.com',
        entityTypes: ['EMAIL_ADDRESS'],
        mode: 'block',
        requestId: 'test-13',
      })
      expect(result.passed).toBe(false)
      expect(result.error).toContain('PII detected')
      expect(result.error).toContain('EMAIL_ADDRESS')
    })
  })
})
