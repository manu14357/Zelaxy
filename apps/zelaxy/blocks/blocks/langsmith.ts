import { LangSmithIcon } from '@/components/icons/langsmith-icon'
import type { BlockConfig } from '@/blocks/types'
import type { LangSmithResponse } from '@/tools/langsmith/types'

export const LangSmithBlock: BlockConfig<LangSmithResponse> = {
  type: 'langsmith',
  name: 'LangSmith',
  description: 'Inspect runs and submit feedback in LangSmith',
  longDescription:
    'List runs in a session, fetch a single run by ID, and create feedback through the LangSmith API. Authenticate with a LangSmith API key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#1C3C3C',
  icon: LangSmithIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'List runs', id: 'langsmith_list_runs' },
        { label: 'Get run', id: 'langsmith_get_run' },
        { label: 'Create feedback', id: 'langsmith_create_feedback' },
      ],
      value: () => 'langsmith_list_runs',
    },
    // List runs
    {
      id: 'session',
      title: 'Session ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'project / session ID',
      condition: { field: 'operation', value: 'langsmith_list_runs' },
    },
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '10',
      condition: { field: 'operation', value: 'langsmith_list_runs' },
    },
    // Get run
    {
      id: 'runId',
      title: 'Run ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'run UUID',
      condition: { field: 'operation', value: 'langsmith_get_run' },
    },
    // Create feedback
    {
      id: 'run_id',
      title: 'Run ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'run UUID',
      condition: { field: 'operation', value: 'langsmith_create_feedback' },
    },
    {
      id: 'key',
      title: 'Feedback Key',
      type: 'short-input',
      layout: 'half',
      placeholder: 'correctness',
      condition: { field: 'operation', value: 'langsmith_create_feedback' },
    },
    {
      id: 'score',
      title: 'Score',
      type: 'short-input',
      layout: 'half',
      placeholder: '1',
      condition: { field: 'operation', value: 'langsmith_create_feedback' },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'lsv2_...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['langsmith_list_runs', 'langsmith_get_run', 'langsmith_create_feedback'],
    config: {
      tool: (params) => params.operation || 'langsmith_list_runs',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'LangSmith API key' },
    session: { type: 'string', description: 'Session (project) ID' },
    limit: { type: 'number', description: 'Result limit' },
    runId: { type: 'string', description: 'Run ID to retrieve' },
    run_id: { type: 'string', description: 'Run ID to attach feedback to' },
    key: { type: 'string', description: 'Feedback key' },
    score: { type: 'number', description: 'Feedback score' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from LangSmith' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
