import { WorkspaceEventsIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const WorkspaceEventsBlock: BlockConfig = {
  type: 'workspace_events',
  name: 'Workspace Events',
  description: 'Trigger when a workspace alert rule fires on another workflow',
  longDescription:
    'React to workspace-level alert events — consecutive failures, failure-rate spikes, error counts, latency thresholds/spikes, and cost thresholds — raised by any other workflow in the workspace. Zelaxy evaluates run history on a schedule and runs this workflow once per firing event. The hosting workflow is always excluded to prevent a self-trigger loop.',
  category: 'triggers',
  icon: WorkspaceEventsIcon,
  bgColor: '#10B981', // Green color for triggers

  subBlocks: [
    {
      id: 'triggerConfig',
      title: 'Workspace Events Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'workspace_events',
      availableTriggers: ['workspace_events_poller'],
    },
  ],

  tools: {
    access: [], // No external tools needed for triggers
  },

  inputs: {}, // No inputs - events arrive from the workspace-events poller

  // Flattened by formatWebhookInput's workspace_events case
  outputs: {
    rule_type: { type: 'string', description: 'The alert rule type that fired' },
    reason: { type: 'string', description: 'Human-readable explanation of why the rule fired' },
    workflow_id: {
      type: 'string',
      description: 'ID of the workflow whose run triggered the event',
    },
    workflow_name: {
      type: 'string',
      description: 'Name of the workflow whose run triggered the event',
    },
    execution_id: { type: 'string', description: 'Execution ID of the triggering run' },
    status: { type: 'string', description: 'Run status: success or error' },
    level: { type: 'string', description: 'Run log level: info or error' },
    trigger: { type: 'string', description: 'How the triggering run was started' },
    duration_ms: { type: 'number', description: 'Total duration of the triggering run in ms' },
    cost: { type: 'number', description: 'Total cost of the triggering run' },
    started_at: { type: 'string', description: 'When the triggering run started (ISO)' },
    ended_at: { type: 'string', description: 'When the triggering run ended (ISO)' },
  },

  triggers: {
    enabled: true,
    available: ['workspace_events_poller'],
  },
}
