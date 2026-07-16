import { SentryIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const sentryWebhookTrigger: TriggerConfig = {
  id: 'sentry_webhook',
  name: 'Sentry Webhook',
  provider: 'sentry',
  description: 'Trigger workflow from Sentry events like new issues, error events, and alerts',
  version: '1.0.0',
  icon: SentryIcon,

  configFields: {
    clientSecret: {
      type: 'string',
      label: 'Client Secret (Recommended)',
      placeholder: 'Sentry integration client secret',
      description:
        'Found on your Sentry internal integration. Deliveries whose Sentry-Hook-Signature does not match are rejected.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's sentry case
  outputs: {
    action: {
      type: 'string',
      description: 'Action that occurred (created, resolved, assigned, triggered, ignored)',
    },
    resource: {
      type: 'string',
      description: 'Value of the Sentry-Hook-Resource header (issue, error, event_alert)',
    },
    issue_id: { type: 'string', description: 'Issue ID (issue events)' },
    issue_title: { type: 'string', description: 'Issue title' },
    issue_url: { type: 'string', description: 'Permalink to the issue in Sentry' },
    short_id: { type: 'string', description: 'Short issue identifier (e.g., MY-PROJECT-1)' },
    culprit: { type: 'string', description: 'Where the issue occurred' },
    level: { type: 'string', description: 'Severity level (error, warning, info, fatal)' },
    status: { type: 'string', description: 'Issue status (unresolved, resolved, ignored)' },
    event_count: { type: 'string', description: 'Number of times the issue occurred' },
    user_count: { type: 'number', description: 'Number of users affected' },
    first_seen: { type: 'string', description: 'When the issue was first seen' },
    last_seen: { type: 'string', description: 'When the issue was last seen' },
    project_slug: { type: 'string', description: 'Slug of the project the issue belongs to' },
    error_message: { type: 'string', description: 'Error message (error events)' },
    error_id: { type: 'string', description: 'Event ID (error events)' },
    environment: { type: 'string', description: 'Environment the event came from' },
    actor_name: { type: 'string', description: 'Who or what triggered the event' },
    data: { type: 'object', description: 'Full event payload as sent by Sentry' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to your Sentry Organization > Settings > Developer Settings > Custom Integrations.',
    'Click "Create New Integration" and choose "Internal Integration".',
    'Paste the <strong>Webhook URL</strong> (from above) into the "Webhook URL" field.',
    'Under "Webhooks", enable the resources you want (Issue, Error, Comment).',
    'Grant at least Read permission for Issue & Event, then save.',
    "Copy the integration's <strong>Client Secret</strong> into the field above so deliveries can be verified.",
    'To receive alerts, add a "Send a notification via <your integration>" action to a Sentry Alert Rule.',
  ],

  samplePayload: {
    action: 'created',
    installation: { uuid: 'a8dc1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b' },
    data: {
      issue: {
        id: '1234567890',
        shortId: 'MY-PROJECT-1',
        title: "TypeError: Cannot read property 'id' of undefined",
        culprit: 'app/routes/checkout in handler',
        status: 'unresolved',
        level: 'error',
        count: '3',
        userCount: 2,
        firstSeen: '2024-01-15T13:14:15.000000Z',
        lastSeen: '2024-01-15T14:20:00.000000Z',
        permalink: 'https://sentry.io/organizations/my-org/issues/1234567890/',
        project: { slug: 'my-project' },
      },
    },
    actor: { type: 'application', id: 'sentry', name: 'Sentry' },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sentry-Hook-Resource': 'issue',
      'Sentry-Hook-Signature': '<hmac-sha256-hex>',
    },
  },
}
