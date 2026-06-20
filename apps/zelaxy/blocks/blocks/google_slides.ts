import { GoogleSlidesIcon } from '@/components/icons/google-slides-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GoogleSlidesResponse } from '@/tools/google_slides/types'

export const GoogleSlidesBlock: BlockConfig<GoogleSlidesResponse> = {
  type: 'google_slides',
  name: 'Google Slides',
  description: 'Read, create, and update Google Slides presentations',
  longDescription:
    'Retrieve a presentation, create a new presentation, and apply batch update requests through the Google Slides API. Authenticate with a Google OAuth access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#F4B400',
  icon: GoogleSlidesIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get presentation', id: 'google_slides_get_presentation' },
        { label: 'Create presentation', id: 'google_slides_create_presentation' },
        { label: 'Batch update', id: 'google_slides_batch_update' },
      ],
      value: () => 'google_slides_get_presentation',
    },
    {
      id: 'presentationId',
      title: 'Presentation ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '1Abc...',
      condition: {
        field: 'operation',
        value: ['google_slides_get_presentation', 'google_slides_batch_update'],
      },
    },
    {
      id: 'title',
      title: 'Title',
      type: 'short-input',
      layout: 'full',
      placeholder: 'My Presentation',
      condition: { field: 'operation', value: 'google_slides_create_presentation' },
    },
    {
      id: 'requests',
      title: 'Requests',
      type: 'long-input',
      layout: 'full',
      placeholder: '[{"createSlide": {}}]',
      condition: { field: 'operation', value: 'google_slides_batch_update' },
    },
    {
      id: 'accessToken',
      title: 'Google Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'ya29....',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'google_slides_get_presentation',
      'google_slides_create_presentation',
      'google_slides_batch_update',
    ],
    config: {
      tool: (params) => params.operation || 'google_slides_get_presentation',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accessToken: { type: 'string', description: 'Google OAuth access token' },
    presentationId: { type: 'string', description: 'Google Slides presentation ID' },
    title: { type: 'string', description: 'Presentation title' },
    requests: { type: 'json', description: 'Array of batch update request objects' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Google Slides' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
