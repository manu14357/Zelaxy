import type { GoogleTranslateObjectResponse, TranslateParams } from '@/tools/google_translate/types'
import type { ToolConfig } from '@/tools/types'

export const translateTool: ToolConfig<TranslateParams, GoogleTranslateObjectResponse> = {
  id: 'google_translate_translate',
  name: 'Google Translate Translate Text',
  description: 'Translate text into a target language using the Google Cloud Translation API',
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
      description: 'The text to translate',
    },
    target: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Target language code (e.g., es, fr, de, ja)',
    },
    source: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Source language code. If omitted, the language is auto-detected',
    },
    format: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Format of the source text: text or html',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://translation.googleapis.com/language/translate/v2')
      url.searchParams.append('key', params.apiKey)
      return url.toString()
    },
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      const body: Record<string, any> = {
        q: params.q,
        target: params.target,
        format: params.format || 'text',
      }
      if (params.source) body.source = params.source
      return body
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const translation = data.data?.translations?.[0] || {}
    return {
      success: true,
      output: {
        data: translation,
        metadata: { detectedSourceLanguage: translation.detectedSourceLanguage },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'The translation object with translatedText' },
    metadata: {
      type: 'json',
      description: 'Translation metadata',
      properties: {
        detectedSourceLanguage: {
          type: 'string',
          description: 'Detected source language (if source was omitted)',
        },
      },
    },
  },
}
