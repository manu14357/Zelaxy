import { WorkspaceEventsIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const workspaceEventsPollingTrigger: TriggerConfig = {
  id: 'workspace_events_poller',
  name: 'Workspace Events',
  provider: 'workspace_events',
  description:
    'Trigger workflow when a workspace alert rule fires (failures, latency, cost, error spikes) on another workflow',
  version: '1.0.0',
  icon: WorkspaceEventsIcon,

  configFields: {
    ruleType: {
      type: 'select',
      label: 'Event type',
      description:
        'Which alert rule to listen for across the workspace. Choose "any" to react to every rule type.',
      options: [
        'any',
        'consecutive_failures',
        'failure_rate',
        'error_count',
        'latency_threshold',
        'latency_spike',
        'cost_threshold',
      ],
      defaultValue: 'any',
      required: true,
    },
    ruleConfig: {
      type: 'string',
      label: 'Thresholds (JSON)',
      placeholder: '{ "count": 3, "windowHours": 24, "durationMs": 30000, "dollars": 1 }',
      description:
        'Optional JSON overriding the rule thresholds. Keys mirror the alert engine: count, windowHours, durationMs, dollars, percent. Leave blank for defaults.',
    },
    workflowIds: {
      type: 'string',
      label: 'Watched workflow IDs',
      placeholder: 'wf_abc, wf_def',
      description:
        'Comma-separated workflow IDs to watch. Leave blank to watch every workflow in the workspace. The workflow hosting this trigger is always excluded to avoid a self-trigger loop.',
    },
  },

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
    trigger: {
      type: 'string',
      description: 'How the triggering run was started (api, webhook, ...)',
    },
    duration_ms: { type: 'number', description: 'Total duration of the triggering run in ms' },
    cost: { type: 'number', description: 'Total cost of the triggering run' },
    started_at: { type: 'string', description: 'When the triggering run started (ISO)' },
    ended_at: { type: 'string', description: 'When the triggering run ended (ISO)' },
    event: { type: 'object', description: 'The full event object' },
    raw: { type: 'object', description: 'Complete payload as delivered by the poller' },
  },

  instructions: [
    'Pick the <strong>Event type</strong> to listen for — or "any" to react to every workspace alert rule.',
    "This trigger has no webhook URL to register: Zelaxy evaluates your workspace's run history on a schedule and runs this workflow once per firing event.",
    'The workflow that hosts this trigger is <strong>always excluded</strong> from evaluation, so reacting to an event can never re-trigger itself.',
    '<strong>Connecting does not replay history:</strong> the first poll records existing runs and triggers nothing. Only runs that complete afterwards can start a run.',
    'Thresholds match the workspace alert engine. Override them with the <strong>Thresholds (JSON)</strong> field, or leave it blank for the same defaults used by workspace notifications.',
  ],

  samplePayload: {
    event: {
      rule_type: 'consecutive_failures',
      reason: 'Last 3 runs all failed',
      workflow_id: 'wf_abc123',
      workflow_name: 'Nightly sync',
      execution_id: 'exec_xyz789',
      status: 'error',
      level: 'error',
      trigger: 'schedule',
      duration_ms: 4200,
      cost: 0.0123,
      started_at: '2024-01-15T13:14:15.000Z',
      ended_at: '2024-01-15T13:14:19.200Z',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
