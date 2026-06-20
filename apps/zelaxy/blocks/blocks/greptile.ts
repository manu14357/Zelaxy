import { GreptileIcon } from '@/components/icons/greptile-icon'
import type { BlockConfig } from '@/blocks/types'
import type { GreptileResponse } from '@/tools/greptile/types'

export const GreptileBlock: BlockConfig<GreptileResponse> = {
  type: 'greptile',
  name: 'Greptile',
  description: 'Query, search, and index code repositories with Greptile',
  longDescription:
    'Ask natural-language questions about your codebase, search indexed repositories, and submit new repositories for indexing through the Greptile API. Authenticate with a Greptile API key and a GitHub access token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#16A34A',
  icon: GreptileIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Query', id: 'greptile_query' },
        { label: 'Search', id: 'greptile_search' },
        { label: 'Index repository', id: 'greptile_index_repository' },
      ],
      value: () => 'greptile_query',
    },
    {
      id: 'query',
      title: 'Query',
      type: 'long-input',
      layout: 'full',
      placeholder: 'How does authentication work?',
      condition: { field: 'operation', value: ['greptile_query', 'greptile_search'] },
    },
    {
      id: 'repositories',
      title: 'Repositories',
      type: 'long-input',
      layout: 'full',
      placeholder: '[{ "remote": "github", "repository": "owner/repo", "branch": "main" }]',
      condition: { field: 'operation', value: ['greptile_query', 'greptile_search'] },
    },
    {
      id: 'remote',
      title: 'Remote',
      type: 'short-input',
      layout: 'half',
      placeholder: 'github',
      condition: { field: 'operation', value: 'greptile_index_repository' },
    },
    {
      id: 'repository',
      title: 'Repository',
      type: 'short-input',
      layout: 'half',
      placeholder: 'owner/repo',
      condition: { field: 'operation', value: 'greptile_index_repository' },
    },
    {
      id: 'branch',
      title: 'Branch',
      type: 'short-input',
      layout: 'full',
      placeholder: 'main',
      condition: { field: 'operation', value: 'greptile_index_repository' },
    },
    {
      id: 'githubToken',
      title: 'GitHub Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'ghp_...',
      password: true,
      required: true,
    },
    {
      id: 'apiKey',
      title: 'Greptile API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Greptile API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['greptile_query', 'greptile_search', 'greptile_index_repository'],
    config: {
      tool: (params) => params.operation || 'greptile_query',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Greptile API key' },
    githubToken: { type: 'string', description: 'GitHub access token' },
    query: { type: 'string', description: 'Query or search text' },
    repositories: { type: 'json', description: 'Repositories to query or search' },
    remote: { type: 'string', description: 'Repository source host' },
    repository: { type: 'string', description: 'Repository identifier' },
    branch: { type: 'string', description: 'Branch to index' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object from Greptile' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
