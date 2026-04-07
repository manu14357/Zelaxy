import { createLogger } from '@/lib/logs/console/logger'
import { tryParseThenEncode } from '@/lib/toon/encoder'
import type { BlockOutput } from '@/blocks/types'
import { BlockType } from '@/executor/consts'
import type { PathTracker } from '@/executor/path/path'
import type { InputResolver } from '@/executor/resolver/resolver'
import type { BlockHandler, ExecutionContext } from '@/executor/types'
import { executeProviderRequest } from '@/providers'
import { getApiKey, getProviderFromModel } from '@/providers/utils'
import type { SerializedBlock } from '@/serializer/types'

const logger = createLogger('ConditionBlockHandler')
const REQUEST_TIMEOUT = 120000

/**
 * Handler for Condition blocks that evaluate expressions or use LLM as a judge to determine execution paths.
 */
export class ConditionBlockHandler implements BlockHandler {
  /**
   * @param pathTracker - Utility for tracking execution paths
   * @param resolver - Utility for resolving inputs
   */
  constructor(
    private pathTracker: PathTracker,
    private resolver: InputResolver
  ) {}

  canHandle(block: SerializedBlock): boolean {
    return block.metadata?.id === BlockType.CONDITION
  }

  async execute(
    block: SerializedBlock,
    inputs: Record<string, any>,
    context: ExecutionContext
  ): Promise<BlockOutput> {
    logger.info(`Executing condition block: ${block.id}`, {
      evaluationMode: inputs.evaluationMode || 'expression',
    })

    // Determine evaluation mode (default to 'expression' for backward compatibility)
    const evaluationMode = inputs.evaluationMode || 'expression'

    // Find source block for context
    const sourceBlockId = context.workflow?.connections.find(
      (conn) => conn.target === block.id
    )?.source

    let sourceOutput: any = {}
    if (sourceBlockId) {
      const sourceState = context.blockStates.get(sourceBlockId)
      if (!sourceState?.output) {
        throw new Error(`No output found for source block ${sourceBlockId}`)
      }
      sourceOutput = sourceState.output
    }

    // Get outgoing connections
    const outgoingConnections = context.workflow?.connections.filter(
      (conn) => conn.source === block.id
    )

    let conditionResult = false
    let evaluationContent = ''
    let llmJudgement: any
    let selectedConditionId = 'false'
    let selectedConnection: { target: string; sourceHandle?: string } | null = null

    if (evaluationMode === 'llm') {
      const result = await this.evaluateWithLLM(inputs, context, block)
      conditionResult = result.decision
      evaluationContent = result.content
      llmJudgement = result.judgement

      // LLM mode uses simple true/false
      selectedConditionId = conditionResult ? 'true' : 'false'
      selectedConnection =
        (outgoingConnections?.find((conn) => conn.sourceHandle === selectedConditionId) as
          | { target: string; sourceHandle?: string }
          | undefined) || null

      if (!selectedConnection) {
        throw new Error(
          `No ${selectedConditionId} path connected for condition block "${block.metadata?.name}". Condition evaluated to ${conditionResult}.`
        )
      }
    } else {
      // Expression mode - check if multi-condition or simple
      const result = await this.evaluateMultiCondition(
        inputs,
        context,
        block,
        sourceOutput,
        outgoingConnections || []
      )
      conditionResult = result.decision
      evaluationContent = result.content
      selectedConditionId = result.selectedConditionId
      selectedConnection = result.selectedConnection
    }

    // Find target block
    const targetBlock = context.workflow?.blocks.find((b) => b.id === selectedConnection?.target)
    if (!targetBlock) {
      throw new Error(`Target block ${selectedConnection?.target} not found`)
    }

    // Log the decision
    logger.info(
      `Condition block ${block.id} evaluated to ${conditionResult}, taking ${selectedConnection.sourceHandle} path -> ${targetBlock.metadata?.name || targetBlock.id}`
    )

    // Update context decisions
    context.decisions.condition.set(block.id, selectedConditionId)

    // Return output
    const output = {
      ...((sourceOutput as any) || {}), // Keep original fields if they exist
      content: evaluationContent,
      conditionResult: conditionResult,
      selectedPath: {
        blockId: targetBlock.id,
        blockType: targetBlock.metadata?.id || 'unknown',
        blockTitle: targetBlock.metadata?.name || 'Untitled Block',
      },
      selectedConditionId,
      ...(llmJudgement && { llmJudgement }),
    }

    return output
  }

  /**
   * Get provider for a model, with special handling for open-source models
   */
  private getProviderForModel(model: string): string {
    // Always delegate to the central provider detection first — it knows about
    // Bedrock models (anthropic.*, amazon.*, meta.*, etc.) which contain ":"
    // in their version suffix (e.g. "anthropic.claude-3-5-sonnet-20241022-v2:0").
    const detected = getProviderFromModel(model)

    // getProviderFromModel falls back to 'ollama' when it can't match anything.
    // For explicit open-source markers we also route to ollama.
    if (detected !== 'ollama') {
      return detected
    }

    // Handle open-source models that might have "gpt" in their name
    if (model.includes('oss') || model.includes('local')) {
      return 'ollama'
    }

    // For models with ":" that weren't matched by any known provider pattern,
    // assume they're local Ollama models (e.g. "llama3:8b", "mistral:7b")
    if (model.includes(':')) {
      return 'ollama'
    }

    return detected
  }

  /**
   * Evaluate condition using LLM as a judge
   */
  private async evaluateWithLLM(
    inputs: Record<string, any>,
    context: ExecutionContext,
    block: SerializedBlock
  ): Promise<{ decision: boolean; content: string; judgement: any }> {
    const llmPrompt = inputs.llmPrompt || ''
    const llmContext = inputs.llmContext || ''
    const llmModel = inputs.llmModel || 'gpt-4o-mini'
    const requireConfidence = inputs.requireConfidence || false
    const userApiKey = inputs.apiKey || ''

    if (!llmPrompt.trim()) {
      throw new Error('LLM Judge Prompt is required when using LLM evaluation mode')
    }

    // Resolve references in the context
    let resolvedContext = llmContext
    try {
      const resolvedVars = this.resolver.resolveVariableReferences(llmContext, block)
      const resolvedRefs = this.resolver.resolveBlockReferences(resolvedVars, context, block)
      resolvedContext = this.resolver.resolveEnvVariables(resolvedRefs, true)
    } catch (resolveError: any) {
      logger.error(`Failed to resolve references in LLM context: ${resolveError.message}`)
      throw new Error(`Failed to resolve references in LLM context: ${resolveError.message}`)
    }

    // Construct LLM system prompt — keep it lean; structured output (where
    // supported) already constrains the response shape.
    const systemPrompt = `You are an expert judge that evaluates content based on specific criteria.

INSTRUCTIONS:
1. Carefully analyze the provided context against the given criteria.
2. Be precise and objective in your evaluation.
3. Respond with a JSON object — nothing else.

RESPONSE FORMAT (strict JSON):
{"decision":"YES" or "NO","confidence":<0.0-1.0>,"reasoning":"<clear explanation>"}

EVALUATION CRITERIA:
${llmPrompt}

CONTEXT TO EVALUATE:
${tryParseThenEncode(resolvedContext || 'No context provided')}`

    const userPrompt =
      'Evaluate the context against the criteria and provide your judgment as a JSON object.'

    const providerId = this.getProviderForModel(llmModel)

    // Structured output schema — providers that support responseFormat (OpenAI,
    // Anthropic, Google, Azure, etc.) will enforce this shape. Providers that
    // don't (e.g. Bedrock Converse) will simply ignore it and rely on the
    // system-prompt instructions instead.
    const conditionResponseSchema = {
      name: 'condition_judgment',
      strict: true,
      schema: {
        type: 'object' as const,
        properties: {
          decision: {
            type: 'string' as const,
            enum: ['YES', 'NO'],
            description: 'The judgment decision — YES if the criteria are met, NO otherwise.',
          },
          confidence: {
            type: 'number' as const,
            description: 'Confidence score between 0.0 and 1.0.',
          },
          reasoning: {
            type: 'string' as const,
            description: 'Clear explanation of the decision.',
          },
        },
        required: ['decision', 'confidence', 'reasoning'],
        additionalProperties: false,
      },
    }

    try {
      const providerRequest = {
        provider: providerId,
        model: llmModel,
        systemPrompt: systemPrompt,
        context: userPrompt,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userPrompt },
        ],
        temperature: 0.1, // Low temperature for consistent judging
        responseFormat: conditionResponseSchema,
        apiKey: getApiKey(providerId, llmModel, userApiKey || undefined),
        azureEndpoint:
          inputs.azureEndpoint ||
          context.environmentVariables?.[`${providerId.toUpperCase()}_AZURE_ENDPOINT`],
        azureApiVersion:
          inputs.azureApiVersion ||
          context.environmentVariables?.[`${providerId.toUpperCase()}_AZURE_API_VERSION`],
        workflowId: context.workflowId,
        stream: false,
        environmentVariables: context.environmentVariables || {},
      }

      logger.info('Making LLM judgment request', {
        model: llmModel,
        provider: providerId,
      })

      // Check if we're in a browser environment
      const isBrowser = typeof window !== 'undefined'
      let response: any

      if (isBrowser) {
        // Use HTTP request in browser environment (same as agent block)
        logger.info('Using HTTP provider request (browser environment)')

        const httpResponse = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(providerRequest),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        })

        if (!httpResponse.ok) {
          const errorText = await httpResponse.text()
          throw new Error(
            `HTTP request failed: ${httpResponse.status} ${httpResponse.statusText} - ${errorText}`
          )
        }

        response = await httpResponse.json()
      } else {
        // Use direct provider request in server environment
        response = await executeProviderRequest(providerId, providerRequest)
      }

      // Check if response exists
      if (!response) {
        throw new Error('LLM provider returned no response')
      }

      // Extract content from the response — handle many possible shapes
      let responseContent = ''
      if (typeof response === 'string') {
        responseContent = response
      } else if (response.content) {
        responseContent =
          typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
      } else if (response.output?.content) {
        responseContent =
          typeof response.output.content === 'string'
            ? response.output.content
            : JSON.stringify(response.output.content)
      } else if (response.output) {
        responseContent =
          typeof response.output === 'string' ? response.output : JSON.stringify(response.output)
      } else {
        // Last resort: stringify the whole response and hope JSON extraction works
        responseContent = JSON.stringify(response)
      }

      logger.debug('Raw LLM response content for condition evaluation', {
        contentLength: responseContent.length,
        contentPreview: responseContent.substring(0, 300),
      })

      // Parse LLM response — try multiple extraction strategies
      let llmResponse: any
      try {
        // Strategy 1: direct JSON parse (structured output returns clean JSON)
        llmResponse = JSON.parse(responseContent)
      } catch {
        try {
          // Strategy 2: extract outermost JSON object from text
          const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            llmResponse = JSON.parse(jsonMatch[0])
          }
        } catch {
          // fall through to text analysis
        }
      }

      // Strategy 3: text analysis fallback
      if (!llmResponse) {
        logger.warn('Failed to parse LLM response as JSON, falling back to text analysis', {
          response: responseContent.substring(0, 500),
        })

        const normalized = responseContent.toLowerCase().trim()

        // Check for unambiguous YES/NO at the start or standalone
        const yesPattern = /\byes\b/i
        const noPattern = /\bno\b/i
        const hasYes = yesPattern.test(responseContent)
        const hasNo = noPattern.test(responseContent)

        // "true"/"false" as standalone answers
        const truePattern = /\btrue\b/i
        const falsePattern = /\bfalse\b/i
        const hasTrue = truePattern.test(responseContent)
        const hasFalse = falsePattern.test(responseContent)

        let extractedDecision: string | null = null
        if (hasYes && !hasNo) extractedDecision = 'YES'
        else if (hasNo && !hasYes) extractedDecision = 'NO'
        else if (hasTrue && !hasFalse) extractedDecision = 'YES'
        else if (hasFalse && !hasTrue) extractedDecision = 'NO'
        else if (normalized === 'yes' || normalized === 'true') extractedDecision = 'YES'
        else if (normalized === 'no' || normalized === 'false') extractedDecision = 'NO'

        if (extractedDecision) {
          llmResponse = {
            decision: extractedDecision,
            confidence: 0.7,
            reasoning: `Decision extracted from text analysis (LLM did not return structured JSON). Raw: ${responseContent.substring(0, 200)}`,
          }
        } else {
          throw new Error(
            `Could not extract YES/NO decision from LLM response. Raw content: ${responseContent.substring(0, 300)}`
          )
        }
      }

      // Normalize the decision field — handle "yes"/"no"/"true"/"false"/boolean
      let rawDecision = llmResponse.decision
      if (typeof rawDecision === 'boolean') {
        rawDecision = rawDecision ? 'YES' : 'NO'
      } else if (typeof rawDecision === 'string') {
        const d = rawDecision.trim().toUpperCase()
        if (d === 'TRUE' || d === 'YES') rawDecision = 'YES'
        else if (d === 'FALSE' || d === 'NO') rawDecision = 'NO'
      }

      if (!rawDecision || !['YES', 'NO'].includes(rawDecision)) {
        throw new Error(
          `LLM response must contain a valid decision (YES or NO). Got: ${JSON.stringify(llmResponse.decision)}`
        )
      }

      const decision = rawDecision === 'YES'
      const confidence = Math.max(0, Math.min(1, Number(llmResponse.confidence) || 0.5))
      const reasoning = llmResponse.reasoning || 'No reasoning provided'

      // Check confidence requirement
      if (requireConfidence && confidence < 0.8) {
        throw new Error(
          `LLM decision confidence (${Math.round(confidence * 100)}%) is below required threshold (80%)`
        )
      }

      const judgement = {
        decision: rawDecision,
        confidence,
        reasoning,
        model: llmModel,
        resolvedContext,
        evaluationCriteria: llmPrompt,
      }

      const content = `LLM Judge: ${judgement.decision} (${Math.round(confidence * 100)}% confidence) - ${reasoning}`

      logger.info('LLM judgment completed', {
        decision,
        confidence,
        model: llmModel,
      })

      return {
        decision,
        content,
        judgement,
      }
    } catch (error: any) {
      logger.error('LLM evaluation failed', { error: error.message })
      throw new Error(`LLM evaluation failed: ${error.message}`)
    }
  }

  /**
   * Evaluate condition using boolean expression (original logic)
   */
  /**
   * Evaluate condition(s) and find the matching connection.
   * Supports both simple string conditions (backward compat) and multi-condition JSON arrays.
   */
  private async evaluateMultiCondition(
    inputs: Record<string, any>,
    context: ExecutionContext,
    block: SerializedBlock,
    sourceOutput: any,
    outgoingConnections: Array<{ source: string; target: string; sourceHandle?: string }>
  ): Promise<{
    decision: boolean
    content: string
    selectedConditionId: string
    selectedConnection: { target: string; sourceHandle?: string }
  }> {
    // Build evaluation context from source output and loop items
    const evalContext = {
      ...(typeof sourceOutput === 'object' && sourceOutput !== null ? sourceOutput : {}),
      ...(context.loopItems.get(block.id) || {}),
    }

    // Determine mode based on connection handles
    // Multi-condition mode uses handles like 'condition-cond1', 'condition-else1'
    // Simple mode uses handles like 'true', 'false'
    const hasSimpleHandles = outgoingConnections.some(
      (conn) => conn.sourceHandle === 'true' || conn.sourceHandle === 'false'
    )
    const hasConditionHandles = outgoingConnections.some((conn) =>
      conn.sourceHandle?.startsWith('condition-')
    )

    // Parse conditions if it's a JSON array
    let conditions: Array<{ id: string; title: string; value: string }> = []
    let conditionValue = ''

    if (typeof inputs.conditions === 'string') {
      try {
        const parsed = JSON.parse(inputs.conditions)
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed[0]?.id) {
            // Multi-condition JSON format: [{id, title, value}, ...]
            conditions = parsed
            // Also extract first condition value for simple/legacy mode
            conditionValue = parsed[0]?.value || ''
            logger.info('Parsed multi-condition JSON', { count: conditions.length })
          } else if (parsed[0]?.value) {
            // Legacy format without id
            conditionValue = parsed[0]?.value || ''
          } else {
            conditionValue = inputs.conditions
          }
        } else {
          conditionValue = inputs.conditions
        }
      } catch {
        // Not JSON, treat as simple string expression
        conditionValue = inputs.conditions
      }
    } else {
      conditionValue = String(inputs.conditions || '')
    }

    // Use simple mode if connections use true/false handles (backward compatible)
    // or if there are no condition-{id} handles
    const useSimpleMode = hasSimpleHandles || !hasConditionHandles

    // Simple mode: single boolean expression with true/false handles
    if (useSimpleMode) {
      // Use the extracted condition value (may be from JSON or plain string)
      const valueToEvaluate =
        conditionValue || (conditions.length > 0 ? conditions[0]?.value : '') || ''
      const result = await this.evaluateSingleExpression(
        valueToEvaluate,
        evalContext,
        block,
        '',
        context
      )
      const selectedConditionId = result.decision ? 'true' : 'false'

      const selectedConnection = outgoingConnections.find(
        (conn) => conn.sourceHandle === selectedConditionId
      )

      if (!selectedConnection) {
        throw new Error(
          `No ${selectedConditionId} path connected for condition block "${block.metadata?.name}". Condition evaluated to ${result.decision}.`
        )
      }

      return {
        decision: result.decision,
        content: result.content,
        selectedConditionId,
        selectedConnection,
      }
    }

    // Multi-condition mode: iterate through conditions in order
    logger.info('Evaluating multi-condition block', { conditions: conditions.map((c) => c.title) })

    for (const condition of conditions) {
      const { id, title, value } = condition

      // 'else' condition is always true (catch-all)
      const isElse = title.toLowerCase() === 'else' || value.trim() === ''

      if (isElse) {
        // Find the else connection
        const elseConnection = outgoingConnections.find(
          (conn) => conn.sourceHandle === `condition-${id}`
        )

        if (elseConnection) {
          logger.info(`Taking 'else' path: ${id}`)
          return {
            decision: true,
            content: `Else condition matched: ${title}`,
            selectedConditionId: id,
            selectedConnection: elseConnection,
          }
        }
        // Continue to check if there's another else connection
        continue
      }

      // Evaluate the condition expression
      try {
        const result = await this.evaluateSingleExpression(
          value,
          evalContext,
          block,
          title,
          context
        )

        if (result.decision) {
          // Find the connection for this condition
          const condConnection = outgoingConnections.find(
            (conn) => conn.sourceHandle === `condition-${id}`
          )

          if (condConnection) {
            logger.info(`Condition '${title}' (${id}) matched`)
            return {
              decision: true,
              content: result.content,
              selectedConditionId: id,
              selectedConnection: condConnection,
            }
          }
          // Condition matched but no connection, continue to next
          logger.warn(`Condition '${title}' matched but no connection found for condition-${id}`)
        }
      } catch (error: any) {
        // Re-throw with condition title for better error messages
        if (error.message.includes('Evaluation error')) {
          throw error
        }
        throw new Error(
          `Evaluation error in condition "${title}": ${error.message}. (Resolved: ${value})`
        )
      }
    }

    // No condition matched - check for any else connection
    const elseCondition = conditions.find(
      (c) => c.title.toLowerCase() === 'else' || c.value.trim() === ''
    )
    if (elseCondition) {
      const elseConnection = outgoingConnections.find(
        (conn) => conn.sourceHandle === `condition-${elseCondition.id}`
      )
      if (elseConnection) {
        return {
          decision: false,
          content: 'No conditions matched, taking else path',
          selectedConditionId: elseCondition.id,
          selectedConnection: elseConnection,
        }
      }
    }

    // No match and no else
    throw new Error(
      `No matching path found for condition block "${block.metadata?.name}", and no 'else' block exists.`
    )
  }

  /**
   * Safe helper functions available in condition expressions
   */
  private getSafeHelpers() {
    return {
      // Null-safe string includes check
      safeIncludes: (value: any, search: string): boolean => {
        if (value === null || value === undefined) return false
        if (typeof value === 'string') return value.includes(search)
        if (Array.isArray(value)) return value.includes(search)
        return String(value).includes(search)
      },
      // Null-safe startsWith check
      safeStartsWith: (value: any, search: string): boolean => {
        if (value === null || value === undefined) return false
        return String(value).startsWith(search)
      },
      // Null-safe endsWith check
      safeEndsWith: (value: any, search: string): boolean => {
        if (value === null || value === undefined) return false
        return String(value).endsWith(search)
      },
      // Null-safe length check
      safeLength: (value: any): number => {
        if (value === null || value === undefined) return 0
        if (typeof value === 'string' || Array.isArray(value)) return value.length
        return 0
      },
      // Check if value exists and is truthy
      exists: (value: any): boolean => {
        return value !== null && value !== undefined
      },
      // Check if value is empty (null, undefined, empty string, or empty array)
      isEmpty: (value: any): boolean => {
        if (value === null || value === undefined) return true
        if (typeof value === 'string') return value.trim().length === 0
        if (Array.isArray(value)) return value.length === 0
        if (typeof value === 'object') return Object.keys(value).length === 0
        return false
      },
      // Safe equality check that handles null/undefined
      safeEquals: (a: any, b: any): boolean => {
        if (a === null || a === undefined) return b === null || b === undefined
        if (b === null || b === undefined) return false
        return a === b
      },
      // Safe type checking
      isString: (value: any): boolean => typeof value === 'string',
      isNumber: (value: any): boolean => typeof value === 'number' && !Number.isNaN(value),
      isBoolean: (value: any): boolean => typeof value === 'boolean',
      isArray: (value: any): boolean => Array.isArray(value),
      isObject: (value: any): boolean =>
        typeof value === 'object' && value !== null && !Array.isArray(value),
    }
  }

  /**
   * Validate and sanitize condition expression to prevent injection attacks
   */
  private sanitizeExpression(expression: string): { isValid: boolean; error?: string } {
    // Block dangerous patterns that could lead to code injection
    const dangerousPatterns = [
      /\beval\s*\(/i,
      /\bFunction\s*\(/i,
      /\bsetTimeout\s*\(/i,
      /\bsetInterval\s*\(/i,
      /\bimport\s*\(/i,
      /\brequire\s*\(/i,
      /\bfetch\s*\(/i,
      /\bXMLHttpRequest\b/i,
      /\b__proto__\b/i,
      /\bconstructor\b/i,
      /\bprototype\b/i,
      /\bprocess\s*\./i,
      /\bglobal\b/i,
      /\bwindow\b/i,
      /\bdocument\b/i,
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(expression)) {
        return {
          isValid: false,
          error: `Expression contains blocked pattern: ${pattern.source}. This is not allowed for security reasons.`,
        }
      }
    }

    return { isValid: true }
  }

  /**
   * Evaluate a single boolean expression
   */
  private async evaluateSingleExpression(
    conditionValue: string,
    evalContext: Record<string, any>,
    block: SerializedBlock,
    conditionTitle: string,
    context: ExecutionContext
  ): Promise<{ decision: boolean; content: string }> {
    if (!conditionValue?.trim()) {
      return {
        decision: false,
        content: 'Empty condition evaluated to false',
      }
    }

    // First, resolve all references
    let resolvedConditionValue: string
    try {
      const resolvedVars = this.resolver.resolveVariableReferences(conditionValue, block)
      const resolvedRefs = this.resolver.resolveBlockReferences(resolvedVars, context, block)
      resolvedConditionValue = this.resolver.resolveEnvVariables(resolvedRefs, true)
      logger.info(`Resolved condition: from "${conditionValue}" to "${resolvedConditionValue}"`)
    } catch (resolveError: any) {
      logger.error(
        `Failed to resolve references in condition '${conditionTitle}': ${resolveError.message}`
      )
      const hint = this.getResolutionErrorHint(conditionValue, resolveError.message)
      throw new Error(`Failed to resolve references in condition: ${resolveError.message}${hint}`)
    }

    // Validate the expression for security
    const validation = this.sanitizeExpression(resolvedConditionValue)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    // Then, evaluate the resolved condition with safe helpers
    try {
      const safeHelpers = this.getSafeHelpers()
      const safeContext = {
        ...evalContext,
        ...safeHelpers,
        // Make undefined references return null instead of throwing
        __nullSafe: (obj: any, ...path: string[]) => {
          let current = obj
          for (const key of path) {
            if (current === null || current === undefined) return null
            current = current[key]
          }
          return current
        },
      }

      const conditionResult = new Function(
        'context',
        'safeIncludes',
        'safeStartsWith',
        'safeEndsWith',
        'safeLength',
        'exists',
        'isEmpty',
        'safeEquals',
        'isString',
        'isNumber',
        'isBoolean',
        'isArray',
        'isObject',
        `with(context) { 
          try {
            return ${resolvedConditionValue}
          } catch (e) {
            if (e instanceof TypeError && e.message.includes('Cannot read')) {
              // Return false for null/undefined property access
              return false
            }
            throw e
          }
        }`
      )(
        safeContext,
        safeHelpers.safeIncludes,
        safeHelpers.safeStartsWith,
        safeHelpers.safeEndsWith,
        safeHelpers.safeLength,
        safeHelpers.exists,
        safeHelpers.isEmpty,
        safeHelpers.safeEquals,
        safeHelpers.isString,
        safeHelpers.isNumber,
        safeHelpers.isBoolean,
        safeHelpers.isArray,
        safeHelpers.isObject
      )

      logger.info(`Condition result: ${conditionResult}`)

      return {
        decision: Boolean(conditionResult),
        content: `Evaluated: ${resolvedConditionValue} = ${conditionResult}`,
      }
    } catch (evalError: any) {
      logger.error(`Failed to evaluate condition '${conditionTitle}': ${evalError.message}`)
      const titlePart = conditionTitle ? ` "${conditionTitle}"` : ''
      const hint = this.getEvaluationErrorHint(resolvedConditionValue, evalError.message)
      throw new Error(
        `Evaluation error in condition${titlePart}: ${evalError.message}. (Resolved: ${resolvedConditionValue})${hint}`
      )
    }
  }

  /**
   * Provide helpful hints for resolution errors
   */
  private getResolutionErrorHint(expression: string, errorMsg: string): string {
    const hints: string[] = []

    if (errorMsg.includes('not found') || errorMsg.includes('not executed')) {
      hints.push('\n\nTip: Make sure the referenced block has been executed before this condition.')
    }
    if (expression.includes('{{') && !expression.includes('}}')) {
      hints.push('\n\nTip: Missing closing brackets "}}" in variable reference.')
    }
    if (expression.includes('.content') && errorMsg.includes('undefined')) {
      hints.push(
        '\n\nTip: The block may not have produced any output. Check if the block executed successfully.'
      )
    }

    return hints.join('')
  }

  /**
   * Provide helpful hints for evaluation errors
   */
  private getEvaluationErrorHint(expression: string, errorMsg: string): string {
    const hints: string[] = []

    if (errorMsg.includes('is not defined')) {
      hints.push(
        '\n\nTip: A variable in your condition is not available. Use exists() to check first, e.g., exists(myVar) && myVar > 0'
      )
    }
    if (
      errorMsg.includes('Cannot read properties of undefined') ||
      errorMsg.includes('Cannot read properties of null')
    ) {
      hints.push(
        "\n\nTip: You're accessing a property on null/undefined. Use null-safe helpers like safeIncludes(), safeLength(), or exists() to check first."
      )
    }
    if (errorMsg.includes('is not a function')) {
      hints.push(
        "\n\nTip: The method you're calling doesn't exist on this value. Check the value type or use safe helpers like safeIncludes() instead of .includes()."
      )
    }
    if (expression.includes('==') && !expression.includes('===')) {
      hints.push(
        '\n\nTip: Consider using === (strict equality) instead of == to avoid type coercion issues.'
      )
    }

    return hints.join('')
  }

  /**
   * Evaluate condition using boolean expression (kept for backward compatibility)
   */
  private async evaluateExpression(
    inputs: Record<string, any>,
    context: ExecutionContext,
    block: SerializedBlock
  ): Promise<{ decision: boolean; content: string }> {
    // Handle both simple string conditions and legacy JSON format
    let conditionValue = ''

    if (typeof inputs.conditions === 'string') {
      // Try to parse as JSON first (for backward compatibility)
      try {
        const parsed = JSON.parse(inputs.conditions)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Legacy JSON format - use first condition
          conditionValue = parsed[0]?.value || ''
          logger.info('Using legacy JSON format, extracting first condition')
        } else {
          // Simple string format
          conditionValue = inputs.conditions
        }
      } catch {
        // Not JSON, treat as simple string
        conditionValue = inputs.conditions
      }
    } else {
      conditionValue = String(inputs.conditions ?? '')
    }

    logger.info('Condition value to evaluate:', conditionValue)

    // Find source block for context
    const sourceBlockId = context.workflow?.connections.find(
      (conn) => conn.target === block.id
    )?.source

    let evalContext = {}
    if (sourceBlockId) {
      const sourceOutput = context.blockStates.get(sourceBlockId)?.output
      if (sourceOutput) {
        evalContext = {
          ...(typeof sourceOutput === 'object' && sourceOutput !== null ? sourceOutput : {}),
          ...(context.loopItems.get(block.id) || {}),
        }
      }
    }

    // Evaluate the condition
    let conditionResult = false
    let evaluationContent = ''

    if (conditionValue?.trim()) {
      try {
        // Resolve references
        const resolvedVars = this.resolver.resolveVariableReferences(conditionValue, block)
        const resolvedRefs = this.resolver.resolveBlockReferences(resolvedVars, context, block)
        const resolvedConditionValue = this.resolver.resolveEnvVariables(resolvedRefs, true)

        logger.info(`Resolved condition: from "${conditionValue}" to "${resolvedConditionValue}"`)

        // Evaluate the resolved condition
        conditionResult = new Function(
          'context',
          `with(context) { return ${resolvedConditionValue} }`
        )(evalContext)

        logger.info(`Condition result: ${conditionResult}`)
        evaluationContent = `Evaluated: ${resolvedConditionValue} = ${conditionResult}`
      } catch (evalError: any) {
        logger.error(`Failed to evaluate condition: ${evalError.message}`)
        throw new Error(`Evaluation error in condition: ${evalError.message}`)
      }
    } else {
      // Empty condition defaults to false
      conditionResult = false
      evaluationContent = 'Empty condition evaluated to false'
    }

    return {
      decision: conditionResult,
      content: evaluationContent,
    }
  }
}
