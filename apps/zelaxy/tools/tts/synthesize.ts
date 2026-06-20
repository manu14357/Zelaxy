import type { TtsResponse, TtsSynthesizeParams } from '@/tools/tts/types'
import type { ToolConfig } from '@/tools/types'

export const synthesizeTool: ToolConfig<TtsSynthesizeParams, TtsResponse> = {
  id: 'tts_synthesize',
  name: 'Text to Speech Synthesize',
  description: 'Convert text to speech audio using ElevenLabs voices',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ElevenLabs API key',
    },
    text: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'The text content to convert to speech',
    },
    voiceId: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'ElevenLabs voice identifier (e.g. "21m00Tcm4TlvDq8ikWAM")',
    },
    modelId: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'ElevenLabs model ID (default eleven_turbo_v2_5)',
    },
  },

  request: {
    url: (params) =>
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(params.voiceId.trim())}`,
    method: 'POST',
    headers: (params) => ({
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': params.apiKey,
    }),
    body: (params) => ({
      text: params.text,
      model_id: params.modelId || 'eleven_turbo_v2_5',
    }),
  },

  transformResponse: async (response, params) => {
    const buffer = await response.arrayBuffer()
    const audioBase64 = Buffer.from(buffer).toString('base64')
    return {
      success: true,
      output: {
        data: { audioBase64, mimeType: 'audio/mpeg', format: 'mp3' },
        metadata: {
          voiceId: params?.voiceId ?? '',
          characterCount: params?.text ? params.text.length : 0,
        },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Base64-encoded audio with MIME type and format' },
    metadata: {
      type: 'json',
      description: 'Synthesis metadata',
      properties: {
        voiceId: { type: 'string', description: 'Voice ID used for synthesis' },
        characterCount: { type: 'number', description: 'Number of characters synthesized' },
      },
    },
  },
}
