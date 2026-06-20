import type {
  DetectLanguageParams,
  GoogleTranslateObjectResponse,
} from '@/tools/google_translate/types'
import type { ToolConfig } from '@/tools/types'

export const detectLanguageTool: ToolConfig<DetectLanguageParams, GoogleTranslateObjectResponse> = {
  id: 'google_translate_detect_language',
  name: 'Google Translate Detect Language',
  description: 'Detect the language of text using the Google Cloud Translation API',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google Cloud API key with the Cloud Translation API enabled',
    },
    q: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The text to detect the language of',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://translation.googleapis.com/language/translate/v2/detect')
      url.searchParams.append('key', params.apiKey)
      return url.toString()
    },
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => ({ q: params.q }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const detection = data.data?.detections?.[0]?.[0] || {}
    return {
      success: true,
      output: {
        data: detection,
        metadata: { language: detection.language },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The detection object with language and confidence' },
    metadata: {
      type: 'json',
      description: 'Detection metadata',
      properties: {
        language: { type: 'string', description: 'Detected language code' },
      },
    },
  },
}
