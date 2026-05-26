import { UsersIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const AshbyBlock: BlockConfig = {
  type: 'ashby',
  name: 'Ashby',
  description: 'Manage candidates and job applications in Ashby ATS',
  longDescription:
    'Integrate Ashby applicant tracking into your workflows. List and manage candidates, create applications, and track hiring pipeline stages.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#5D4ED6',
  icon: UsersIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List Candidates', id: 'ashby_list_candidates' },
        { label: 'Get Candidate', id: 'ashby_get_candidate' },
        { label: 'Create Candidate', id: 'ashby_create_candidate' },
        { label: 'Update Candidate', id: 'ashby_update_candidate' },
        { label: 'List Applications', id: 'ashby_list_applications' },
        { label: 'Get Job Postings', id: 'ashby_get_job_postings' },
      ],
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      password: true,
      placeholder: 'Your Ashby API key',
      required: true,
    },
    {
      id: 'candidateId',
      title: 'Candidate ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'candidate-id',
      condition: { field: 'operation', value: ['ashby_get_candidate', 'ashby_update_candidate'] },
    },
    {
      id: 'name',
      title: 'Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'John Doe',
      condition: {
        field: 'operation',
        value: ['ashby_create_candidate', 'ashby_update_candidate'],
      },
    },
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'half',
      placeholder: 'candidate@example.com',
      condition: {
        field: 'operation',
        value: ['ashby_create_candidate', 'ashby_update_candidate'],
      },
    },
  ],
  tools: {
    access: [
      'ashby_list_candidates',
      'ashby_get_candidate',
      'ashby_create_candidate',
      'ashby_update_candidate',
      'ashby_list_applications',
      'ashby_get_job_postings',
    ],
    config: {
      tool: (params) => params.operation || 'ashby_list_candidates',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'API key' },
    candidateId: { type: 'string', description: 'Candidate ID' },
    name: { type: 'string', description: 'Candidate name' },
    email: { type: 'string', description: 'Candidate email' },
  },
  outputs: {
    candidates: { type: 'json', description: 'Candidate list' },
    candidate: { type: 'json', description: 'Candidate details' },
    applications: { type: 'json', description: 'Application list' },
  },
}
