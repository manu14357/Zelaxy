import { WizaIcon } from '@/components/icons/wiza-icon'
import type { BlockConfig } from '@/blocks/types'
import type { WizaResponse } from '@/tools/wiza/types'

export const WizaBlock: BlockConfig<WizaResponse> = {
  type: 'wiza',
  name: 'Wiza',
  description: 'Build prospect lists and reveal contacts',
  longDescription:
    'Create prospect lists, fetch list status, retrieve revealed contacts, and reveal an individual from a LinkedIn URL through the Wiza API. Authenticate with a Wiza API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#5B21B6',
  icon: WizaIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create list', id: 'wiza_create_list' },
        { label: 'Get list', id: 'wiza_get_list' },
        { label: 'Get contacts', id: 'wiza_get_contacts' },
        { label: 'Reveal individual', id: 'wiza_reveal_individual' },
      ],
      value: () => 'wiza_create_list',
    },
    // Create list
    {
      id: 'name',
      title: 'List Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'My prospect list',
      required: true,
      condition: { field: 'operation', value: 'wiza_create_list' },
    },
    {
      id: 'max_profiles',
      title: 'Max Profiles',
      type: 'short-input',
      layout: 'half',
      placeholder: '100',
      condition: { field: 'operation', value: 'wiza_create_list' },
    },
    {
      id: 'filters',
      title: 'Filters',
      type: 'long-input',
      layout: 'full',
      placeholder: '{ "job_title": [{ "v": "CEO", "s": "i" }] }',
      condition: { field: 'operation', value: 'wiza_create_list' },
    },
    // Get list + get contacts
    {
      id: 'id',
      title: 'List ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter the list ID',
      required: true,
      condition: { field: 'operation', value: ['wiza_get_list', 'wiza_get_contacts'] },
    },
    // Reveal individual
    {
      id: 'linkedin_url',
      title: 'LinkedIn URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://www.linkedin.com/in/janedoe',
      required: true,
      condition: { field: 'operation', value: 'wiza_reveal_individual' },
    },
    {
      id: 'apiKey',
      title: 'Wiza API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your Wiza API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['wiza_create_list', 'wiza_get_list', 'wiza_get_contacts', 'wiza_reveal_individual'],
    config: {
      tool: (params) => params.operation || 'wiza_create_list',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Wiza API key' },
    name: { type: 'string', description: 'List name' },
    max_profiles: { type: 'number', description: 'Maximum profiles for the list' },
    filters: { type: 'json', description: 'Prospect search filters' },
    id: { type: 'string', description: 'List ID' },
    linkedin_url: { type: 'string', description: 'LinkedIn profile URL' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Wiza' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
