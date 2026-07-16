import { TwilioIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { TwilioVoiceResponse } from '@/tools/twilio_voice/types'

export const TwilioVoiceBlock: BlockConfig<TwilioVoiceResponse> = {
  type: 'twilio_voice',
  name: 'Twilio Voice',
  description: 'Make and manage voice calls with Twilio',
  longDescription:
    'Initiate outbound calls, list calls, and get call details through the Twilio Voice API. Authenticate with a Twilio Account SID and Auth Token.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#F22F46',
  icon: TwilioIcon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Make call', id: 'twilio_voice_make_call' },
        { label: 'List calls', id: 'twilio_voice_list_calls' },
        { label: 'Get call', id: 'twilio_voice_get_call' },
      ],
      value: () => 'twilio_voice_make_call',
    },
    // Make call
    {
      id: 'To',
      title: 'To',
      type: 'short-input',
      layout: 'half',
      placeholder: '+19998887777',
      condition: { field: 'operation', value: 'twilio_voice_make_call' },
    },
    {
      id: 'From',
      title: 'From',
      type: 'short-input',
      layout: 'half',
      placeholder: '+15551234567',
      condition: { field: 'operation', value: 'twilio_voice_make_call' },
    },
    {
      id: 'Url',
      title: 'TwiML URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://example.com/twiml',
      condition: { field: 'operation', value: 'twilio_voice_make_call' },
    },
    // Get call
    {
      id: 'callSid',
      title: 'Call SID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'CA...',
      condition: { field: 'operation', value: 'twilio_voice_get_call' },
    },
    // List calls
    {
      id: 'limit',
      title: 'Limit',
      type: 'short-input',
      layout: 'half',
      placeholder: '20',
      condition: { field: 'operation', value: 'twilio_voice_list_calls' },
    },
    {
      id: 'accountSid',
      title: 'Account SID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'AC...',
      password: true,
      required: true,
    },
    {
      id: 'authToken',
      title: 'Auth Token',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Your Twilio Auth Token',
      password: true,
      required: true,
    },
    // TRIGGER MODE: Trigger configuration (only shown when trigger mode is active)
    {
      id: 'triggerConfig',
      title: 'Trigger Configuration',
      type: 'trigger-config',
      layout: 'full',
      triggerProvider: 'twilio_voice',
      availableTriggers: ['twilio_voice_webhook'],
    },
  ],
  tools: {
    access: ['twilio_voice_make_call', 'twilio_voice_list_calls', 'twilio_voice_get_call'],
    config: {
      tool: (params) => params.operation || 'twilio_voice_make_call',
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    accountSid: { type: 'string', description: 'Twilio Account SID' },
    authToken: { type: 'string', description: 'Twilio Auth Token' },
    To: { type: 'string', description: 'Number to call' },
    From: { type: 'string', description: 'Twilio number to call from' },
    Url: { type: 'string', description: 'TwiML instructions URL' },
    callSid: { type: 'string', description: 'Call SID' },
    limit: { type: 'number', description: 'Result limit' },
  },
  outputs: {
    data: { type: 'json', description: 'Result object or array from Twilio' },
    metadata: { type: 'json', description: 'Response metadata' },
    from: { type: 'string', description: 'Caller phone number (trigger events)' },
    call_sid: { type: 'string', description: 'Unique call identifier' },
    call_status: { type: 'string', description: 'Call status' },
    recording_url: { type: 'string', description: 'Recording URL, for recording callbacks' },
  },
  triggers: {
    enabled: true,
    available: ['twilio_voice_webhook'],
  },
}
