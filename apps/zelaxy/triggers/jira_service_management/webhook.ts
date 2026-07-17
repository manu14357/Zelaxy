import { JiraServiceManagementIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const jiraServiceManagementWebhookTrigger: TriggerConfig = {
  id: 'jira_service_management_webhook',
  name: 'Jira Service Management Webhook',
  provider: 'jira_service_management',
  description:
    'Trigger workflow from Jira Service Management events when a request is created, updated, commented on, or resolved',
  version: '1.0.0',
  icon: JiraServiceManagementIcon,

  configFields: {
    webhookSecret: {
      type: 'string',
      label: 'Webhook Secret (Recommended)',
      placeholder: 'Generate or enter a strong secret',
      description:
        'Jira sends this as a Bearer token when you add it to the webhook. Deliveries that do not match are rejected.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's jira_service_management case
  outputs: {
    event_type: {
      type: 'string',
      description:
        'Jira event (jira:issue_created, jira:issue_updated, comment_created, jira:issue_deleted)',
    },
    issue_event_type: {
      type: 'string',
      description: 'More specific event name (e.g. issue_commented, issue_generic)',
    },
    issue_key: { type: 'string', description: 'Issue key (e.g. SUP-123)' },
    issue_id: { type: 'string', description: 'Issue ID' },
    summary: { type: 'string', description: 'Request summary (also the workflow input)' },
    description: { type: 'string', description: 'Request description' },
    status: { type: 'string', description: 'Current status name' },
    priority: { type: 'string', description: 'Priority name' },
    request_type: { type: 'string', description: 'Customer request type, when present' },
    reporter_name: { type: 'string', description: 'Reporter display name' },
    reporter_email: { type: 'string', description: 'Reporter email address' },
    assignee_name: { type: 'string', description: 'Assignee display name' },
    project_key: { type: 'string', description: 'Project key' },
    user_name: { type: 'string', description: 'Display name of the user who caused the event' },
    comment_body: { type: 'string', description: 'Comment text (comment events)' },
    comment_author: { type: 'string', description: 'Comment author display name' },
    comment_public: {
      type: 'boolean',
      description: 'Whether the comment is visible to the customer',
    },
    changelog: { type: 'object', description: 'What changed (update events)' },
    timestamp: { type: 'number', description: 'Event timestamp (epoch ms)' },
    issue: { type: 'object', description: 'Full issue object as sent by Jira' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'In Jira, go to <strong>Settings > System > WebHooks</strong>.',
    'Click <strong>Create a WebHook</strong>.',
    'Paste the <strong>Webhook URL</strong> (from above) into the URL field.',
    'Enter the <strong>Webhook Secret</strong> (from above) into the "Secret" field so deliveries can be verified.',
    'Under <strong>Issue</strong>, tick the events you want (created, updated, deleted) and, under <strong>Comment</strong>, tick created if you want comment events.',
    'Optionally add a JQL filter such as <code>project = SUP</code> so only your service desk project fires the workflow.',
    'Click <strong>Create</strong>.',
  ],

  samplePayload: {
    timestamp: 1705324455000,
    webhookEvent: 'jira:issue_created',
    issue_event_type_name: 'issue_created',
    user: { displayName: 'Ada Lovelace', emailAddress: 'ada@example.com' },
    issue: {
      id: '10001',
      key: 'SUP-123',
      fields: {
        summary: 'Laptop will not boot',
        description: 'Dead on arrival after the update.',
        status: { name: 'Waiting for support' },
        priority: { name: 'High' },
        project: { key: 'SUP', name: 'Support' },
        reporter: { displayName: 'Alan Turing', emailAddress: 'alan@example.com' },
        assignee: { displayName: 'Ada Lovelace' },
      },
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <your-webhook-secret>',
    },
  },
}
