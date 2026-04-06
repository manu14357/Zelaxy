import { type NextRequest, NextResponse } from 'next/server'
import { validateHallucination } from '@/tools/guardrails/hallucination'
import { validatePII } from '@/tools/guardrails/pii'
import type { GuardrailsResponse } from '@/tools/guardrails/types'
import { validateJson, validateRegex } from '@/tools/guardrails/validators'

function generateRequestId() {
  return Math.random().toString(36).substr(2, 9)
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  console.log(`[${requestId}] Guardrails validation request received`)

  try {
    const allParams: any = await request.json()
    const {
      validationType,
      input,
      regex,
      knowledgeBaseId,
      threshold: rawThreshold = 3,
      topK: rawTopK = 5,
      model,
      apiKey,
      workflowId,
      piiEntityTypes,
      piiMode = 'block',
      piiLanguage = 'en',
      customPiiPatterns,
      azureEndpoint,
      azureApiVersion,
    } = allParams

    // Parse custom PII patterns if provided as JSON string
    let processedCustomPiiPatterns: Record<string, string> = {}
    if (customPiiPatterns) {
      if (typeof customPiiPatterns === 'string') {
        try {
          processedCustomPiiPatterns = JSON.parse(customPiiPatterns)
          console.log(
            `[${requestId}] Parsed custom PII patterns from JSON string:`,
            processedCustomPiiPatterns
          )
        } catch (error) {
          console.error(`[${requestId}] Failed to parse custom PII patterns JSON:`, error)
          processedCustomPiiPatterns = {}
        }
      } else if (typeof customPiiPatterns === 'object' && customPiiPatterns !== null) {
        processedCustomPiiPatterns = customPiiPatterns
        console.log(`[${requestId}] Using custom PII patterns object:`, processedCustomPiiPatterns)
      }
    }

    // Process individual PII entity type flags into array format
    let processedPiiEntityTypes = piiEntityTypes || []

    // If piiEntityTypes is null/empty, check for individual boolean flags
    if (!processedPiiEntityTypes || processedPiiEntityTypes.length === 0) {
      const piiTypes = [
        'PERSON',
        'EMAIL_ADDRESS',
        'PHONE_NUMBER',
        'LOCATION',
        'DATE_TIME',
        'IP_ADDRESS',
        'URL',
        'CREDIT_CARD',
        'IBAN_CODE',
        'CRYPTO',
        'MEDICAL_LICENSE',
        'NRP',
        'IN_AADHAAR',
        'IN_PAN',
        'IN_VEHICLE_REGISTRATION',
        'IN_VOTER',
        'IN_PASSPORT',
        'IN_BANK_ACCOUNT',
        'IN_DRIVER_LICENSE',
        'IN_GST',
      ]

      processedPiiEntityTypes = piiTypes.filter((type) => allParams[type] === true)

      console.log(`[${requestId}] Processed PII entity types from boolean flags:`, {
        originalArray: piiEntityTypes,
        selectedTypes: processedPiiEntityTypes,
        totalSelected: processedPiiEntityTypes.length,
      })
    }

    // Convert string parameters to numbers if needed
    const threshold =
      typeof rawThreshold === 'string' ? Number.parseInt(rawThreshold, 10) : rawThreshold
    const topK = typeof rawTopK === 'string' ? Number.parseInt(rawTopK, 10) : rawTopK

    // Debug logging to trace workflowId
    console.log(`[${requestId}] Guardrails params received:`, {
      validationType,
      workflowId: workflowId || 'not provided',
      knowledgeBaseId,
      hasContext: '_context' in allParams,
      contextWorkflowId: allParams._context?.workflowId || 'not in _context',
    })

    if (!validationType) {
      return NextResponse.json({
        success: true,
        output: {
          passed: false,
          validationType: 'unknown',
          input: input || '',
          error: 'Missing required field: validationType',
        },
      } as GuardrailsResponse)
    }

    if (input === undefined || input === null) {
      return NextResponse.json({
        success: true,
        output: {
          passed: false,
          validationType,
          input: '',
          error: 'Input is missing or undefined',
        },
      } as GuardrailsResponse)
    }

    if (!['json', 'regex', 'hallucination', 'pii'].includes(validationType)) {
      return NextResponse.json({
        success: true,
        output: {
          passed: false,
          validationType,
          input: input || '',
          error: 'Invalid validationType. Must be "json", "regex", "hallucination", or "pii"',
        },
      } as GuardrailsResponse)
    }

    if (validationType === 'regex' && !regex) {
      return NextResponse.json({
        success: true,
        output: {
          passed: false,
          validationType,
          input: input || '',
          error: 'Regex pattern is required for regex validation',
        },
      } as GuardrailsResponse)
    }

    if (validationType === 'hallucination') {
      if (!model) {
        return NextResponse.json({
          success: true,
          output: {
            passed: false,
            validationType,
            input: input || '',
            error: 'Model is required for hallucination validation',
          },
        } as GuardrailsResponse)
      }

      if (!knowledgeBaseId) {
        return NextResponse.json({
          success: true,
          output: {
            passed: false,
            validationType,
            input: input || '',
            error: 'Knowledge base ID is required for hallucination validation',
          },
        } as GuardrailsResponse)
      }
    }

    const inputStr = typeof input === 'string' ? input : JSON.stringify(input)

    console.log(`[${requestId}] Executing validation`, {
      validationType,
      inputType: typeof input,
      inputLength: inputStr.length,
    })

    let validationResult

    switch (validationType) {
      case 'json':
        validationResult = validateJson(inputStr)
        break

      case 'regex':
        validationResult = validateRegex(inputStr, regex!)
        break

      case 'hallucination':
        validationResult = await validateHallucination({
          userInput: inputStr,
          knowledgeBaseId: knowledgeBaseId!,
          threshold: threshold,
          topK: topK,
          model: model!,
          apiKey,
          workflowId,
          requestId,
          azureEndpoint,
          azureApiVersion,
        })
        break

      case 'pii':
        validationResult = await validatePII({
          text: inputStr,
          entityTypes: processedPiiEntityTypes,
          mode: piiMode,
          language: piiLanguage,
          customPatterns: processedCustomPiiPatterns,
          requestId,
        })
        break

      default:
        validationResult = {
          passed: false,
          error: 'Unknown validation type',
        }
    }

    console.log(`[${requestId}] Validation completed`, {
      passed: validationResult.passed,
      hasError: !!validationResult.error,
      score: validationResult.score,
    })

    // Enhanced logging for hallucination detection to show KB context usage
    if (validationType === 'hallucination' && validationResult.score !== undefined) {
      console.log(`[${requestId}] Hallucination detection summary:`)
      console.log(`[${requestId}]   - Score: ${validationResult.score}/10`)
      console.log(`[${requestId}]   - Threshold: ${threshold}`)
      console.log(`[${requestId}]   - Result: ${validationResult.passed ? 'PASSED' : 'FAILED'}`)
      console.log(`[${requestId}]   - Reasoning: ${validationResult.reasoning}`)
    }

    return NextResponse.json({
      success: true,
      output: {
        passed: validationResult.passed,
        validationType,
        input: inputStr,
        error: validationResult.error,
        score: validationResult.score,
        reasoning: validationResult.reasoning,
        detectedEntities: validationResult.detectedEntities,
        maskedText: validationResult.maskedText,
        knowledgeBaseContext: validationResult.knowledgeBaseContext,
      },
      timing: {
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 0,
      },
    } as GuardrailsResponse)
  } catch (error: any) {
    console.error(`[${requestId}] Guardrails validation failed`, { error })
    return NextResponse.json({
      success: true,
      output: {
        passed: false,
        validationType: 'unknown',
        input: '',
        error: error.message || 'Validation failed due to unexpected error',
      },
    } as GuardrailsResponse)
  }
}
