/**
 * Tests for PostgreSQL tool utilities
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { sanitizeIdentifier, validateConnectionParams, validateQuery } from './utils'

describe('PostgreSQL Utils', () => {
  describe('validateConnectionParams', () => {
    it('should return no errors for valid params', () => {
      const errors = validateConnectionParams({
        host: 'localhost',
        database: 'testdb',
        username: 'postgres',
        password: 'secret',
      })
      expect(errors).toHaveLength(0)
    })

    it('should return error for missing host', () => {
      const errors = validateConnectionParams({
        host: '',
        database: 'testdb',
        username: 'postgres',
        password: 'secret',
      })
      expect(errors).toContain('Host is required')
    })

    it('should return error for missing database', () => {
      const errors = validateConnectionParams({
        host: 'localhost',
        database: '',
        username: 'postgres',
        password: 'secret',
      })
      expect(errors).toContain('Database is required')
    })

    it('should return error for missing username', () => {
      const errors = validateConnectionParams({
        host: 'localhost',
        database: 'testdb',
        username: '',
        password: 'secret',
      })
      expect(errors).toContain('Username is required')
    })

    it('should accept empty password (trust/peer auth)', () => {
      const errors = validateConnectionParams({
        host: 'localhost',
        database: 'testdb',
        username: 'postgres',
        password: '',
      })
      expect(errors).toHaveLength(0)
    })

    it('should return error for invalid port', () => {
      const errors = validateConnectionParams({
        host: 'localhost',
        database: 'testdb',
        username: 'postgres',
        password: 'secret',
        port: 99999,
      })
      expect(errors).toContain('Port must be between 1 and 65535')
    })

    it('should return multiple errors for multiple missing fields', () => {
      const errors = validateConnectionParams({
        host: '',
        database: '',
        username: '',
        password: '',
      })
      expect(errors.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('validateQuery', () => {
    it('should return no errors for a safe SELECT query', () => {
      const errors = validateQuery('SELECT * FROM users WHERE id = $1')
      expect(errors).toHaveLength(0)
    })

    it('should detect DROP TABLE injection', () => {
      const errors = validateQuery('SELECT 1; DROP TABLE users;')
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should detect UNION SELECT injection', () => {
      const errors = validateQuery('SELECT * FROM users UNION SELECT * FROM passwords')
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should detect OR 1=1 injection', () => {
      const errors = validateQuery("SELECT * FROM users WHERE name = '' or '1'='1'")
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('sanitizeIdentifier', () => {
    it('should keep valid identifiers unchanged', () => {
      expect(sanitizeIdentifier('users')).toBe('users')
      expect(sanitizeIdentifier('user_name')).toBe('user_name')
      expect(sanitizeIdentifier('schema.table')).toBe('schema.table')
    })

    it('should remove special characters', () => {
      expect(sanitizeIdentifier('users; DROP TABLE')).toBe('usersDROPTABLE')
      expect(sanitizeIdentifier("user's")).toBe('users')
    })

    it('should handle empty string', () => {
      expect(sanitizeIdentifier('')).toBe('')
    })
  })
})
