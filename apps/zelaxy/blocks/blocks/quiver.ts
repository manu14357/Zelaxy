import type { SVGProps } from 'react'
import { createElement } from 'react'
import { Pen } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

const QuiverIcon = (props: SVGProps<SVGSVGElement>) => createElement(Pen, props)

export const QuiverBlock: BlockConfig = {
  type: 'quiver',
  name: 'Quiver',
  description: 'Convert text and images to SVG with AI',
  longDescription:
    'Use Quiver to generate clean, scalable SVG graphics from text prompts or existing images. Supports multiple generation models and reference images.',
  docsLink: 'https://docs.zelaxy.ai/tools/quiver',
  category: 'tools',
  bgColor: '#000000',
  icon: QuiverIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      options: [
        { label: 'Text to SVG', id: 'text_to_svg' },
        { label: 'Image to SVG', id: 'image_to_svg' },
        { label: 'List Models', id: 'list_models' },
      ],
      value: () => 'text_to_svg',
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      placeholder: 'Enter your Quiver API key',
      required: true,
      password: true,
    },
    {
      id: 'model',
      title: 'Model',
      type: 'dropdown',
      options: [
        { label: 'Quiver Mini', id: 'quiver-mini' },
        { label: 'Quiver Pro', id: 'quiver-pro' },
      ],
      value: () => 'quiver-mini',
      condition: { field: 'operation', value: ['text_to_svg', 'image_to_svg'] },
    },
    {
      id: 'prompt',
      title: 'Prompt',
      type: 'long-input',
      placeholder: 'Describe the SVG you want to generate...',
      required: true,
      condition: { field: 'operation', value: 'text_to_svg' },
    },
    {
      id: 'instructions',
      title: 'Instructions',
      type: 'long-input',
      placeholder: 'Style or detail instructions (optional)...',
      condition: { field: 'operation', value: 'text_to_svg' },
    },
    {
      id: 'referenceFiles',
      title: 'Reference Images',
      type: 'file-upload',
      multiple: true,
      condition: { field: 'operation', value: 'text_to_svg' },
      mode: 'basic',
    },
    {
      id: 'referenceInput',
      title: 'Reference Image URLs',
      type: 'short-input',
      placeholder: 'https://... (comma-separated)',
      condition: { field: 'operation', value: 'text_to_svg' },
      mode: 'advanced',
    },
    {
      id: 'n',
      title: 'Number of Variants',
      type: 'short-input',
      placeholder: '1',
      condition: { field: 'operation', value: 'text_to_svg' },
      mode: 'advanced',
    },
    {
      id: 'imageFile',
      title: 'Image File',
      type: 'file-upload',
      multiple: false,
      required: true,
      condition: { field: 'operation', value: 'image_to_svg' },
      mode: 'basic',
    },
    {
      id: 'imageInput',
      title: 'Image URL',
      type: 'short-input',
      placeholder: 'https://...',
      required: true,
      condition: { field: 'operation', value: 'image_to_svg' },
      mode: 'advanced',
    },
    {
      id: 'autoCrop',
      title: 'Auto Crop',
      type: 'dropdown',
      options: [
        { label: 'Default', id: '' },
        { label: 'Yes', id: 'true' },
        { label: 'No', id: 'false' },
      ],
      value: () => '',
      condition: { field: 'operation', value: 'image_to_svg' },
      mode: 'advanced',
    },
    {
      id: 'targetSize',
      title: 'Target Size (px)',
      type: 'short-input',
      placeholder: 'e.g. 512',
      condition: { field: 'operation', value: 'image_to_svg' },
      mode: 'advanced',
    },
    {
      id: 'temperature',
      title: 'Temperature',
      type: 'short-input',
      placeholder: '1.0',
      mode: 'advanced',
    },
    {
      id: 'topP',
      title: 'Top P',
      type: 'short-input',
      placeholder: '1.0',
      mode: 'advanced',
    },
    {
      id: 'maxOutputTokens',
      title: 'Max Output Tokens',
      type: 'short-input',
      placeholder: '65536',
      mode: 'advanced',
    },
    {
      id: 'presencePenalty',
      title: 'Presence Penalty',
      type: 'short-input',
      placeholder: '0',
      mode: 'advanced',
    },
  ],
  tools: {
    access: ['quiver_text_to_svg', 'quiver_image_to_svg', 'quiver_list_models'],
    config: {
      tool: (params) => `quiver_${params.operation}`,
      params: (params) => {
        const result: Record<string, unknown> = {}
        if (params.referenceFiles) result.references = params.referenceFiles
        else if (params.referenceInput) result.references = params.referenceInput
        if (params.imageFile) result.image = params.imageFile
        else if (params.imageInput) result.image = params.imageInput
        if (params.n) result.n = Number(params.n)
        if (params.temperature) result.temperature = Number(params.temperature)
        if (params.topP) result.topP = Number(params.topP)
        if (params.maxOutputTokens) result.maxOutputTokens = Number(params.maxOutputTokens)
        if (params.presencePenalty) result.presencePenalty = Number(params.presencePenalty)
        if (params.targetSize) result.targetSize = Number(params.targetSize)
        if (params.autoCrop === 'true') result.autoCrop = true
        else if (params.autoCrop === 'false') result.autoCrop = false
        return result
      },
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Quiver API key' },
    model: { type: 'string', description: 'Model to use' },
    prompt: { type: 'string', description: 'Text prompt for SVG generation' },
    instructions: { type: 'string', description: 'Style instructions' },
    referenceFiles: { type: 'json', description: 'Reference image files' },
    referenceInput: { type: 'string', description: 'Reference image URLs (comma-separated)' },
    n: { type: 'number', description: 'Number of variants to generate' },
    imageFile: { type: 'json', description: 'Image file to vectorize' },
    imageInput: { type: 'string', description: 'Image URL to vectorize' },
    autoCrop: { type: 'string', description: 'Auto crop the image before processing' },
    targetSize: { type: 'number', description: 'Target size in pixels' },
    temperature: { type: 'number', description: 'Generation temperature' },
    topP: { type: 'number', description: 'Top-p sampling parameter' },
    maxOutputTokens: { type: 'number', description: 'Maximum output tokens' },
    presencePenalty: { type: 'number', description: 'Presence penalty' },
  },
  outputs: {
    file: { type: 'json', description: 'Generated SVG file' },
    files: { type: 'json', description: 'Array of generated SVG files (when n > 1)' },
    svgContent: { type: 'string', description: 'SVG content as a string' },
    id: { type: 'string', description: 'Generation ID' },
    usage: { type: 'json', description: 'Token usage statistics' },
    models: { type: 'json', description: 'List of available models' },
  },
}
