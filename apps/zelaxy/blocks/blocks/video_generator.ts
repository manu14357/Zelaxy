import type { SVGProps } from 'react'
import { createElement } from 'react'
import { Video } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

const VideoGeneratorIcon = (props: SVGProps<SVGSVGElement>) => createElement(Video, props)

const FALAI_MODEL_OPTIONS = [
  { label: 'Wan T2V (720p)', id: 'fal-ai/wan/v2.1/1.3b/text-to-video' },
  { label: 'Wan T2V 14B (480p)', id: 'fal-ai/wan/v2.1/14b/text-to-video/480p' },
  { label: 'Wan T2V 14B (720p)', id: 'fal-ai/wan/v2.1/14b/text-to-video' },
  { label: 'LTX Video', id: 'fal-ai/ltx-video' },
  { label: 'Kling 2.0 Pro (T2V)', id: 'fal-ai/kling-video/v2/master/text-to-video' },
  { label: 'Kling 2.0 Pro (I2V)', id: 'fal-ai/kling-video/v2/master/image-to-video' },
  { label: 'Kling 1.6 Pro (T2V)', id: 'fal-ai/kling-video/v1.6/pro/text-to-video' },
  { label: 'Kling 1.6 Pro (I2V)', id: 'fal-ai/kling-video/v1.6/pro/image-to-video' },
  { label: 'Minimax Hailuo-02', id: 'fal-ai/minimax/video-01-live' },
  { label: 'Seedance 1.0 Lite', id: 'fal-ai/bytedance/seedance/v1/lite/text-to-video' },
  { label: 'Seedance 1.0 Pro (T2V)', id: 'fal-ai/bytedance/seedance/v1/pro/text-to-video' },
  { label: 'Seedance 1.0 Pro (I2V)', id: 'fal-ai/bytedance/seedance/v1/pro/image-to-video' },
]

export const VideoGeneratorBlock: BlockConfig = {
  type: 'video_generator',
  name: 'Video Generator (Legacy)',
  description: 'Generate videos from text and images using AI',
  longDescription:
    'Generate AI videos using multiple providers including Runway, Google Veo, Luma, Minimax, and Fal.ai. This is a legacy block — use individual provider blocks for better control.',
  docsLink: 'https://docs.zelaxy.ai/tools/video',
  category: 'tools',
  hideFromToolbar: true,
  bgColor: '#181C1E',
  icon: VideoGeneratorIcon,
  subBlocks: [
    {
      id: 'provider',
      title: 'Provider',
      type: 'dropdown',
      options: [
        { label: 'Fal.ai', id: 'falai' },
        { label: 'Runway', id: 'runway' },
        { label: 'Luma', id: 'luma' },
        { label: 'Minimax', id: 'minimax' },
        { label: 'Veo', id: 'veo' },
      ],
      value: () => 'falai',
    },
    // Fal.ai model
    {
      id: 'falaiModel',
      title: 'Model',
      type: 'dropdown',
      options: FALAI_MODEL_OPTIONS,
      value: () => 'fal-ai/wan/v2.1/1.3b/text-to-video',
      condition: { field: 'provider', value: 'falai' },
    },
    // Runway model
    {
      id: 'runwayModel',
      title: 'Model',
      type: 'dropdown',
      options: [
        { label: 'Gen4 Turbo', id: 'gen4_turbo' },
        { label: 'Gen3 Alpha Turbo', id: 'gen3a_turbo' },
      ],
      value: () => 'gen4_turbo',
      condition: { field: 'provider', value: 'runway' },
    },
    // Luma model
    {
      id: 'lumaModel',
      title: 'Model',
      type: 'dropdown',
      options: [
        { label: 'Ray 2 Flash', id: 'ray-2-flash' },
        { label: 'Ray 2', id: 'ray-2' },
        { label: 'Ray 1.6 Fast', id: 'ray-1-6' },
      ],
      value: () => 'ray-2-flash',
      condition: { field: 'provider', value: 'luma' },
    },
    // Minimax model
    {
      id: 'minimaxModel',
      title: 'Model',
      type: 'dropdown',
      options: [
        { label: 'Hailuo-02 Standard', id: 'video-01' },
        { label: 'Hailuo-02 Pro', id: 'video-01-pro' },
      ],
      value: () => 'video-01',
      condition: { field: 'provider', value: 'minimax' },
    },
    // Veo model
    {
      id: 'veoModel',
      title: 'Model',
      type: 'dropdown',
      options: [
        { label: 'Veo 2', id: 'veo-2' },
        { label: 'Veo 3 Fast', id: 'veo-3-fast' },
      ],
      value: () => 'veo-2',
      condition: { field: 'provider', value: 'veo' },
    },
    // Prompt
    {
      id: 'prompt',
      title: 'Prompt',
      type: 'long-input',
      placeholder: 'Describe the video you want to generate...',
      required: true,
    },
    // Duration (generic)
    {
      id: 'duration',
      title: 'Duration (seconds)',
      type: 'short-input',
      placeholder: '5',
    },
    // Resolution
    {
      id: 'resolution',
      title: 'Resolution',
      type: 'dropdown',
      options: [
        { label: 'Default', id: '' },
        { label: '480p', id: '480p' },
        { label: '720p', id: '720p' },
        { label: '1080p', id: '1080p' },
      ],
      value: () => '',
    },
    // Aspect ratio
    {
      id: 'aspectRatio',
      title: 'Aspect Ratio',
      type: 'dropdown',
      options: [
        { label: '16:9', id: '16:9' },
        { label: '9:16', id: '9:16' },
        { label: '1:1', id: '1:1' },
        { label: '4:3', id: '4:3' },
        { label: '3:4', id: '3:4' },
      ],
      value: () => '16:9',
    },
    // Image input (file)
    {
      id: 'imageFile',
      title: 'Start Image',
      type: 'file-upload',
      multiple: false,
      mode: 'basic',
    },
    // Image input (url/path)
    {
      id: 'imageUrl',
      title: 'Start Image URL',
      type: 'short-input',
      placeholder: 'https://...',
      mode: 'advanced',
    },
    // End image (luma/runway)
    {
      id: 'endImageUrl',
      title: 'End Image URL',
      type: 'short-input',
      placeholder: 'https://...',
      condition: { field: 'provider', value: ['luma', 'runway', 'falai'] },
      mode: 'advanced',
    },
    // Audio enabled (minimax, some fal models)
    {
      id: 'enableAudio',
      title: 'Enable Audio',
      type: 'switch',
      condition: { field: 'provider', value: ['minimax', 'falai'] },
      mode: 'advanced',
    },
    // Camera motion (luma)
    {
      id: 'cameraMotion',
      title: 'Camera Motion',
      type: 'short-input',
      placeholder: 'e.g. camera dolly forward',
      condition: { field: 'provider', value: 'luma' },
      mode: 'advanced',
    },
    // Negative prompt
    {
      id: 'negativePrompt',
      title: 'Negative Prompt',
      type: 'long-input',
      placeholder: 'Elements to avoid in the video...',
      mode: 'advanced',
    },
    // Seed
    {
      id: 'seed',
      title: 'Seed',
      type: 'short-input',
      placeholder: 'Random seed for reproducibility',
      mode: 'advanced',
    },
    // API Keys
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      placeholder: 'Enter your API key',
      required: true,
      password: true,
    },
  ],
  tools: {
    access: [
      'runway_generate_video',
      'luma_generate_video',
      'minimax_generate_video',
      'falai_generate_video',
      'veo_generate_video',
    ],
    config: {
      tool: (params) => {
        switch (params.provider) {
          case 'runway':
            return 'runway_generate_video'
          case 'luma':
            return 'luma_generate_video'
          case 'minimax':
            return 'minimax_generate_video'
          case 'veo':
            return 'veo_generate_video'
          default:
            return 'falai_generate_video'
        }
      },
      params: (params) => {
        const result: Record<string, unknown> = {}
        const provider = params.provider

        // Model selection by provider
        if (provider === 'falai' && params.falaiModel) result.model = params.falaiModel
        else if (provider === 'runway' && params.runwayModel) result.model = params.runwayModel
        else if (provider === 'luma' && params.lumaModel) result.model = params.lumaModel
        else if (provider === 'minimax' && params.minimaxModel) result.model = params.minimaxModel
        else if (provider === 'veo' && params.veoModel) result.model = params.veoModel

        if (params.prompt) result.prompt = params.prompt
        if (params.duration) result.duration = Number(params.duration) || params.duration
        if (params.resolution) result.resolution = params.resolution
        if (params.aspectRatio) result.aspectRatio = params.aspectRatio
        if (params.negativePrompt) result.negativePrompt = params.negativePrompt
        if (params.seed) result.seed = Number(params.seed)

        // Image input
        if (params.imageFile && typeof params.imageFile === 'object') {
          result.imageUrl = params.imageFile
        } else if (typeof params.imageUrl === 'string' && params.imageUrl) {
          result.imageUrl = params.imageUrl
        }

        if (params.endImageUrl) result.endImageUrl = params.endImageUrl
        if (params.enableAudio != null) result.enableAudio = params.enableAudio
        if (params.cameraMotion) result.cameraMotion = params.cameraMotion
        if (params.apiKey) result.apiKey = params.apiKey

        return result
      },
    },
  },
  inputs: {
    provider: { type: 'string', description: 'Video generation provider' },
    falaiModel: { type: 'string', description: 'Fal.ai model ID' },
    runwayModel: { type: 'string', description: 'Runway model ID' },
    lumaModel: { type: 'string', description: 'Luma model ID' },
    minimaxModel: { type: 'string', description: 'Minimax model ID' },
    veoModel: { type: 'string', description: 'Veo model ID' },
    prompt: { type: 'string', description: 'Video generation prompt' },
    duration: { type: 'string', description: 'Video duration in seconds' },
    resolution: { type: 'string', description: 'Output resolution' },
    aspectRatio: { type: 'string', description: 'Output aspect ratio' },
    imageUrl: { type: 'string', description: 'Start image URL' },
    imageFile: { type: 'json', description: 'Start image file object' },
    endImageUrl: { type: 'string', description: 'End image URL for interpolation' },
    enableAudio: { type: 'boolean', description: 'Whether to enable audio generation' },
    cameraMotion: { type: 'string', description: 'Camera motion description (Luma)' },
    negativePrompt: { type: 'string', description: 'Elements to exclude from the video' },
    seed: { type: 'string', description: 'Random seed for reproducibility' },
    apiKey: { type: 'string', description: 'Provider API key' },
  },
  outputs: {
    videoUrl: { type: 'string', description: 'URL to the generated video' },
    id: { type: 'string', description: 'Generation job ID' },
    status: { type: 'string', description: 'Generation status' },
    duration: { type: 'number', description: 'Video duration in seconds' },
    thumbnailUrl: { type: 'string', description: 'Video thumbnail URL' },
  },
}
