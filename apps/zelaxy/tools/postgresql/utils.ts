import type { PostgreSQLConnectionParams } from './types'

/**
 * Validates PostgreSQL connection parameters
 */
export function validateConnectionParams(params: PostgreSQLConnectionParams): string[] {
  const errors: string[] = []

  if (!params.host?.trim()) {
    errors.push('Host is required')
  }

  if (!params.database?.trim()) {
    errors.push('Database is required')
  }

  if (!params.username?.trim()) {
    errors.push('Username is required')
  }

  if (params.port && (params.port < 1 || params.port > 65535)) {
    errors.push('Port must be between 1 and 65535')
  }

  return errors
}

/**
 * Validates SQL query for potential injection attacks
 */
export function validateQuery(query: string): string[] {
  const errors: string[] = []
  const suspiciousPatterns = [
    /;\s*(drop|delete|truncate|alter)\s+/i,
    /union\s+select/i,
    /'\s*or\s+'1'\s*=\s*'1/i,
    /--\s*$/,
    /\/\*[\s\S]*\*\//,
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(query)) {
      errors.push('Query contains potentially dangerous SQL patterns')
      break
    }
  }

  return errors
}

/**
 * Sanitizes table and column names to prevent SQL injection
 */
export function sanitizeIdentifier(identifier: string): string {
  return identifier.replace(/[^a-zA-Z0-9_.]/g, '')
}
