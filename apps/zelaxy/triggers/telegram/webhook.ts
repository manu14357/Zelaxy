import { TelegramIcon } from '@/components/icons'
import type { TriggerConfig } from '../types'

export const telegramWebhookTrigger: TriggerConfig = {
  id: 'telegram_webhook',
  name: 'Telegram Webhook',
  provider: 'telegram',
  description: 'Trigger workflow from Telegram bot messages and events',
  version: '1.0.0',
  icon: TelegramIcon,

  configFields: {
    botToken: {
      type: 'string',
      label: 'Bot Token',
      placeholder: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
      description: 'Your Telegram Bot Token from BotFather',
      required: true,
      isSecret: true,
    },
  },

  outputs: {
    // Top-level text input from the message
    input: {
      type: 'string',
      description: 'Message text content (primary input for AI blocks)',
    },
    // Direct chat ID shortcut — always wire this to Telegram block chatId
    chatId: {
      type: 'number',
      description:
        'Chat ID for sending replies — always use this as chatId in Telegram blocks (equals chat.id)',
    },
    // Message metadata
    message: {
      id: {
        type: 'number',
        description: 'Unique message identifier',
      },
      text: {
        type: 'string',
        description: 'Message text content',
      },
      date: {
        type: 'number',
        description: 'Date the message was sent (Unix timestamp)',
      },
      messageType: {
        type: 'string',
        description:
          'Type of message (text, photo, document, audio, video, voice, sticker, location, contact, poll)',
      },
    },
    // Sender information (message.from)
    sender: {
      id: {
        type: 'number',
        description:
          "Sender's Telegram user account ID (NOT the chat ID — use top-level chatId for replies)",
      },
      firstName: {
        type: 'string',
        description: 'First name of the sender',
      },
      lastName: {
        type: 'string',
        description: 'Last name of the sender',
      },
      username: {
        type: 'string',
        description: 'Username of the sender',
      },
      languageCode: {
        type: 'string',
        description: 'IETF language code of the sender',
      },
      isBot: {
        type: 'boolean',
        description: 'Whether the sender is a bot',
      },
    },
    // Chat information (message.chat) — use chat.id to reply
    chat: {
      id: {
        type: 'number',
        description: 'Chat ID to send replies to (use this as chatId in Telegram blocks)',
      },
      title: {
        type: 'string',
        description: 'Title of the chat (for groups and channels)',
      },
      username: {
        type: 'string',
        description: 'Chat username',
      },
      firstName: {
        type: 'string',
        description: 'First name (for private chats)',
      },
      lastName: {
        type: 'string',
        description: 'Last name (for private chats)',
      },
    },
    updateId: {
      type: 'number',
      description: 'Unique identifier for the Telegram update',
    },
    updateType: {
      type: 'string',
      description: 'Type of update (message, edited_message, channel_post, edited_channel_post)',
    },
  },

  instructions: [
    'Message "/newbot" to <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" class="text-primary underline transition-colors hover:text-primary/80">@BotFather</a> in Telegram to create a bot and copy its token.',
    'Enter your Bot Token above.',
    'Save settings and any message sent to your bot will trigger the workflow.',
  ],

  samplePayload: {
    update_id: 123456789,
    message: {
      message_id: 123,
      from: {
        id: 987654321,
        is_bot: false,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        language_code: 'en',
      },
      chat: {
        id: 987654321,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        type: 'private',
      },
      date: 1234567890,
      text: 'Hello from Telegram!',
      entities: [
        {
          offset: 0,
          length: 5,
          type: 'bold',
        },
      ],
    },
  },

  webhook: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
}
