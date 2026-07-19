import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import type { StreamingExecution } from '@/executor/types'
import { executeAnthropicRequest } from '@/providers/anthropic/core'
import { getProviderDefaultModel, getProviderModels } from '@/providers/models'
import type { ProviderConfig, ProviderRequest, ProviderResponse } from '@/providers/types'

const logger = createLogger('AzureAnthropicProvider')

const DEFAULT_AZURE_ANTHROPIC_API_VERSION = '2023-06-01'

/**
 * Azure-hosted Anthropic (Claude) provider.
 *
 * Azure exposes the Anthropic Messages API under a Foundry/AI-Services resource endpoint. The only
 * difference from the direct Anthropic provider is the client transport: we point the Anthropic SDK
 * at `${azureEndpoint}/anthropic` and pass the `api-version` query param. The entire request
 * pipeline (tool loops, streaming, structured output) is shared via `executeAnthropicRequest`.
 */
export const azureAnthropicProvider: ProviderConfig = {
  id: 'azure-anthropic',
  name: 'Azure Anthropic',
  description: 'Anthropic Claude models hosted on Microsoft Azure',
  version: '1.0.0',
  models: getProviderModels('azure-anthropic'),
  defaultModel: getProviderDefaultModel('azure-anthropic'),

  executeRequest: async (
    request: ProviderRequest
  ): Promise<ProviderResponse | StreamingExecution> => {
    if (!request.apiKey) {
      throw new Error('API key is required for Azure Anthropic')
    }

    // Priority: request parameters > environment variables (mirrors the Azure OpenAI provider).
    const azureEndpoint = request.azureEndpoint || env.AZURE_ANTHROPIC_ENDPOINT
    const azureApiVersion =
      request.azureApiVersion ||
      env.AZURE_ANTHROPIC_API_VERSION ||
      DEFAULT_AZURE_ANTHROPIC_API_VERSION

    if (!azureEndpoint) {
      throw new Error(
        'Azure Anthropic endpoint is required. Please provide it via azureEndpoint parameter or AZURE_ANTHROPIC_ENDPOINT environment variable.'
      )
    }

    const baseURL = `${azureEndpoint.replace(/\/+$/, '')}/anthropic`

    // Registry model ids are prefixed (`azure/claude-...`) so they don't collide with the direct
    // Anthropic provider's ids. The Azure Messages API expects the bare Claude model / deployment
    // name, so strip the prefix before it reaches the payload.
    const deploymentModel = (request.model || getProviderDefaultModel('azure-anthropic')).replace(
      /^azure\//,
      ''
    )

    logger.info('Preparing Azure Anthropic request', {
      model: deploymentModel,
      baseURL,
      apiVersion: azureApiVersion,
      hasTools: !!request.tools?.length,
      stream: !!request.stream,
    })

    // Build an Azure-configured Anthropic client and delegate to the shared execution core.
    const client = new Anthropic({
      apiKey: request.apiKey,
      baseURL,
      defaultQuery: { 'api-version': azureApiVersion },
    })

    return executeAnthropicRequest(
      { ...request, model: deploymentModel },
      {
        client,
        providerId: 'azure-anthropic',
        defaultModel: getProviderDefaultModel('azure-anthropic').replace(/^azure\//, ''),
      }
    )
  },
}
