import { TwilioIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const twilioWebhookTrigger: TriggerConfig = {
  id: 'twilio_webhook',
  name: 'Twilio SMS',
  provider: 'twilio',
  description: 'Trigger workflow when your Twilio number receives an SMS or MMS message',
  version: '1.0.0',
  icon: TwilioIcon,

  configFields: {
    authToken: {
      type: 'string',
      label: 'Auth Token (Recommended)',
      placeholder: 'From your Twilio Console',
      description:
        'Your Twilio account Auth Token. Used to verify the X-Twilio-Signature on every delivery.',
      required: false,
      isSecret: true,
    },
  },

  // Twilio posts form-encoded PascalCase fields; formatWebhookInput exposes these snake_case names
  outputs: {
    from: { type: 'string', description: 'Sender phone number in E.164 format' },
    to: { type: 'string', description: 'Your Twilio number that received the message' },
    body: { type: 'string', description: 'Message text' },
    message_sid: { type: 'string', description: 'Unique message identifier' },
    account_sid: { type: 'string', description: 'Twilio account identifier' },
    message_status: { type: 'string', description: 'Message status (received, delivered, ...)' },
    num_media: { type: 'number', description: 'Number of media attachments (MMS)' },
    media: { type: 'array', description: 'Media attachments, each with url and content_type' },
    from_city: { type: 'string', description: 'Sender city, when Twilio can resolve it' },
    from_state: { type: 'string', description: 'Sender state' },
    from_country: { type: 'string', description: 'Sender country' },
    error_code: { type: 'string', description: 'Error code, when Twilio reports one' },
    error_message: { type: 'string', description: 'Error message' },
    raw: { type: 'object', description: 'All form fields exactly as Twilio sent them' },
  },

  instructions: [
    'Go to the <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer">Twilio Console</a> > Phone Numbers > Manage > Active numbers.',
    'Select the number you want to trigger the workflow.',
    'Under "Messaging", set "A message comes in" to <strong>Webhook</strong>.',
    'Paste the <strong>Webhook URL</strong> (from above) and set the method to <strong>HTTP POST</strong>.',
    'Copy your account <strong>Auth Token</strong> from the Console dashboard into the field above so deliveries can be verified.',
    'Save the number configuration, then text the number to test.',
  ],

  samplePayload: {
    MessageSid: 'SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    From: '+15551234567',
    To: '+15559876543',
    Body: 'Hello from Twilio',
    NumMedia: '0',
    FromCity: 'SAN FRANCISCO',
    FromState: 'CA',
    FromCountry: 'US',
    SmsStatus: 'received',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Twilio-Signature': '<base64-hmac-sha1>',
    },
  },
}
