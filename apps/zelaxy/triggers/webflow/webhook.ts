import { WebhookIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const webflowWebhookTrigger: TriggerConfig = {
  id: 'webflow_webhook',
  name: 'Webflow Webhook',
  provider: 'webflow',
  description:
    'Trigger workflow from Webflow form submissions, CMS item changes, and e-commerce events',
  version: '1.0.0',
  icon: WebhookIcon,

  configFields: {},

  outputs: {
    event: {
      triggerType: {
        type: 'string',
        description:
          'Type of Webflow event (e.g., form_submission, collection_item_created, ecomm_new_order)',
      },
      site: {
        id: {
          type: 'string',
          description: 'Webflow site ID',
        },
        name: {
          type: 'string',
          description: 'Webflow site name',
        },
      },
      form: {
        name: {
          type: 'string',
          description: 'Form name (for form_submission events)',
        },
        data: {
          type: 'json',
          description: 'Form field values submitted by the user',
        },
      },
      item: {
        id: {
          type: 'string',
          description: 'CMS item ID (for collection item events)',
        },
        cmsLocaleId: {
          type: 'string',
          description: 'CMS locale ID',
        },
        fieldData: {
          type: 'json',
          description: 'CMS item field values',
        },
        lastPublished: {
          type: 'string',
          description: 'Date the item was last published (ISO 8601)',
        },
      },
      order: {
        orderId: {
          type: 'string',
          description: 'E-commerce order ID',
        },
        status: {
          type: 'string',
          description: 'Order status',
        },
        customerInfo: {
          type: 'json',
          description: 'Customer details including name and email',
        },
        purchasedItems: {
          type: 'json',
          description: 'Array of purchased items with name, quantity, and price',
        },
        total: {
          type: 'number',
          description: 'Order total in cents',
        },
      },
    },
  },

  instructions: [
    'Go to your <a href="https://webflow.com/dashboard" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">Webflow Dashboard</a> and open your site.',
    'Navigate to <strong>Site Settings → Integrations</strong> (or use the Webflow API).',
    'Scroll to the <strong>Webhooks</strong> section and click <strong>Add Webhook</strong>.',
    'Select the <strong>Trigger type</strong> (Form Submission, Collection Item Created, etc.).',
    'Enter the Webhook URL (from above) as the URL.',
    'Click <strong>Add Webhook</strong> to save.',
  ],

  samplePayload: {
    triggerType: 'form_submission',
    site: {
      id: 'site-id-abc123',
      name: 'My Webflow Site',
    },
    form: {
      name: 'Contact Form',
      data: {
        Name: 'John Smith',
        Email: 'john@example.com',
        Message: 'Hello, I would like more information.',
      },
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webflow-Signature': 'sha256=...',
    },
  },
}
