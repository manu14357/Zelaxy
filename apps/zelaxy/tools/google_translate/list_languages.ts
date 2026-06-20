import type {
  GoogleTranslateListResponse,
  ListLanguagesParams,
} from '@/tools/google_translate/types'
import type { ToolConfig } from '@/tools/types'

export const listLanguagesTool: ToolConfig<ListLanguagesParams, GoogleTranslateListResponse> = {
  id: 'google_translate_list_languages',
  name: 'Google Translate List Languages',
  description: 'List the languages supported by the Google Cloud Translation API',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Google Cloud API key with the Cloud Translation API enabled',
    },
    target: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Language code to return the language names in (e.g., en)',
    },
  },

  request: {
    url: (params) => {
      const url = new URL('https://translation.googleapis.com/language/translate/v2/languages')
      url.searchParams.append('key', params.apiKey)
      url.searchParams.append('target', params.target || 'en')
      return url.toString()
    },
    method: 'GET',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const languages = data.data?.languages || []
    return {
      success: true,
      output: {
        data: languages,
        metadata: { count: languages.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Array of supported languages with code and name' },
    metadata: {
      type: 'json',
      description: 'List metadata',
      properties: {
        count: { type: 'number', description: 'Number of languages returned' },
      },
    },
  },
}
