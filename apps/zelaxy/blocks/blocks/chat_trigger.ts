import { MessagesIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

export const ChatTriggerBlock: BlockConfig = {
  type: 'chat_trigger',
  name: 'Chat',
  description: 'Trigger workflows from chat messages',
  longDescription:
    'Start workflows from chat messages. Receive user input, conversation ID, and file attachments through the chat interface.',
  docsLink: '#',
  category: 'triggers',
  bgColor: '#6F3DFA',
  icon: MessagesIcon,
  subBlocks: [],
  tools: {
    access: [],
  },
  inputs: {},
  outputs: {
    input: { type: 'string', description: 'User chat message' },
    conversationId: { type: 'string', description: 'Conversation ID' },
    files: { type: 'json', description: 'Attached files' },
  },
  triggers: {
    enabled: true,
    available: ['chat'],
  },
}
