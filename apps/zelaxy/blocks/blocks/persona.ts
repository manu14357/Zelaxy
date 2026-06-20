import { PersonaIcon } from '@/components/icons/persona-icon'
import type { BlockConfig } from '@/blocks/types'
import type { PersonaResponse } from '@/tools/persona/types'

export const PersonaBlock: BlockConfig<PersonaResponse> = {
  type: 'persona',
  name: 'Persona',
  description: 'Manage identity verification inquiries',
  longDescription:
    'List identity verification inquiries, retrieve a single inquiry, and fetch an account through the Persona API. Authenticate with a Persona API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#4F46E5',
  icon: PersonaIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List inquiries', id: 'persona_list_inquiries' },
        { label: 'Get inquiry', id: 'persona_get_inquiry' },
        { label: 'Get account', id: 'persona_get_account' },
      ],
      value: () => 'persona_list_inquiries',
    },
    // List inquiries
    {
      id: 'status',
      title: 'Status',
      type: 'short-input',
      layout: 'half',
      placeholder: 'completed',
      condition: { field: 'operation', value: 'persona_list_inquiries' },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: { field: 'operation', value: 'persona_list_inquiries' },
    },
    // Get inquiry + get account
    {
      id: 'id',
      title: 'ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'inq_... or act_...',
      required: true,
      condition: { field: 'operation', value: ['persona_get_inquiry', 'persona_get_account'] },
    },
    {
      id: 'apiKey',
      title: 'Persona API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your Persona API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['persona_list_inquiries', 'persona_get_inquiry', 'persona_get_account'],
    config: {
      tool: (params) => params.operation || 'persona_list_inquiries',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Persona API key' },
    status: { type: 'string', description: 'Inquiry status filter' },
    limit: { type: 'number', description: 'Result limit' },
    id: { type: 'string', description: 'Inquiry or account ID' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Persona' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
