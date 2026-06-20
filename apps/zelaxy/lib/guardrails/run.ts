/**
 * Shared guardrails validation dispatch.
 *
 * Runs one of the four guardrail checks (json / regex / hallucination / pii) and returns a
 * normalized output. Used by the public `/api/guardrails/validate` endpoint; the in-workflow tool
 * has its own internal route (`/api/tools/guardrails`).
 */

import { validateHallucination } from '@/tools/guardrails/hallucination'
import { validatePII } from '@/tools/guardrails/pii'
import type { GuardrailsResponse } from '@/tools/guardrails/types'
import { validateJson, validateRegex } from '@/tools/guardrails/validators'

export type GuardrailsValidationType = 'json' | 'regex' | 'hallucination' | 'pii'

export interface RunGuardrailsParams {
  validationType: GuardrailsValidationType
  input: unknown
  regex?: string
  knowledgeBaseId?: string
  threshold?: number | string
  topK?: number | string
  model?: string
  apiKey?: string
  workflowId?: string
  piiEntityTypes?: string[]
  piiMode?: 'block' | 'mask'
  piiLanguage?: string
  customPiiPatterns?: Record<string, string> | string
  azureEndpoint?: string
  azureApiVersion?: string
  requestId?: string
}

export type GuardrailsOutput = GuardrailsResponse['output']

const VALID_TYPES: GuardrailsValidationType[] = ['json', 'regex', 'hallucination', 'pii']

function fail(validationType: string, input: string, error: string): GuardrailsOutput {
  return { passed: false, validationType, input, error }
}

export async function runGuardrailsValidation(
  params: RunGuardrailsParams
): Promise<GuardrailsOutput> {
  const {
    validationType,
    input,
    regex,
    knowledgeBaseId,
    model,
    apiKey,
    workflowId,
    piiMode = 'block',
    piiLanguage = 'en',
    azureEndpoint,
    azureApiVersion,
  } = params
  const requestId = params.requestId || Math.random().toString(36).slice(2, 11)

  if (!validationType) return fail('unknown', String(input ?? ''), 'Missing field: validationType')
  if (input === undefined || input === null) {
    return fail(validationType, '', 'Input is missing or undefined')
  }
  if (!VALID_TYPES.includes(validationType)) {
    return fail(
      validationType,
      String(input),
      'Invalid validationType (json|regex|hallucination|pii)'
    )
  }

  const inputStr = typeof input === 'string' ? input : JSON.stringify(input)

  if (validationType === 'regex' && !regex) {
    return fail(validationType, inputStr, 'Regex pattern is required for regex validation')
  }
  if (validationType === 'hallucination') {
    if (!model)
      return fail(validationType, inputStr, 'Model is required for hallucination validation')
    if (!knowledgeBaseId) {
      return fail(
        validationType,
        inputStr,
        'Knowledge base ID is required for hallucination validation'
      )
    }
  }

  const threshold =
    typeof params.threshold === 'string'
      ? Number.parseInt(params.threshold, 10)
      : (params.threshold ?? 3)
  const topK =
    typeof params.topK === 'string' ? Number.parseInt(params.topK, 10) : (params.topK ?? 5)

  let customPatterns: Record<string, string> = {}
  if (params.customPiiPatterns) {
    customPatterns =
      typeof params.customPiiPatterns === 'string'
        ? (() => {
            try {
              return JSON.parse(params.customPiiPatterns as string)
            } catch {
              return {}
            }
          })()
        : params.customPiiPatterns
  }

  let result: any
  switch (validationType) {
    case 'json':
      result = validateJson(inputStr)
      break
    case 'regex':
      result = validateRegex(inputStr, regex!)
      break
    case 'hallucination':
      result = await validateHallucination({
        userInput: inputStr,
        knowledgeBaseId: knowledgeBaseId!,
        threshold,
        topK,
        model: model!,
        apiKey,
        workflowId,
        requestId,
        azureEndpoint,
        azureApiVersion,
      })
      break
    case 'pii':
      result = await validatePII({
        text: inputStr,
        entityTypes: params.piiEntityTypes || [],
        mode: piiMode,
        language: piiLanguage,
        customPatterns,
        requestId,
      })
      break
    default:
      result = { passed: false, error: 'Unknown validation type' }
  }

  return {
    passed: result.passed,
    validationType,
    input: inputStr,
    error: result.error,
    score: result.score,
    reasoning: result.reasoning,
    detectedEntities: result.detectedEntities,
    maskedText: result.maskedText,
    knowledgeBaseContext: result.knowledgeBaseContext,
  }
}
