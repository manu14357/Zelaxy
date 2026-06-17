import { createLogger } from '@/lib/logs/console/logger'
import type { BlockOutput } from '@/blocks/types'
import { BlockType } from '@/executor/consts'
import type { BlockHandler, ExecutionContext } from '@/executor/types'
import { executeProviderRequest } from '@/providers'
import { calculateCost, getApiKey, getProviderFromModel } from '@/providers/utils'
import type { SerializedBlock } from '@/serializer/types'

const logger = createLogger('TranslateBlockHandler')

function buildTranslationPrompt(targetLanguage: string): string {
  const lang = targetLanguage || 'English'
  return `You are a highly skilled translator. Your task is to translate the given text into ${lang} while:
1. Preserving the original meaning and nuance
2. Maintaining appropriate formality levels
3. Adapting idioms and cultural references appropriately
4. Preserving formatting and special characters
5. Handling technical terms accurately

Only return the translated text without any explanations or notes. The translation should be natural and fluent in ${lang}.`
}

/**
 * Handler for Translate blocks.
 *
 * Translate blocks resolve their `config.tool` to a provider id (e.g. "openai")
 * rather than a registered tool, so they cannot be executed by the generic tool
 * handler. This handler runs the underlying LLM provider request directly,
 * mirroring the Evaluator handler pattern.
 */
export class TranslateBlockHandler implements BlockHandler {
  canHandle(block: SerializedBlock): boolean {
    return block.metadata?.id === BlockType.TRANSLATE
  }

  async execute(
    block: SerializedBlock,
    inputs: Record<string, any>,
    context: ExecutionContext
  ): Promise<BlockOutput> {
    const model = inputs.model || 'gpt-4o'
    const providerId = getProviderFromModel(model)

    const text = typeof inputs.context === 'string' ? inputs.context : String(inputs.context ?? '')
    const systemPrompt = inputs.systemPrompt || buildTranslationPrompt(inputs.targetLanguage)

    const providerRequest = {
      model,
      systemPrompt,
      context: JSON.stringify([{ role: 'user', content: text }]),
      temperature: inputs.temperature ?? 0,
      apiKey: inputs.apiKey,
      workflowId: context.workflowId,
      environmentVariables: context.environmentVariables || {},
    }

    try {
      const isBrowser = typeof window !== 'undefined'
      let result: any

      if (isBrowser) {
        const response = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: providerId, ...providerRequest }),
        })

        if (!response.ok) {
          let errorMessage = `Provider API request failed with status ${response.status}`
          try {
            const errorData = await response.json()
            if (errorData.error) errorMessage = errorData.error
          } catch (_e) {
            // keep default message
          }
          throw new Error(errorMessage)
        }

        result = await response.json()
      } else {
        const finalApiKey = getApiKey(providerId, model, inputs.apiKey)
        result = await executeProviderRequest(providerId, {
          ...providerRequest,
          apiKey: finalApiKey,
        })
      }

      const costCalculation = calculateCost(
        result.model,
        result.tokens?.prompt || 0,
        result.tokens?.completion || 0,
        false
      )

      return {
        content: result.content,
        model: result.model,
        tokens: {
          prompt: result.tokens?.prompt || 0,
          completion: result.tokens?.completion || 0,
          total: result.tokens?.total || 0,
        },
        cost: {
          input: costCalculation.input,
          output: costCalculation.output,
          total: costCalculation.total,
        },
      }
    } catch (error) {
      logger.error('Translate execution failed:', error)
      throw error
    }
  }
}
