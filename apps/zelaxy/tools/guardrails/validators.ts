import type { ValidationResult } from './types'

/**
 * Validate if input is valid JSON
 */
export function validateJson(inputStr: string): ValidationResult {
  try {
    JSON.parse(inputStr)
    return { passed: true }
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return { passed: false, error: `Invalid JSON: ${error.message}` }
    }
    return { passed: false, error: `Validation error: ${error.message}` }
  }
}

/**
 * Validate if input matches regex pattern
 */
export function validateRegex(inputStr: string, pattern: string): ValidationResult {
  try {
    const regex = new RegExp(pattern)
    const match = regex.test(inputStr)

    if (match) {
      return { passed: true }
    }
    return { passed: false, error: 'Input does not match regex pattern' }
  } catch (error: any) {
    return { passed: false, error: `Invalid regex pattern: ${error.message}` }
  }
}
