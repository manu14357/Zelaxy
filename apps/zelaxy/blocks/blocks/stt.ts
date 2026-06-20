import { SttIcon } from '@/components/icons/stt-icon'
import type { BlockConfig } from '@/blocks/types'
import type { SttResponse } from '@/tools/stt/types'

export const SttBlock: BlockConfig<SttResponse> = {
  type: 'stt',
  name: 'Speech to Text',
  description: 'Transcribe audio to text from a URL',
  longDescription:
    'Transcribe audio or video from a public URL into text using the ElevenLabs speech-to-text API. Authenticate with an ElevenLabs API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#10B981',
  icon: SttIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [{ label: 'Transcribe', id: 'stt_transcribe' }],
      value: () => 'stt_transcribe',
    },
    {
      id: 'audioUrl',
      title: 'Audio URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://example.com/audio.mp3',
      condition: { field: 'operation', value: 'stt_transcribe' },
    },
    {
      id: 'language',
      title: 'Language',
      type: 'short-input',
      layout: 'half',
      placeholder: 'auto',
      condition: { field: 'operation', value: 'stt_transcribe' },
    },
    {
      id: 'model',
      title: 'Model',
      type: 'short-input',
      layout: 'half',
      placeholder: 'scribe_v2',
      condition: { field: 'operation', value: 'stt_transcribe' },
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
    access: ['stt_transcribe'],
    config: {
      tool: (params) => params.operation || 'stt_transcribe',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'ElevenLabs API key' },
    audioUrl: { type: 'string', description: 'URL of the audio to transcribe' },
    language: { type: 'string', description: 'Language code or auto' },
    model: { type: 'string', description: 'Model ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Transcript, segments, and language' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
