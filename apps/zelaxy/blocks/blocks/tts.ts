import { TtsIcon } from '@/components/icons/tts-icon'
import type { BlockConfig } from '@/blocks/types'
import type { TtsResponse } from '@/tools/tts/types'

export const TtsBlock: BlockConfig<TtsResponse> = {
  type: 'tts',
  name: 'Text to Speech',
  description: 'Convert text to speech audio',
  longDescription:
    'Convert text into spoken audio using ElevenLabs voices. Returns base64-encoded MP3 audio. Authenticate with an ElevenLabs API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#8B5CF6',
  icon: TtsIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [{ label: 'Synthesize', id: 'tts_synthesize' }],
      value: () => 'tts_synthesize',
    },
    {
      id: 'text',
      title: 'Text',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Hello, welcome to our service!',
      condition: { field: 'operation', value: 'tts_synthesize' },
    },
    {
      id: 'voiceId',
      title: 'Voice ID',
      type: 'short-input',
      layout: 'half',
      placeholder: '21m00Tcm4TlvDq8ikWAM',
      condition: { field: 'operation', value: 'tts_synthesize' },
    },
    {
      id: 'modelId',
      title: 'Model',
      type: 'short-input',
      layout: 'half',
      placeholder: 'eleven_turbo_v2_5',
      condition: { field: 'operation', value: 'tts_synthesize' },
    },
    {
      id: 'apiKey',
      title: 'ElevenLabs API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your ElevenLabs API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['tts_synthesize'],
    config: {
      tool: (params) => params.operation || 'tts_synthesize',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'ElevenLabs API key' },
    text: { type: 'string', description: 'Text to synthesize' },
    voiceId: { type: 'string', description: 'Voice ID' },
    modelId: { type: 'string', description: 'Model ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Base64 audio with MIME type and format' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
