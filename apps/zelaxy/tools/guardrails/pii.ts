import type { DetectedPIIEntity, ValidationResult } from './types'

const DEFAULT_TIMEOUT = 30000 // 30 seconds

export interface PIIValidationInput {
  text: string
  entityTypes: string[] // e.g., ["PERSON", "EMAIL_ADDRESS", "CREDIT_CARD"]
  mode: 'block' | 'mask' // block = fail if PII found, mask = return masked text
  language?: string // default: "en"
  customPatterns?: Record<string, string> // Legacy: Custom PII patterns: { "CUSTOM_TYPE": "regex_pattern" }
  requestId: string
}

/**
 * Validate text for PII using Microsoft Presidio
 */
export async function validatePII(input: PIIValidationInput): Promise<ValidationResult> {
  const { text, entityTypes, mode, language = 'en', customPatterns = {}, requestId } = input

  console.log(`[${requestId}] Starting PII validation`, {
    textLength: text.length,
    entityTypes,
    mode,
    language,
    customPatternsCount: Object.keys(customPatterns).length,
  })

  try {
    // For demo purposes, simulate PII detection without actual Presidio
    const mockResult = await simulatePIIDetection(
      text,
      entityTypes,
      mode,
      language,
      customPatterns,
      requestId
    )

    console.log(`[${requestId}] PII validation completed`, {
      passed: mockResult.passed,
      detectedCount: mockResult.detectedEntities?.length || 0,
      hasMaskedText: !!mockResult.maskedText,
    })

    return mockResult
  } catch (error: any) {
    console.error(`[${requestId}] PII validation failed:`, error.message)

    return {
      passed: false,
      error: `PII validation failed: ${error.message}`,
      detectedEntities: [],
      maskedText: text, // Return original text in case of error
    }
  }
}

/**
 * Simulate PII detection for demo purposes
 * In production, this would use actual Microsoft Presidio
 */
async function simulatePIIDetection(
  text: string,
  entityTypes: string[],
  mode: string,
  language: string,
  customPatterns: Record<string, string>,
  requestId: string
): Promise<ValidationResult> {
  // Built-in regex patterns for common PII types (with Indian focus)
  const builtInPatterns: Record<string, RegExp> = {
    EMAIL_ADDRESS: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    PHONE_NUMBER: /\b(?:\+91[-\s]?)?(?:\d{10}|\d{3}[-\s]?\d{3}[-\s]?\d{4})\b/g, // Indian phone format
    INDIAN_MOBILE_NUMBER: /\b(?:\+91[-\s]?)?[6-9]\d{9}\b/g, // Indian mobile numbers (10 digits starting with 6-9)
    CREDIT_CARD: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    PERSON: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Very basic name pattern
    // Date and time patterns
    DATE_TIME:
      /\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?|\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{1,2}-\d{1,2}-\d{4}\b/gi, // ISO dates, timestamps, common date formats
    IP_ADDRESS: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, // IPv4 addresses
    URL: /\bhttps?:\/\/[^\s]+\b/gi, // URLs
    LOCATION:
      /\b(?:Street|Road|Avenue|Lane|Drive|Circle|Court|Place|Square|Trail|Way|Boulevard|Parkway|Highway)[\s\w]*\b|\b\d+[\s\w]*(?:Street|Road|Avenue|Lane|Drive|Circle|Court|Place|Square|Trail|Way|Boulevard|Parkway|Highway)\b/gi, // Address patterns
    CRYPTO: /\b(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59}|0x[a-fA-F0-9]{40})\b/g, // Bitcoin, Ethereum addresses
    IBAN_CODE: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}[A-Z0-9]{1,16}\b/g, // IBAN format
    MEDICAL_LICENSE: /\b(?:MD|DR)[\s-]?\d{4,8}\b/gi, // Medical license patterns
    NRP: /\b(?:Hindu|Muslim|Christian|Sikh|Buddhist|Jain|Indian|American|British|Chinese|Japanese|Republican|Democrat|Liberal|Conservative)\b/gi, // Basic nationality/religion/political
    // Indian specific patterns (more precise)
    IN_AADHAAR: /\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g, // 12-digit Aadhaar with specific format
    IN_PAN: /\b[A-Z]{5}\d{4}[A-Z]{1}\b/g, // PAN format: ABCDE1234F
    IN_VEHICLE_REGISTRATION: /\b[A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,2}[-\s]?\d{4}\b/g, // DL-01-AB-1234
    IN_VOTER: /\b[A-Z]{3}\d{7}\b/g, // Voter ID format: ABC1234567
    IN_PASSPORT: /\b[A-Z]\d{7}\b/g, // Indian passport: A1234567
    IN_BANK_ACCOUNT: /\b\d{9,18}\b/g, // Bank account numbers (9-18 digits)
    IN_DRIVER_LICENSE: /\b[A-Z]{2}\d{13}\b/g, // DL format: HR0619850034761
    IN_GST: /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/g, // 15-digit GST
  }

  // Process custom patterns and merge with built-in patterns
  const customRegexPatterns: Record<string, RegExp> = {}
  for (const [typeName, pattern] of Object.entries(customPatterns)) {
    try {
      // Create regex from string pattern with global flag
      customRegexPatterns[typeName] = new RegExp(pattern, 'gi')
      console.log(`[${requestId}] Added custom PII pattern: ${typeName} -> ${pattern}`)
    } catch (error) {
      console.error(
        `[${requestId}] Invalid regex for custom PII type ${typeName}: ${pattern}`,
        error
      )
      // Skip invalid patterns
    }
  }

  // Merge built-in and custom patterns
  const patterns = { ...builtInPatterns, ...customRegexPatterns }

  console.log(
    `[${requestId}] Using ${Object.keys(builtInPatterns).length} built-in + ${Object.keys(customRegexPatterns).length} custom PII patterns`
  )

  const detectedEntities: DetectedPIIEntity[] = []

  // Check for PII based on selected entity types
  // If no types are selected, check ALL built-in types (detect all PII)
  let typesToCheck =
    entityTypes && entityTypes.length > 0 ? entityTypes : Object.keys(builtInPatterns)

  // Automatically include custom pattern types when custom patterns are defined
  // This allows users to use custom patterns without manually adding them to entity types
  if (Object.keys(customPatterns).length > 0) {
    const customPatternTypes = Object.keys(customRegexPatterns)
    typesToCheck = [...new Set([...typesToCheck, ...customPatternTypes])]
    console.log(`[${requestId}] Auto-included custom PII types:`, customPatternTypes)
  }

  console.log(`[${requestId}] PII types to check:`, {
    entityTypesInput: entityTypes,
    entityTypesLength: entityTypes?.length || 0,
    customPatternsCount: Object.keys(customPatterns).length,
    typesToCheck,
    typesToCheckCount: typesToCheck.length,
  })

  for (const entityType of typesToCheck) {
    const pattern = patterns[entityType]
    if (!pattern) continue

    let match
    pattern.lastIndex = 0 // Reset regex

    while ((match = pattern.exec(text)) !== null) {
      detectedEntities.push({
        type: entityType,
        start: match.index,
        end: match.index + match[0].length,
        score: 0.9, // Mock confidence score
        text: match[0],
      })
    }
  }

  // If no PII detected, validation passes
  if (detectedEntities.length === 0) {
    return {
      passed: true,
      detectedEntities: [],
      maskedText: text, // Return original text when no PII is detected
    }
  }

  // Block mode: fail validation if PII detected
  if (mode === 'block') {
    const entitySummary: Record<string, number> = {}
    for (const entity of detectedEntities) {
      entitySummary[entity.type] = (entitySummary[entity.type] || 0) + 1
    }

    const summaryStr = Object.entries(entitySummary)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ')

    return {
      passed: false,
      error: `PII detected: ${summaryStr}`,
      detectedEntities,
    }
  }

  // Mask mode: replace PII with placeholders
  if (mode === 'mask') {
    let maskedText = text

    // Sort entities by start position (descending) to avoid index shifting issues
    const sortedEntities = [...detectedEntities].sort((a, b) => b.start - a.start)

    for (const entity of sortedEntities) {
      const before = maskedText.substring(0, entity.start)
      const after = maskedText.substring(entity.end)
      maskedText = `${before}<${entity.type}>${after}`
    }

    return {
      passed: true,
      detectedEntities,
      maskedText,
    }
  }

  return {
    passed: false,
    error: `Invalid mode: ${mode}. Must be 'block' or 'mask'`,
    detectedEntities: [],
  }
}

/**
 * List of all supported PII entity types (focused on India)
 */
export const SUPPORTED_PII_ENTITIES = {
  // Common/Global
  CREDIT_CARD: 'Credit card number',
  CRYPTO: 'Cryptocurrency wallet address',
  DATE_TIME: 'Date or time',
  EMAIL_ADDRESS: 'Email address',
  IBAN_CODE: 'International Bank Account Number',
  INDIAN_MOBILE_NUMBER: 'Indian mobile number',
  IP_ADDRESS: 'IP address',
  NRP: 'Nationality, religious or political group',
  LOCATION: 'Location',
  PERSON: 'Person name',
  PHONE_NUMBER: 'Phone number',
  MEDICAL_LICENSE: 'Medical license number',
  URL: 'URL',

  // India specific
  IN_PAN: 'Indian Permanent Account Number',
  IN_AADHAAR: 'Indian Aadhaar number',
  IN_VEHICLE_REGISTRATION: 'Indian vehicle registration',
  IN_VOTER: 'Indian voter ID',
  IN_PASSPORT: 'Indian passport',
  IN_BANK_ACCOUNT: 'Indian bank account number',
  IN_DRIVER_LICENSE: 'Indian driving license',
  IN_GST: 'Indian GST number',
} as const

export type PIIEntityType = keyof typeof SUPPORTED_PII_ENTITIES
