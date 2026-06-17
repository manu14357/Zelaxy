import type { ToolConfig } from '@/tools/types'

export const runwayGenerateVideoTool: ToolConfig = {
  id: 'runway_generate_video',
  name: 'Generate Video with Runway',
  description: 'Generate a video using Runway AI models (Gen4 Turbo)',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Runway API key',
    },
    model: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Model to use (default: gen4_turbo)',
    },
    prompt: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Text prompt describing the video to generate',
    },
    duration: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Duration in seconds (5 or 10)',
    },
    aspectRatio: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Aspect ratio: "16:9", "9:16", or "1:1"',
    },
    imageUrl: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'URL of an image to use as the first frame (image-to-video)',
    },
    imageFile: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Image file object to use as the first frame',
    },
    endImageUrl: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'URL of an image to use as the last frame',
    },
    negativePrompt: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Text describing what to avoid in the video',
    },
    seed: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Random seed for reproducible results',
    },
  },
  request: {
    url: () => '/api/tools/video',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: any) => ({ provider: 'runway', ...params }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok)
      throw new Error(data.error || data.message || `Video generation error: ${response.status}`)
    return { success: true, output: data }
  },
  outputs: {
    videoUrl: { type: 'string', description: 'URL of the generated video' },
    videoFile: { type: 'json', description: 'Generated video file object' },
    duration: { type: 'number', description: 'Duration of the video in seconds' },
    width: { type: 'number', description: 'Width of the video in pixels' },
    height: { type: 'number', description: 'Height of the video in pixels' },
    provider: { type: 'string', description: 'Provider used for generation' },
    model: { type: 'string', description: 'Model used for generation' },
    jobId: { type: 'string', description: 'Job ID of the generation request' },
  },
}

export const lumaGenerateVideoTool: ToolConfig = {
  id: 'luma_generate_video',
  name: 'Generate Video with Luma AI',
  description: 'Generate a video using Luma AI Dream Machine models',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Luma AI API key',
    },
    model: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Model to use (e.g., ray-2, ray-flash-2)',
    },
    prompt: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Text prompt describing the video to generate',
    },
    duration: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Duration in seconds',
    },
    aspectRatio: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Aspect ratio (e.g., "16:9", "9:16", "1:1")',
    },
    resolution: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Resolution (e.g., "720p", "1080p")',
    },
    imageUrl: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'URL of an image to use as reference',
    },
    imageFile: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Image file object to use as reference',
    },
    cameraMotion: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Camera motion configuration object',
    },
    negativePrompt: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Text describing what to avoid in the video',
    },
    seed: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Random seed for reproducible results',
    },
  },
  request: {
    url: () => '/api/tools/video',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: any) => ({ provider: 'luma', ...params }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok)
      throw new Error(data.error || data.message || `Video generation error: ${response.status}`)
    return { success: true, output: data }
  },
  outputs: {
    videoUrl: { type: 'string', description: 'URL of the generated video' },
    videoFile: { type: 'json', description: 'Generated video file object' },
    duration: { type: 'number', description: 'Duration of the video in seconds' },
    width: { type: 'number', description: 'Width of the video in pixels' },
    height: { type: 'number', description: 'Height of the video in pixels' },
    provider: { type: 'string', description: 'Provider used for generation' },
    model: { type: 'string', description: 'Model used for generation' },
    jobId: { type: 'string', description: 'Job ID of the generation request' },
  },
}

export const minimaxGenerateVideoTool: ToolConfig = {
  id: 'minimax_generate_video',
  name: 'Generate Video with MiniMax',
  description: 'Generate a video using MiniMax Hailuo video generation models',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your MiniMax API key',
    },
    model: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Model: "MiniMax-Hailuo-02" or "MiniMax-Hailuo-2.3"',
    },
    prompt: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Text prompt describing the video to generate',
    },
    duration: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Duration in seconds',
    },
    resolution: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Resolution: "768P" or "1080P"',
    },
    imageUrl: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'URL of an image to use as reference',
    },
    imageFile: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Image file object to use as reference',
    },
    promptOptimizer: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether to auto-optimize the prompt',
    },
    negativePrompt: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Text describing what to avoid in the video',
    },
    seed: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Random seed for reproducible results',
    },
  },
  request: {
    url: () => '/api/tools/video',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: any) => ({ provider: 'minimax', ...params }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok)
      throw new Error(data.error || data.message || `Video generation error: ${response.status}`)
    return { success: true, output: data }
  },
  outputs: {
    videoUrl: { type: 'string', description: 'URL of the generated video' },
    videoFile: { type: 'json', description: 'Generated video file object' },
    duration: { type: 'number', description: 'Duration of the video in seconds' },
    width: { type: 'number', description: 'Width of the video in pixels' },
    height: { type: 'number', description: 'Height of the video in pixels' },
    provider: { type: 'string', description: 'Provider used for generation' },
    model: { type: 'string', description: 'Model used for generation' },
    jobId: { type: 'string', description: 'Job ID of the generation request' },
  },
}

export const falaiGenerateVideoTool: ToolConfig = {
  id: 'falai_generate_video',
  name: 'Generate Video with fal.ai',
  description: 'Generate a video using fal.ai video generation models',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your fal.ai API key',
    },
    model: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'fal.ai model endpoint (e.g., "fal-ai/kling-video/v2.1/standard/text-to-video")',
    },
    prompt: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Text prompt describing the video to generate',
    },
    duration: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Duration in seconds',
    },
    aspectRatio: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Aspect ratio (e.g., "16:9", "9:16", "1:1")',
    },
    imageUrl: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'URL of an image to use as reference',
    },
    imageFile: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Image file object to use as reference',
    },
    generateAudio: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether to generate audio for the video',
    },
    negativePrompt: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Text describing what to avoid in the video',
    },
    seed: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Random seed for reproducible results',
    },
  },
  request: {
    url: () => '/api/tools/video',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: any) => ({ provider: 'falai', ...params }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok)
      throw new Error(data.error || data.message || `Video generation error: ${response.status}`)
    return { success: true, output: data }
  },
  outputs: {
    videoUrl: { type: 'string', description: 'URL of the generated video' },
    videoFile: { type: 'json', description: 'Generated video file object' },
    duration: { type: 'number', description: 'Duration of the video in seconds' },
    width: { type: 'number', description: 'Width of the video in pixels' },
    height: { type: 'number', description: 'Height of the video in pixels' },
    provider: { type: 'string', description: 'Provider used for generation' },
    model: { type: 'string', description: 'Model used for generation' },
    jobId: { type: 'string', description: 'Job ID of the generation request' },
  },
}

export const veoGenerateVideoTool: ToolConfig = {
  id: 'veo_generate_video',
  name: 'Generate Video with Google Veo',
  description: 'Generate a video using Google Veo video generation models',
  version: '1.0.0',
  params: {
    apiKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your Google AI API key',
    },
    model: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Veo model: "veo-3", "veo-3-fast", or "veo-3.1" (default: veo-3)',
    },
    prompt: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Text prompt describing the video to generate',
    },
    duration: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Duration in seconds',
    },
    aspectRatio: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Aspect ratio (e.g., "16:9", "9:16")',
    },
    resolution: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Resolution (e.g., "720p", "1080p")',
    },
    imageUrl: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'URL of an image to use as reference',
    },
    imageFile: {
      type: 'json',
      required: false,
      visibility: 'user-or-llm',
      description: 'Image file object to use as reference',
    },
    enableAudio: {
      type: 'boolean',
      required: false,
      visibility: 'user-or-llm',
      description: 'Whether to enable audio generation',
    },
    negativePrompt: {
      type: 'string',
      required: false,
      visibility: 'user-or-llm',
      description: 'Text describing what to avoid in the video',
    },
    seed: {
      type: 'number',
      required: false,
      visibility: 'user-or-llm',
      description: 'Random seed for reproducible results',
    },
  },
  request: {
    url: () => '/api/tools/video',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: any) => ({ provider: 'veo', ...params }),
  },
  transformResponse: async (response: Response) => {
    const data = await response.json()
    if (!response.ok)
      throw new Error(data.error || data.message || `Video generation error: ${response.status}`)
    return { success: true, output: data }
  },
  outputs: {
    videoUrl: { type: 'string', description: 'URL of the generated video' },
    videoFile: { type: 'json', description: 'Generated video file object' },
    duration: { type: 'number', description: 'Duration of the video in seconds' },
    width: { type: 'number', description: 'Width of the video in pixels' },
    height: { type: 'number', description: 'Height of the video in pixels' },
    provider: { type: 'string', description: 'Provider used for generation' },
    model: { type: 'string', description: 'Model used for generation' },
    jobId: { type: 'string', description: 'Job ID of the generation request' },
  },
}
