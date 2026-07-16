import { VercelIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const vercelWebhookTrigger: TriggerConfig = {
  id: 'vercel_webhook',
  name: 'Vercel Webhook',
  provider: 'vercel',
  description:
    'Trigger workflow from Vercel events like deployment created, ready, error, or canceled, and project changes',
  version: '1.0.0',
  icon: VercelIcon,

  configFields: {
    webhookSecret: {
      type: 'string',
      label: 'Webhook Secret (Recommended)',
      placeholder: 'Shown when the webhook is created',
      description:
        'Vercel shows this when you create the webhook. Deliveries whose x-vercel-signature does not match are rejected.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's vercel case
  outputs: {
    event_type: {
      type: 'string',
      description:
        'Event type (deployment.created, deployment.succeeded, deployment.ready, deployment.error, deployment.canceled, project.created, ...)',
    },
    event_id: { type: 'string', description: 'Unique ID of the webhook event' },
    created_at: { type: 'number', description: 'Event creation timestamp (epoch ms)' },
    region: { type: 'string', description: 'Region the event came from, when present' },
    deployment_id: { type: 'string', description: 'Deployment ID' },
    deployment_url: { type: 'string', description: 'Deployment URL' },
    deployment_name: { type: 'string', description: 'Deployment name' },
    target: { type: 'string', description: 'Deployment target (production, preview)' },
    project_id: { type: 'string', description: 'Project ID' },
    project_name: { type: 'string', description: 'Project name' },
    team_id: { type: 'string', description: 'Team ID, when the project belongs to a team' },
    user_id: { type: 'string', description: 'ID of the user who triggered the event' },
    git_branch: { type: 'string', description: 'Git branch the deployment was built from' },
    git_sha: { type: 'string', description: 'Git commit SHA the deployment was built from' },
    git_message: { type: 'string', description: 'Commit message the deployment was built from' },
    inspector_url: { type: 'string', description: 'Link to the deployment in Vercel' },
    payload: { type: 'object', description: 'Full payload object as sent by Vercel' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to Vercel > your Team or Project > Settings > Webhooks.',
    'Click "Create Webhook".',
    'Paste the <strong>Webhook URL</strong> (from above) into the "Endpoint" field.',
    'Select the events you want (e.g., Deployment Created, Deployment Ready, Deployment Error).',
    'Choose the projects the webhook applies to, then click "Create".',
    'Copy the <strong>secret</strong> Vercel shows into the field above so deliveries can be verified.',
  ],

  samplePayload: {
    id: 'uev_1234567890abcdef',
    type: 'deployment.ready',
    createdAt: 1705324455000,
    region: 'iad1',
    payload: {
      team: { id: 'team_abc123' },
      user: { id: 'user_abc123' },
      project: { id: 'prj_abc123', name: 'zelaxy-web' },
      deployment: {
        id: 'dpl_abc123',
        name: 'zelaxy-web',
        url: 'zelaxy-web-abc123.vercel.app',
        target: 'production',
        inspectorUrl: 'https://vercel.com/acme/zelaxy-web/abc123',
        meta: {
          githubCommitRef: 'main',
          githubCommitSha: 'da1560886d4f094c3e6c9ef40349f7d38b5d27d7',
          githubCommitMessage: 'fix: correct minor typos in readme',
        },
      },
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-vercel-signature': '<hmac-sha1-hex>',
    },
  },
}
