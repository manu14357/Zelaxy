import { MicrosoftIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const azureDevOpsWebhookTrigger: TriggerConfig = {
  id: 'azure_devops_webhook',
  name: 'Azure DevOps Webhook',
  provider: 'azure_devops',
  description:
    'Trigger workflow from Azure DevOps events like builds completing, work items changing, and pull requests',
  version: '1.0.0',
  icon: MicrosoftIcon,

  configFields: {},

  // Flattened by formatWebhookInput's azure_devops case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (build.complete, workitem.created, git.pullrequest.created)',
    },
    subscription_id: { type: 'string', description: 'ID of the service hook subscription' },
    message: { type: 'string', description: 'Human-readable summary of the event' },
    detailed_message: { type: 'string', description: 'Detailed summary of the event' },
    build_number: { type: 'string', description: 'Build number (build events)' },
    build_status: { type: 'string', description: 'Build status (build events)' },
    build_result: { type: 'string', description: 'Build result (succeeded, failed, canceled)' },
    work_item_id: { type: 'number', description: 'Work item ID (work item events)' },
    work_item_title: { type: 'string', description: 'Work item title' },
    work_item_state: { type: 'string', description: 'Work item state' },
    pull_request_id: { type: 'number', description: 'Pull request ID (PR events)' },
    pull_request_title: { type: 'string', description: 'Pull request title' },
    project: { type: 'string', description: 'Project name' },
    resource: { type: 'object', description: 'Full resource object as sent by Azure DevOps' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to your Azure DevOps Project > Project settings > Service hooks.',
    'Click "+" to create a subscription and choose <strong>Web Hooks</strong>.',
    'Select the event you want (e.g. Build completed, Work item created).',
    'Paste the <strong>Webhook URL</strong> (from above) into the "URL" field.',
    'Azure DevOps does not sign webhooks - keep the URL secret and use its Basic auth fields or an IP allowlist if you need stronger guarantees.',
    'Click "Test" then "Finish".',
  ],

  samplePayload: {
    eventType: 'build.complete',
    message: {
      text: 'Build 20240115.1 succeeded',
    },
    resource: {
      buildNumber: '20240115.1',
      status: 'completed',
      result: 'succeeded',
      project: {
        name: 'Zelaxy',
      },
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
