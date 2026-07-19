import type { StreamingExecution } from '@/executor/types'
import { executeGoogleRequest, type GoogleMethod } from '@/providers/google/core'
import { getProviderDefaultModel, getProviderModels } from '@/providers/models'
import type { ProviderConfig, ProviderRequest, ProviderResponse } from '@/providers/types'

export const googleProvider: ProviderConfig = {
  id: 'google',
  name: 'Google',
  description: "Google's Gemini models",
  version: '1.0.0',
  models: getProviderModels('google'),
  defaultModel: getProviderDefaultModel('google'),

  executeRequest: async (
    request: ProviderRequest
  ): Promise<ProviderResponse | StreamingExecution> => {
    if (!request.apiKey) {
      throw new Error('API key is required for Google Gemini')
    }

    // Public Gemini API: key travels in the query string, standard JSON headers.
    const buildUrl = (model: string, method: GoogleMethod) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}?key=${request.apiKey}`

    return executeGoogleRequest(request, {
      buildUrl,
      headers: { 'Content-Type': 'application/json' },
      providerId: 'google',
    })
  },
}
