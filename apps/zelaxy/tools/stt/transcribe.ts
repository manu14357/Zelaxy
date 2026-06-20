import type { SttResponse, SttTranscribeParams } from '@/tools/stt/types'
import type { ToolConfig } from '@/tools/types'

export const transcribeTool: ToolConfig<SttTranscribeParams, SttResponse> = {
  id: 'stt_transcribe',
  name: 'Speech to Text Transcribe',
  description: 'Transcribe audio from a URL to text using ElevenLabs speech-to-text',
  version: '1.0.0',

  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'ElevenLabs API key',
    },
    audioUrl: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Publicly accessible URL to the audio or video file to transcribe',
    },
    model: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'ElevenLabs model ID (default scribe_v2)',
    },
    language: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Language code (e.g. "en", "es") or "auto" for auto-detection',
    },
  },

  request: {
    url: () => 'https://api.elevenlabs.io/v1/speech-to-text',
    method: 'POST',
    headers: (params) => ({
      'xi-api-key': params.apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
    body: (params) => {
      const form = new URLSearchParams()
      form.append('cloud_storage_url', params.audioUrl)
      form.append('model_id', params.model || 'scribe_v2')
      if (params.language && params.language !== 'auto') {
        form.append('language_code', params.language)
      }
      form.append('timestamps_granularity', 'word')
      return { body: form.toString() }
    },
  },

  transformResponse: async (response) => {
    const data = await response.json()
    const words = Array.isArray(data.words) ? data.words : []
    const segments = words
      .filter((w: any) => w.type === 'word')
      .map((w: any) => ({ text: w.text, start: w.start, end: w.end, speaker: w.speaker_id }))
    return {
      success: true,
      output: {
        data: {
          transcript: data.text || '',
          segments,
          language: data.language_code ?? null,
        },
        metadata: { language: data.language_code ?? null, segmentCount: segments.length },
      },
    }
  },

  outputs: {
    data: { type: 'json', description: 'Transcript text, segments, and detected language' },
    metadata: {
      type: 'json',
      description: 'Transcription metadata',
      properties: {
        language: { type: 'string', description: 'Detected or specified language code' },
        segmentCount: { type: 'number', description: 'Number of word-level segments returned' },
      },
    },
  },
}
