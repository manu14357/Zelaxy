import Anthropic from '@anthropic-ai/sdk'
import type { StreamingExecution } from '@/executor/types'
import { getProviderDefaultModel, getProviderModels } from '../models'
import type { ProviderConfig, ProviderRequest, ProviderResponse } from '../types'
import { executeAnthropicRequest } from './core'

export const anthropicProvider: ProviderConfig = {
  id: 'anthropic',
  name: 'Anthropic',
  description: "Anthropic's Claude models",
  version: '1.0.0',
  models: getProviderModels('anthropic'),
  defaultModel: getProviderDefaultModel('anthropic'),

  executeRequest: async (
    request: ProviderRequest
  ): Promise<ProviderResponse | StreamingExecution> => {
    if (!request.apiKey) {
      throw new Error('API key is required for Anthropic')
    }

    // Build the default Anthropic client (api.anthropic.com) and delegate to the shared core.
    const client = new Anthropic({ apiKey: request.apiKey })

    return executeAnthropicRequest(request, { client, providerId: 'anthropic' })
  },
}
