import { ShieldCheckIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const clerkWebhookTrigger: TriggerConfig = {
  id: 'clerk_webhook',
  name: 'Clerk Webhook',
  provider: 'clerk',
  description:
    'Trigger workflow from Clerk events like users being created, updated or deleted, sessions starting, and organization membership changes',
  version: '1.0.0',
  icon: ShieldCheckIcon,

  configFields: {
    signingSecret: {
      type: 'string',
      label: 'Signing Secret (Recommended)',
      placeholder: 'whsec_...',
      description:
        'Shown on the Clerk webhook endpoint. Clerk signs deliveries with Svix; mismatches are rejected.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's clerk case
  outputs: {
    event_type: {
      type: 'string',
      description:
        'Event type (user.created, user.updated, user.deleted, session.created, organizationMembership.created, ...)',
    },
    object_id: { type: 'string', description: 'ID of the user, session, or organization' },
    email: { type: 'string', description: 'Primary email address (user events)' },
    first_name: { type: 'string', description: 'User first name' },
    last_name: { type: 'string', description: 'User last name' },
    full_name: { type: 'string', description: 'User first and last name joined' },
    username: { type: 'string', description: 'Username, when set' },
    image_url: { type: 'string', description: 'User avatar URL' },
    user_id: { type: 'string', description: 'Related user ID (session and membership events)' },
    organization: { type: 'object', description: 'Organization (membership events)' },
    name: { type: 'string', description: 'Organization name (organization events)' },
    slug: { type: 'string', description: 'Organization slug (organization events)' },
    created_at: { type: 'number', description: 'Record creation timestamp (epoch ms)' },
    updated_at: { type: 'number', description: 'Record update timestamp (epoch ms)' },
    data: { type: 'object', description: 'Full data object as sent by Clerk' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to the Clerk Dashboard > Configure > Webhooks.',
    'Click "Add Endpoint".',
    'Paste the <strong>Webhook URL</strong> (from above) into the "Endpoint URL" field.',
    'Subscribe to the events you want (e.g. user.created, user.updated, session.created).',
    'Create the endpoint, then copy its <strong>Signing Secret</strong> (starts with <code>whsec_</code>) into the field above.',
    'Use "Testing" in Clerk to send a sample event and confirm it reaches Zelaxy.',
  ],

  samplePayload: {
    type: 'user.created',
    object: 'event',
    data: {
      id: 'user_2abc123',
      first_name: 'Ada',
      last_name: 'Lovelace',
      username: 'ada',
      image_url: 'https://img.clerk.com/abc',
      primary_email_address_id: 'idn_2abc',
      email_addresses: [{ id: 'idn_2abc', email_address: 'ada@example.com' }],
      created_at: 1705324455000,
      updated_at: 1705324455000,
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'svix-id': 'msg_2abc123',
      'svix-timestamp': '1705324455',
      'svix-signature': 'v1,<base64-hmac>',
    },
  },
}
