import { DiscordIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const discordWebhookTrigger: TriggerConfig = {
  id: 'discord_webhook',
  name: 'Discord Webhook',
  provider: 'discord',
  description: 'Trigger workflow from Discord messages and events via Outgoing Webhooks',
  version: '1.0.0',
  icon: DiscordIcon,

  configFields: {},

  outputs: {
    message: {
      id: {
        type: 'string',
        description: 'Discord message ID',
      },
      content: {
        type: 'string',
        description: 'Message text content',
      },
      author: {
        id: {
          type: 'string',
          description: 'Author user ID',
        },
        username: {
          type: 'string',
          description: 'Author username',
        },
        discriminator: {
          type: 'string',
          description: 'Author discriminator (e.g., 1234)',
        },
        avatar: {
          type: 'string',
          description: 'Author avatar hash',
        },
        bot: {
          type: 'boolean',
          description: 'Whether the author is a bot',
        },
      },
      channel_id: {
        type: 'string',
        description: 'Channel ID where the message was sent',
      },
      guild_id: {
        type: 'string',
        description: 'Guild (server) ID',
      },
      timestamp: {
        type: 'string',
        description: 'Message timestamp (ISO 8601)',
      },
      message_type: {
        type: 'number',
        description: 'Message type (0 = Default, 19 = Reply, etc.)',
      },
      mentions: {
        type: 'json',
        description: 'Array of mentioned users',
      },
      attachments: {
        type: 'json',
        description: 'Array of file attachments',
      },
    },
  },

  instructions: [
    'In Discord, go to <strong>Server Settings → Integrations → Webhooks</strong>.',
    'Click <strong>New Webhook</strong>, give it a name, and select the channel to post to.',
    "Copy the webhook URL — this is what you'll use to send events to this workflow.",
    'To receive <em>incoming</em> Discord events (messages, reactions, etc.), you need a Discord Bot or a service like <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">Zapier</a> that forwards events to this workflow URL.',
    'Paste the Webhook URL (from above) as the destination for your forwarded Discord events.',
  ],

  samplePayload: {
    id: '1234567890123456789',
    type: 0,
    content: 'Hello from Discord!',
    channel_id: '9876543210987654321',
    author: {
      id: '111222333444555666',
      username: 'exampleuser',
      discriminator: '0',
      avatar: 'abc123def456',
      bot: false,
    },
    guild_id: '777888999000111222',
    timestamp: '2024-01-15T10:30:00.000000+00:00',
    mentions: [],
    attachments: [],
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
