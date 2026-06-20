import { TriggerDevIcon } from '@/components/icons/trigger-dev-icon'
import type { BlockConfig } from '@/blocks/types'
import type { TriggerDevResponse } from '@/tools/trigger_dev/types'

export const TriggerDevBlock: BlockConfig<TriggerDevResponse> = {
  type: 'trigger_dev',
  name: 'Trigger.dev',
  description: 'Trigger tasks and inspect runs in Trigger.dev',
  longDescription:
    'Trigger tasks with a JSON payload, retrieve run details, and list runs through the Trigger.dev API. Authenticate with a Trigger.dev secret key.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#4F46E5',
  icon: TriggerDevIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Trigger task', id: 'trigger_dev_trigger_task' },
        { label: 'Get run', id: 'trigger_dev_get_run' },
        { label: 'List runs', id: 'trigger_dev_list_runs' },
      ],
      value: () => 'trigger_dev_trigger_task',
    },
    // Trigger task
    {
      id: 'taskIdentifier',
      title: 'Task Identifier',
      type: 'short-input',
      layout: 'full',
      placeholder: 'send-welcome-email',
      condition: {
        field: 'operation',
        value: ['trigger_dev_trigger_task', 'trigger_dev_list_runs'],
      },
    },
    {
      id: 'payload',
      title: 'Payload',
      type: 'long-input',
      layout: 'full',
      placeholder: '{"userId":"user_123"}',
      condition: { field: 'operation', value: 'trigger_dev_trigger_task' },
    },
    {
      id: 'idempotencyKey',
      title: 'Idempotency Key',
      type: 'short-input',
      layout: 'half',
      placeholder: 'optional',
      condition: { field: 'operation', value: 'trigger_dev_trigger_task' },
    },
    // Get run
    {
      id: 'runId',
      title: 'Run ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'run_...',
      condition: { field: 'operation', value: 'trigger_dev_get_run' },
    },
    // List runs
    {
      id: 'status',
      title: 'Status',
      type: 'short-input',
      layout: 'half',
      placeholder: 'COMPLETED',
      condition: { field: 'operation', value: 'trigger_dev_list_runs' },
    },
    {
      id: 'pageSize',
      title: 'Page Size',
      type: 'short-input',
      layout: 'half',
      placeholder: '25',
      condition: { field: 'operation', value: 'trigger_dev_list_runs' },
    },
    {
      id: 'apiKey',
      title: 'Trigger.dev Secret Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'tr_...',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['trigger_dev_trigger_task', 'trigger_dev_get_run', 'trigger_dev_list_runs'],
    config: {
      tool: (params) => params.operation || 'trigger_dev_trigger_task',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Trigger.dev secret key' },
    taskIdentifier: { type: 'string', description: 'Task identifier' },
    payload: { type: 'json', description: 'Task payload' },
    idempotencyKey: { type: 'string', description: 'Idempotency key' },
    runId: { type: 'string', description: 'Run ID' },
    status: { type: 'string', description: 'Run status filter' },
    pageSize: { type: 'number', description: 'Page size' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Trigger.dev' },
    metadata: { type: 'json', description: 'Response metadata' },
  },
}
