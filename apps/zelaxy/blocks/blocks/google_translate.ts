import { GoogleTranslateIcon } from '@/components/icons/google-translate-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GoogleTranslateResponse } from '@/tools/google_translate/types'

export const GoogleTranslateBlock: BlockConfig<GoogleTranslateResponse> = {
  type: 'google_translate',
  name: 'Google Translate',
  description: 'Translate text, detect languages, and list supported languages',
  longDescription:
    'Translate text between languages, detect the language of text, and list the languages supported by the Google Cloud Translation API. Authenticate with a Google Cloud API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#4285F4',
  icon: GoogleTranslateIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Translate', id: 'google_translate_translate' },
        { label: 'Detect language', id: 'google_translate_detect_language' },
        { label: 'List languages', id: 'google_translate_list_languages' },
      ],
      value: () => 'google_translate_translate',
    },
    // Translate / Detect language
    {
      id: 'q',
      title: 'Text',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Text to translate or detect',
      condition: {
        field: 'operation',
        value: ['google_translate_translate', 'google_translate_detect_language'],
      },
    },
    // Translate
    {
      id: 'target',
      title: 'Target Language',
      type: 'short-input',
      layout: 'half',
      placeholder: 'es',
      condition: {
        field: 'operation',
        value: ['google_translate_translate', 'google_translate_list_languages'],
      },
    },
    {
      id: 'source',
      title: 'Source Language',
      type: 'short-input',
      layout: 'half',
      placeholder: 'en (optional, auto-detect)',
      condition: { field: 'operation', value: 'google_translate_translate' },
    },
    {
      id: 'format',
      title: 'Format',
      type: 'short-input',
      layout: 'half',
      placeholder: 'text or html',
      condition: { field: 'operation', value: 'google_translate_translate' },
    },
    {
      id: 'apiKey',
      title: 'Google Cloud API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your Google Cloud API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'google_translate_translate',
      'google_translate_detect_language',
      'google_translate_list_languages',
    ],
    config: {
      tool: (params) => params.operation || 'google_translate_translate',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Google Cloud API key' },
    q: { type: 'string', description: 'Text to translate or detect' },
    target: { type: 'string', description: 'Target / display language code' },
    source: { type: 'string', description: 'Source language code' },
    format: { type: 'string', description: 'Text format (text or html)' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Google Translate' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
