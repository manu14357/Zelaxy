import type { ToolResponse } from '@/tools/types'

export interface CustomPiiType {
  name: string // Display name for the PII type
  pattern: string // Regex pattern to match
  description?: string // Optional description
}

export interface GuardrailsValidateParams {
  input: string
  validationType: 'json' | 'regex' | 'hallucination' | 'pii'
  regex?: string
  knowledgeBaseId?: string
  threshold?: number
  topK?: number
  model?: string
  apiKey?: string
  workflowId?: string
  piiEntityTypes?: string[]
  piiMode?: 'block' | 'mask'
  piiLanguage?: string
  customPiiPatterns?: Record<string, string> // Legacy format: {"TYPE": "pattern"}
  customPiiTypes?: CustomPiiType[] // New advanced format with names and descriptions
  azureEndpoint?: string
  azureApiVersion?: string
}

export interface GuardrailsResponse extends ToolResponse {
  output: {
    passed: boolean
    validationType: string
    input: string
    score?: number
    reasoning?: string
    detectedEntities?: DetectedPIIEntity[]
    maskedText?: string
    knowledgeBaseContext?: string[]
    error?: string
  }
}

export interface DetectedPIIEntity {
  type: string
  start: number
  end: number
  score: number
  text: string
}

export interface ValidationResult {
  passed: boolean
  error?: string
  score?: number
  reasoning?: string
  detectedEntities?: DetectedPIIEntity[]
  maskedText?: string
  knowledgeBaseContext?: string[]
}
