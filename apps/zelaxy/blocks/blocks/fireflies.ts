import { FirefliesIcon } from '@/components/icons/fireflies-icon'
import type { BlockConfig } from '@/blocks/types'
import type { FirefliesResponse } from '@/tools/fireflies/types'

export const FirefliesBlock: BlockConfig<FirefliesResponse> = {
  type: 'fireflies',
  name: 'Fireflies',
  description: 'Access meeting transcripts and users in Fireflies.ai',
  longDescription:
    'List meeting transcripts, get a single transcript with summary and action items, and fetch user information through the Fireflies.ai GraphQL API. Authenticate with a Fireflies API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#6E3AFF',
  icon: FirefliesIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List transcripts', id: 'fireflies_list_transcripts' },
        { label: 'Get transcript', id: 'fireflies_get_transcript' },
        { label: 'Get user', id: 'fireflies_get_user' },
      ],
      value: () => 'fireflies_list_transcripts',
    },
    // List transcripts
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: { field: 'operation', value: 'fireflies_list_transcripts' },
    },
    // Get transcript
    {
      id: 'transcriptId',
      title: 'Transcript ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'abc123def456',
      condition: { field: 'operation', value: 'fireflies_get_transcript' },
    },
    // Get user
    {
      id: 'userId',
      title: 'User ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'user_abc123',
      condition: { field: 'operation', value: 'fireflies_get_user' },
    },
    {
      id: 'apiKey',
      title: 'Fireflies API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your Fireflies API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['fireflies_list_transcripts', 'fireflies_get_transcript', 'fireflies_get_user'],
    config: {
      tool: (params) => params.operation || 'fireflies_list_transcripts',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Fireflies API key' },
    limit: { type: 'number', description: 'Result limit' },
    transcriptId: { type: 'string', description: 'Transcript ID' },
    userId: { type: 'string', description: 'User ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Fireflies' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
