import { RevenueCatIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const revenuecatWebhookTrigger: TriggerConfig = {
  id: 'revenuecat_webhook',
  name: 'RevenueCat Webhook',
  provider: 'revenuecat',
  description:
    'Trigger workflow from RevenueCat events like purchases, renewals, cancellations, and expirations',
  version: '1.0.0',
  icon: RevenueCatIcon,

  configFields: {
    authHeader: {
      type: 'string',
      label: 'Authorization Header Value (Recommended)',
      placeholder: 'Enter the value configured in the provider',
      description:
        'The value you set in RevenueCats Authorization header field. Zelaxy requires it verbatim.',
      required: false,
      isSecret: true,
    },
  },

  // Flattened by formatWebhookInput's revenuecat case
  outputs: {
    event_type: {
      type: 'string',
      description: 'Event type (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION)',
    },
    event_id: { type: 'string', description: 'Unique event ID' },
    app_user_id: { type: 'string', description: 'Your app user ID' },
    product_id: { type: 'string', description: 'Product identifier' },
    entitlement_ids: { type: 'array', description: 'Entitlements the event affects' },
    store: { type: 'string', description: 'Store (APP_STORE, PLAY_STORE, STRIPE)' },
    environment: { type: 'string', description: 'SANDBOX or PRODUCTION' },
    period_type: { type: 'string', description: 'Period type (TRIAL, INTRO, NORMAL)' },
    price: { type: 'number', description: 'Price paid' },
    currency: { type: 'string', description: 'Currency code' },
    country_code: { type: 'string', description: 'Purchaser country code' },
    expiration_at_ms: { type: 'number', description: 'Subscription expiry (epoch ms)' },
    purchased_at_ms: { type: 'number', description: 'Purchase time (epoch ms)' },
    cancel_reason: { type: 'string', description: 'Cancellation reason, when present' },
    event: { type: 'object', description: 'Full event object as sent by RevenueCat' },
    raw: { type: 'object', description: 'Complete original webhook payload' },
  },

  instructions: [
    'Go to RevenueCat > Project settings > Integrations > Webhooks.',
    'Click "Add webhook".',
    'Paste the <strong>Webhook URL</strong> (from above) into the "Webhook URL" field.',
    'Set the <strong>Authorization header value</strong> and copy the same value into the field above.',
    'Choose the environment and events, then save.',
  ],

  samplePayload: {
    api_version: '1.0',
    event: {
      id: 'evt_1',
      type: 'INITIAL_PURCHASE',
      app_user_id: 'user_123',
      product_id: 'premium_monthly',
      entitlement_ids: ['premium'],
      store: 'APP_STORE',
      environment: 'PRODUCTION',
      price: 9.99,
      currency: 'USD',
      purchased_at_ms: 1705324455000,
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: '<your-value>',
    },
  },
}
