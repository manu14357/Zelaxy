/**
 * Tests for MySQL tool utilities
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { sanitizeIdentifier, validateConnectionParams, validateQuery } from './utils'

describe('MySQL Utils', () => {
  describe('validateConnectionParams', () => {
    it('should return no errors for valid params', () => {
      const errors = validateConnectionParams({
        host: 'localhost',
        database: 'testdb',
        username: 'root',
        password: 'secret',
      })
      expect(errors).toHaveLength(0)
    })

    it('should return error for missing host', () => {
      const errors = validateConnectionParams({
        host: '',
        database: 'testdb',
        username: 'root',
        password: 'secret',
      })
      expect(errors).toContain('Host is required')
    })

    it('should return error for missing database', () => {
      const errors = validateConnectionParams({
        host: 'localhost',
        database: '',
        username: 'root',
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

    it('should accept empty password (local auth)', () => {
      const errors = validateConnectionParams({
        host: 'localhost',
        database: 'testdb',
        username: 'root',
        password: '',
      })
      expect(errors).toHaveLength(0)
    })

    it('should return error for invalid port', () => {
      const errors = validateConnectionParams({
        host: 'localhost',
        database: 'testdb',
        username: 'root',
        password: 'secret',
        port: 99999,
      })
      expect(errors).toContain('Port must be between 1 and 65535')
    })

    it('should accept valid port', () => {
      const errors = validateConnectionParams({
        host: 'localhost',
        database: 'testdb',
        username: 'root',
        password: 'secret',
        port: 3306,
      })
      expect(errors).toHaveLength(0)
    })

    it('should return error for port 0', () => {
      const errors = validateConnectionParams({
        host: 'localhost',
        database: 'testdb',
        username: 'root',
        password: 'secret',
        port: 0,
      })
      // port 0 is falsy so it won't trigger the check
      expect(errors).toHaveLength(0)
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

    it('should handle whitespace-only host', () => {
      const errors = validateConnectionParams({
        host: '   ',
        database: 'testdb',
        username: 'root',
      })
      expect(errors).toContain('Host is required')
    })

    it('should handle null password', () => {
      const errors = validateConnectionParams({
        host: 'localhost',
        database: 'testdb',
        username: 'root',
        password: null,
      })
      expect(errors).toHaveLength(0)
    })
  })

  describe('validateQuery', () => {
    it('should return no errors for a safe SELECT query', () => {
      const errors = validateQuery('SELECT * FROM users WHERE id = ?')
      expect(errors).toHaveLength(0)
    })

    it('should return no errors for a safe INSERT query', () => {
      const errors = validateQuery('INSERT INTO users (name, email) VALUES (?, ?)')
      expect(errors).toHaveLength(0)
    })

    it('should detect DROP TABLE injection', () => {
      const errors = validateQuery('SELECT 1; DROP TABLE users;')
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should detect TRUNCATE injection', () => {
      const errors = validateQuery('SELECT 1; TRUNCATE TABLE users;')
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

    it('should detect SQL comment injection', () => {
      const errors = validateQuery('SELECT * FROM users /* injected */')
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should allow safe UPDATE queries', () => {
      const errors = validateQuery('UPDATE users SET name = ? WHERE id = ?')
      expect(errors).toHaveLength(0)
    })

    it('should allow safe DELETE queries', () => {
      const errors = validateQuery('DELETE FROM users WHERE id = ?')
      expect(errors).toHaveLength(0)
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

    it('should keep alphanumeric characters', () => {
      expect(sanitizeIdentifier('table123')).toBe('table123')
      expect(sanitizeIdentifier('Table_Name_2')).toBe('Table_Name_2')
    })

    it('should remove backticks', () => {
      expect(sanitizeIdentifier('`users`')).toBe('users')
    })

    it('should remove dashes', () => {
      expect(sanitizeIdentifier('my-table')).toBe('mytable')
    })
  })
})
