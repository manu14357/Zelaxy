import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import type { StreamingExecution } from '@/executor/types'
import { executeGoogleRequest, type GoogleMethod } from '@/providers/google/core'
import { getProviderDefaultModel, getProviderModels } from '@/providers/models'
import type { ProviderConfig, ProviderRequest, ProviderResponse } from '@/providers/types'

const logger = createLogger('VertexProvider')

const DEFAULT_VERTEX_LOCATION = 'us-central1'

/**
 * Google Vertex AI provider (Gemini models on GCP).
 *
 * Vertex speaks the same generateContent/streamGenerateContent shape as the public Gemini API, so
 * this provider reuses `executeGoogleRequest` from the Google core and only supplies a Vertex URL
 * builder + Bearer-token auth.
 *
 * AUTH (partial): Vertex requires an OAuth 2.0 access token (scope
 * https://www.googleapis.com/auth/cloud-platform). Here `request.apiKey` is treated as a
 * ready-to-use Bearer token — the caller/UI is responsible for obtaining it. Full service-account
 * JSON → short-lived token exchange (google-auth-library `GoogleAuth.getAccessToken()` or a
 * signed-JWT grant) is a follow-up; wire it in front of this provider so operators can paste a
 * service-account key instead of a raw token.
 */
export const vertexProvider: ProviderConfig = {
  id: 'vertex',
  name: 'Google Vertex AI',
  description: 'Google Gemini models on Vertex AI (GCP)',
  version: '1.0.0',
  models: getProviderModels('vertex'),
  defaultModel: getProviderDefaultModel('vertex'),

  executeRequest: async (
    request: ProviderRequest
  ): Promise<ProviderResponse | StreamingExecution> => {
    if (!request.apiKey) {
      throw new Error(
        'A Google Cloud OAuth access token (Bearer) is required for Vertex AI. Provide it via the provider API key field.'
      )
    }

    // Priority: request parameters > environment variables.
    const project = request.vertexProject || env.VERTEX_PROJECT
    const location = request.vertexLocation || env.VERTEX_LOCATION || DEFAULT_VERTEX_LOCATION

    if (!project) {
      throw new Error(
        'Vertex AI project is required. Provide it via vertexProject parameter or VERTEX_PROJECT environment variable.'
      )
    }

    // Regional Vertex host. The `global` location uses the un-prefixed host; all others are
    // `{location}-aiplatform.googleapis.com`.
    const host =
      location === 'global'
        ? 'https://aiplatform.googleapis.com'
        : `https://${location}-aiplatform.googleapis.com`

    // Registry model ids are prefixed (`vertex/gemini-...`) so they don't collide with the public
    // Google provider's ids. Vertex's REST path wants the bare publisher model name, so strip it.
    const buildUrl = (model: string, method: GoogleMethod) =>
      `${host}/v1/projects/${project}/locations/${location}/publishers/google/models/${model.replace(/^vertex\//, '')}:${method}`

    logger.info('Preparing Vertex AI request', {
      model: request.model || getProviderDefaultModel('vertex'),
      project,
      location,
      hasTools: !!request.tools?.length,
      stream: !!request.stream,
    })

    return executeGoogleRequest(request, {
      buildUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.apiKey}`,
      },
      providerId: 'vertex',
    })
  },
}
