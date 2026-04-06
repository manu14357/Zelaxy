import type { ValidationResult } from './types'

export interface HallucinationValidationInput {
  userInput: string
  knowledgeBaseId: string
  threshold: number // 0-10 confidence scale, default 3 (scores below 3 fail)
  topK: number // Number of chunks to retrieve, default 5
  model: string
  apiKey?: string
  workflowId?: string
  requestId: string
  azureEndpoint?: string
  azureApiVersion?: string
}

/**
 * Query knowledge base to get relevant context chunks
 */
async function queryKnowledgeBase(
  knowledgeBaseId: string,
  query: string,
  topK: number,
  requestId: string,
  workflowId?: string
): Promise<string[]> {
  try {
    console.log(
      `[${requestId}] Querying knowledge base ${knowledgeBaseId} for: ${query.substring(0, 100)}...`
    )

    // Prepare request body - include workflowId for authentication if available
    const requestBody: any = {
      knowledgeBaseIds: [knowledgeBaseId],
      query,
      topK,
    }

    // Add workflowId for authentication context if available
    if (workflowId) {
      requestBody.workflowId = workflowId
      console.log(`[${requestId}] Using workflow ID for authentication: ${workflowId}`)
    }

    // Make actual API call to knowledge base search
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/knowledge/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      console.error(
        `[${requestId}] Knowledge base search failed:`,
        response.status,
        response.statusText
      )

      // Log the request body for debugging
      console.error(`[${requestId}] Request body sent:`, JSON.stringify(requestBody, null, 2))

      // Log additional details for debugging
      if (response.status === 401) {
        console.error(
          `[${requestId}] Authentication failed - workflowId: ${workflowId || 'not provided'}`
        )
      } else if (response.status === 400) {
        console.error(`[${requestId}] Validation failed - likely schema validation error`)
      }

      const responseText = await response.text().catch(() => 'Could not read response')
      console.error(`[${requestId}] Response body:`, responseText)

      return []
    }

    const searchResult = await response.json()
    console.log(`[${requestId}] Knowledge base search response:`, {
      success: searchResult.success,
      resultsCount: searchResult.data?.results?.length || 0,
    })

    if (!searchResult.success || !searchResult.data?.results) {
      console.log(`[${requestId}] No results from knowledge base search`)
      return []
    }

    // Extract content from search results
    const contextChunks = searchResult.data.results
      .map((result: any) => {
        // Handle different result formats
        if (result.content) {
          return result.content
        }
        if (result.text) {
          return result.text
        }
        if (result.chunk?.content) {
          return result.chunk.content
        }
        if (typeof result === 'string') {
          return result
        }
        return JSON.stringify(result)
      })
      .filter((chunk: string) => chunk && chunk.trim().length > 0)

    console.log(
      `[${requestId}] Extracted ${contextChunks.length} context chunks from knowledge base`
    )
    if (contextChunks.length > 0) {
      console.log(
        `[${requestId}] First context chunk preview:`,
        `${contextChunks[0].substring(0, 150)}...`
      )
    }

    return contextChunks
  } catch (error: any) {
    console.error(`[${requestId}] Error querying knowledge base:`, error.message)
    return []
  }
}

/**
 * Use an LLM to score confidence based on RAG context
 */
async function scoreHallucinationWithLLM(
  userInput: string,
  ragContext: string[],
  model: string,
  apiKey: string,
  requestId: string,
  azureEndpoint?: string,
  azureApiVersion?: string
): Promise<{ score: number; reasoning: string }> {
  try {
    const contextText = ragContext.join('\n\n---\n\n')

    const systemPrompt = `You are a confidence scoring system. Your job is to evaluate how well a user's input is supported by the provided reference context from a knowledge base.

Score the input on a confidence scale from 0 to 10:
- 0-2: Full hallucination - completely unsupported by context, contradicts the context
- 3-4: Low confidence - mostly unsupported, significant claims not in context
- 5-6: Medium confidence - partially supported, some claims not in context
- 7-8: High confidence - mostly supported, minor details not in context
- 9-10: Very high confidence - fully supported by context, all claims verified

IMPORTANT: If the context indicates "No specific context available from knowledge base", be extremely cautious with scoring. Only give high scores (7+) for universally known facts. For any domain-specific claims, business rules, or specialized information, provide low scores (0-4) since they cannot be verified against the intended knowledge base.

Respond ONLY with valid JSON in this exact format:
{
  "score": <number between 0-10>,
  "reasoning": "<brief explanation of your score>"
}

Do not include any other text, markdown formatting, or code blocks. Only output the raw JSON object. Be strict - only give high scores (7+) if the input is well-supported by the specific knowledge base context.`

    const userPrompt = `Reference Context:
${contextText}

User Input to Evaluate:
${userInput}

Evaluate the consistency and provide your score and reasoning in JSON format.`

    console.log(`[${requestId}] Calling LLM for hallucination scoring with model: ${model}`)
    console.log(`[${requestId}] Context chunks being sent to LLM: ${ragContext.length}`)
    console.log(`[${requestId}] Context preview:`, `${contextText.substring(0, 200)}...`)

    // DEBUG: Log the exact prompts being sent to LLM
    console.log(`[${requestId}] ========== FULL SYSTEM PROMPT ==========`)
    console.log(systemPrompt)
    console.log(`[${requestId}] ========== FULL USER PROMPT ==========`)
    console.log(userPrompt)
    console.log(`[${requestId}] ========== END PROMPTS ==========`)

    // Make actual LLM call using provider system
    const { getAllModelProviders } = await import('../../providers/utils')

    const modelProviders = getAllModelProviders()
    const providerName = modelProviders[model.toLowerCase()]

    if (!providerName) {
      throw new Error(`Model ${model} not found in available providers`)
    }

    // Import the specific provider
    let provider
    try {
      const providerModule = await import(`../../providers/${providerName}`)
      provider = providerModule[`${providerName}Provider`] || providerModule.default
    } catch (importError: any) {
      console.error(
        `[${requestId}] Failed to import provider ${providerName}:`,
        importError.message
      )
      throw new Error(`Failed to load provider for model ${model}`)
    }

    if (!provider?.executeRequest) {
      throw new Error(`Provider ${providerName} does not support executeRequest`)
    }

    // Prepare the request
    const providerRequest = {
      model,
      apiKey,
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent scoring
      maxTokens: 500,
      ...(azureEndpoint && { azureEndpoint }),
      ...(azureApiVersion && { azureApiVersion }),
    }

    console.log(`[${requestId}] Making LLM request to ${providerName} provider`)

    // Execute the LLM request
    const response = await provider.executeRequest(providerRequest)

    if (!response?.content) {
      throw new Error('No content received from LLM')
    }

    console.log(`[${requestId}] Raw LLM response:`, response.content.substring(0, 200))

    // Parse JSON response
    let parsedResponse
    try {
      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : response.content
      parsedResponse = JSON.parse(jsonStr)
    } catch (parseError: any) {
      console.error(`[${requestId}] Failed to parse LLM response as JSON:`, parseError.message)
      console.error(`[${requestId}] Response content:`, response.content)
      throw new Error(`Failed to parse LLM response: ${parseError.message}`)
    }

    // Validate response structure
    if (typeof parsedResponse.score !== 'number' || !parsedResponse.reasoning) {
      throw new Error('Invalid response format from LLM')
    }

    // Ensure score is within valid range
    const score = Math.max(0, Math.min(10, Math.round(parsedResponse.score)))

    console.log(
      `[${requestId}] LLM confidence score: ${score}, reasoning: ${parsedResponse.reasoning}`
    )

    return {
      score,
      reasoning: parsedResponse.reasoning,
    }
  } catch (error: any) {
    console.error(`[${requestId}] Error scoring with LLM:`, error.message)
    throw new Error(`Failed to score confidence: ${error.message}`)
  }
}

/**
 * Validate user input against knowledge base using RAG + LLM scoring
 */
export async function validateHallucination(
  input: HallucinationValidationInput
): Promise<ValidationResult> {
  const {
    userInput,
    knowledgeBaseId,
    threshold,
    topK,
    model,
    apiKey,
    workflowId,
    requestId,
    azureEndpoint,
    azureApiVersion,
  } = input

  try {
    if (!userInput || userInput.trim().length === 0) {
      return {
        passed: false,
        error: 'User input is required',
      }
    }

    if (!knowledgeBaseId) {
      return {
        passed: false,
        error: 'Knowledge base ID is required',
      }
    }

    // Step 1: Query knowledge base with RAG
    const ragContext = await queryKnowledgeBase(
      knowledgeBaseId,
      userInput,
      topK,
      requestId,
      workflowId
    )

    // If no context found, provide a default context or continue with limited context
    let contextToUse = ragContext
    if (ragContext.length === 0) {
      console.log(
        `[${requestId}] No relevant context found in knowledge base, using default context`
      )
      console.log(`[${requestId}] EXPLANATION: This could be due to:`)
      console.log(
        `[${requestId}]   1. Content mismatch - input content doesn't relate to knowledge base domain`
      )
      console.log(`[${requestId}]   2. Empty knowledge base - no documents have been uploaded`)
      console.log(`[${requestId}]   3. Search terms not matching indexed content`)
      console.warn(
        `[${requestId}] WARNING: Hallucination detection is falling back to general knowledge - this may not be accurate for domain-specific content`
      )
      console.log(
        `[${requestId}] RECOMMENDATION: Ensure the knowledge base contains relevant content for the input being validated`
      )
      contextToUse = [
        'No specific context available from knowledge base. Be very cautious with scoring - only give high scores for universally known facts. For domain-specific claims that cannot be verified against general knowledge, provide low confidence scores.',
      ]
    }

    // Step 2: Use LLM to score confidence
    const { score, reasoning } = await scoreHallucinationWithLLM(
      userInput,
      contextToUse,
      model,
      apiKey || '',
      requestId,
      azureEndpoint,
      azureApiVersion
    )

    console.log(`[${requestId}] Confidence score: ${score}, threshold: ${threshold}`)

    // Step 3: Check against threshold
    const passed = score >= threshold

    return {
      passed,
      score,
      reasoning,
      knowledgeBaseContext: ragContext.length > 0 ? ragContext : undefined,
      error: passed
        ? undefined
        : `Low confidence: score ${score}/10 is below threshold ${threshold}`,
    }
  } catch (error: any) {
    console.error(`[${requestId}] Hallucination validation error:`, error.message)
    return {
      passed: false,
      error: `Validation error: ${error.message}`,
    }
  }
}
