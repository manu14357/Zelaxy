import { ConfluenceIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const confluenceWebhookTrigger: TriggerConfig = {
  id: 'confluence_webhook',
  name: 'Confluence Webhook',
  provider: 'confluence',
  description: 'Trigger workflow from Confluence page, blog, and space events',
  version: '1.0.0',
  icon: ConfluenceIcon,

  configFields: {
    webhookSecret: {
      type: 'string',
      label: 'Webhook Secret',
      placeholder: 'Enter a secret to validate webhook requests',
      description:
        'Optional shared secret to validate that webhook deliveries originate from Confluence.',
      required: false,
      isSecret: true,
    },
  },

  outputs: {
    event: {
      event_type: {
        type: 'string',
        description:
          'Type of Confluence event (e.g., page_created, page_updated, blog_created)',
      },
      page: {
        id: {
          type: 'string',
          description: 'Page/blog post ID',
        },
        title: {
          type: 'string',
          description: 'Page or blog post title',
        },
        content_type: {
          type: 'string',
          description: 'Content type (page or blogpost)',
        },
        spaceKey: {
          type: 'string',
          description: 'Space key where the page lives',
        },
        version: {
          type: 'number',
          description: 'Current version number of the content',
        },
      },
      space: {
        id: {
          type: 'string',
          description: 'Space ID',
        },
        key: {
          type: 'string',
          description: 'Space key',
        },
        name: {
          type: 'string',
          description: 'Space name',
        },
      },
      author: {
        accountId: {
          type: 'string',
          description: 'Author account ID',
        },
        displayName: {
          type: 'string',
          description: 'Author display name',
        },
        email: {
          type: 'string',
          description: 'Author email address',
        },
      },
      timestamp: {
        type: 'string',
        description: 'Event timestamp (ISO 8601)',
      },
    },
  },

  instructions: [
    'Go to your Confluence instance and navigate to <strong>Settings → Webhooks</strong> (requires administrator access).',
    'Click <strong>Create a Webhook</strong>.',
    'Paste the Webhook URL (from above) into the URL field.',
    'Optionally add a secret token and enter it in the field above.',
    'Select the events you want to receive (page created/updated, blog created, etc.).',
    'Set the status to <strong>Enabled</strong> and save.',
  ],

  samplePayload: {
    timestamp: 1705312200000,
    event: 'page_created',
    userKey: 'user123',
    page: {
      id: '98765',
      title: 'My New Page',
      type: 'page',
      spaceKey: 'MYSPACE',
      version: 1,
    },
    space: {
      id: 'space456',
      key: 'MYSPACE',
      name: 'My Space',
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
