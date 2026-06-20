import { GoogleFormsIcon } from '@/components/icons/google-forms-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GoogleFormsResponse } from '@/tools/google_forms/types'

export const GoogleFormsBlock: BlockConfig<GoogleFormsResponse> = {
  type: 'google_forms',
  name: 'Google Forms',
  description: 'Read forms and responses from Google Forms',
  longDescription:
    'Retrieve a form structure, list responses, and fetch individual responses from the Google Forms API. Authenticate with a Google OAuth access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#7248B9',
  icon: GoogleFormsIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get form', id: 'google_forms_get_form' },
        { label: 'List responses', id: 'google_forms_list_responses' },
        { label: 'Get response', id: 'google_forms_get_response' },
      ],
      value: () => 'google_forms_get_form',
    },
    {
      id: 'formId',
      title: 'Form ID',
      type: 'short-input',
      layout: 'full',
      placeholder: '1FAIpQLSc...',
      condition: {
        field: 'operation',
        value: [
          'google_forms_get_form',
          'google_forms_list_responses',
          'google_forms_get_response',
        ],
      },
    },
    {
      id: 'responseId',
      title: 'Response ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'ACYDBNj...',
      condition: { field: 'operation', value: 'google_forms_get_response' },
    },
    {
      id: 'filter',
      title: 'Filter',
      type: 'short-input',
      layout: 'full',
      placeholder: 'timestamp > 2024-01-01T00:00:00Z',
      condition: { field: 'operation', value: 'google_forms_list_responses' },
    },
    {
      id: 'pageSize',
      title: 'Page Size',
      type: 'short-input',
      layout: 'half',
      placeholder: '100',
      condition: { field: 'operation', value: 'google_forms_list_responses' },
    },
    {
      id: 'pageToken',
      title: 'Page Token',
      type: 'short-input',
      layout: 'half',
      condition: { field: 'operation', value: 'google_forms_list_responses' },
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
    access: ['google_forms_get_form', 'google_forms_list_responses', 'google_forms_get_response'],
    config: {
      tool: (params) => params.operation || 'google_forms_get_form',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accessToken: { type: 'string', description: 'Google OAuth access token' },
    formId: { type: 'string', description: 'Google Forms form ID' },
    responseId: { type: 'string', description: 'Form response ID' },
    filter: { type: 'string', description: 'Response filter expression' },
    pageSize: { type: 'number', description: 'Maximum responses to return' },
    pageToken: { type: 'string', description: 'Pagination token' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Google Forms' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
