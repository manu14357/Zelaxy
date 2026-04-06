import type { ToolConfig } from '@/tools/types'
import type { GuardrailsResponse, GuardrailsValidateParams } from './types'

export const guardrailsTool: ToolConfig<GuardrailsValidateParams, GuardrailsResponse> = {
  id: 'guardrails_validate',
  name: 'Guardrails Validate',
  description:
    'Validate content using guardrails (JSON, regex, hallucination check, or PII detection)',
  version: '1.0.0',

  params: {
    input: {
      type: 'string',
      required: true,
      description: 'Content to validate',
    },
    validationType: {
      type: 'string',
      required: true,
      description: 'Type of validation: json, regex, hallucination, or pii',
    },
    regex: {
      type: 'string',
      required: false,
      description: 'Regex pattern (required for regex validation)',
    },
    knowledgeBaseId: {
      type: 'string',
      required: false,
      description: 'Knowledge base ID (required for hallucination check)',
    },
    threshold: {
      type: 'number',
      required: false,
      description: 'Confidence threshold (0-10 scale, default: 3)',
    },
    topK: {
      type: 'number',
      required: false,
      description: 'Number of chunks to retrieve from knowledge base (default: 5)',
    },
    model: {
      type: 'string',
      required: false,
      description: 'LLM model for confidence scoring',
    },
    apiKey: {
      type: 'string',
      required: false,
      description: 'API key for LLM provider',
    },
    workflowId: {
      type: 'string',
      required: false,
      description: 'Workflow ID for authentication context',
    },
    piiEntityTypes: {
      type: 'array',
      required: false,
      description: 'PII entity types to detect (empty = detect all)',
    },
    piiMode: {
      type: 'string',
      required: false,
      description: 'PII action mode: block or mask (default: block)',
    },
    piiLanguage: {
      type: 'string',
      required: false,
      description: 'Language for PII detection (default: en)',
    },
    customPiiPatterns: {
      type: 'json',
      required: false,
      description: 'Custom PII patterns as JSON: {"TYPE_NAME": "regex_pattern"}',
    },
    azureEndpoint: {
      type: 'string',
      required: false,
      description: 'Azure OpenAI endpoint URL',
    },
    azureApiVersion: {
      type: 'string',
      required: false,
      description: 'Azure API version',
    },
  },

  outputs: {
    passed: {
      type: 'boolean',
      description: 'Whether validation passed',
    },
    validationType: {
      type: 'string',
      description: 'Type of validation performed',
    },
    input: {
      type: 'string',
      description: 'Original input',
    },
    score: {
      type: 'number',
      description: 'Confidence score (0-10, only for hallucination check)',
      optional: true,
    },
    reasoning: {
      type: 'string',
      description: 'Reasoning for confidence score (only for hallucination check)',
      optional: true,
    },
    detectedEntities: {
      type: 'array',
      description: 'Detected PII entities (only for PII detection)',
      optional: true,
    },
    maskedText: {
      type: 'string',
      description: 'Text with PII masked (only for PII detection in mask mode)',
      optional: true,
    },
    error: {
      type: 'string',
      description: 'Error message if validation failed',
      optional: true,
    },
  },

  request: {
    url: '/api/tools/guardrails',
    method: 'POST',
    headers: (params: GuardrailsValidateParams) => ({
      'Content-Type': 'application/json',
    }),
    body: (params: GuardrailsValidateParams) => ({
      ...params,
      // Extract workflowId from _context if available
      workflowId: params.workflowId || (params as any)._context?.workflowId,
    }),
  },

  transformResponse: async (
    response: Response,
    params?: GuardrailsValidateParams
  ): Promise<GuardrailsResponse> => {
    try {
      if (!response.ok) {
        return {
          success: false,
          output: {
            passed: false,
            validationType: params?.validationType || 'unknown',
            input: params?.input || '',
            error: `HTTP ${response.status}: ${response.statusText}`,
          },
        }
      }

      const result = await response.json()
      return result as GuardrailsResponse
    } catch (error) {
      return {
        success: false,
        output: {
          passed: false,
          validationType: params?.validationType || 'unknown',
          input: params?.input || '',
          error: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      }
    }
  },
}
