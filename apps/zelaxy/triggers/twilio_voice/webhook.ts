import { TwilioIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const twilioVoiceWebhookTrigger: TriggerConfig = {
  id: 'twilio_voice_webhook',
  name: 'Twilio Voice',
  provider: 'twilio_voice',
  description:
    'Trigger workflow when your Twilio number receives a call, or when a call status or recording changes',
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

  outputs: {
    from: { type: 'string', description: 'Caller phone number in E.164 format' },
    to: { type: 'string', description: 'Your Twilio number that received the call' },
    call_sid: { type: 'string', description: 'Unique call identifier' },
    account_sid: { type: 'string', description: 'Twilio account identifier' },
    call_status: {
      type: 'string',
      description: 'Call status (ringing, in-progress, completed, busy, failed, no-answer)',
    },
    direction: { type: 'string', description: 'Call direction (inbound, outbound-api)' },
    call_duration: { type: 'string', description: 'Call duration in seconds, when completed' },
    recording_url: { type: 'string', description: 'Recording URL, for recording callbacks' },
    recording_sid: { type: 'string', description: 'Recording identifier' },
    recording_duration: { type: 'string', description: 'Recording duration in seconds' },
    from_city: { type: 'string', description: 'Caller city, when Twilio can resolve it' },
    from_state: { type: 'string', description: 'Caller state' },
    from_country: { type: 'string', description: 'Caller country' },
    raw: { type: 'object', description: 'All form fields exactly as Twilio sent them' },
  },

  instructions: [
    'Go to the <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer">Twilio Console</a> > Phone Numbers > Manage > Active numbers.',
    'Select the number you want to trigger the workflow.',
    'Under "Voice & Fax", set "A call comes in" to <strong>Webhook</strong>.',
    'Paste the <strong>Webhook URL</strong> (from above) and set the method to <strong>HTTP POST</strong>.',
    'Copy your account <strong>Auth Token</strong> into the field above so deliveries can be verified.',
    '<strong>Note:</strong> Twilio expects TwiML in response to control the call. Zelaxy acknowledges the webhook and starts your workflow, so use this to react to calls (log, notify, enrich) rather than to script the call flow itself.',
  ],

  samplePayload: {
    CallSid: 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    From: '+15551234567',
    To: '+15559876543',
    CallStatus: 'ringing',
    Direction: 'inbound',
    FromCity: 'SAN FRANCISCO',
    FromState: 'CA',
    FromCountry: 'US',
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Twilio-Signature': '<base64-hmac-sha1>',
    },
  },
}
