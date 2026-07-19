import { ZepIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ZepResponse } from '@/tools/zep/types'

export const ZepBlock: BlockConfig<ZepResponse> = {
  type: 'zep',
  name: 'Zep',
  description: 'Long-term agent memory',
  longDescription:
    'Store and retrieve conversation memory with Zep. Create users and threads, add and read messages, list threads, and pull the synthesized memory context block that keeps AI agents grounded across executions.',
  bgColor: '#0E9F6E',
  icon: ZepIcon,
  category: 'tools',
  docsLink: '#',
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Add Messages', id: 'add_messages' },
        { label: 'Get Messages', id: 'get_messages' },
        { label: 'Get Context', id: 'get_context' },
        { label: 'Create Thread', id: 'create_thread' },
        { label: 'Delete Thread', id: 'delete_thread' },
        { label: 'Get Threads', id: 'get_threads' },
        { label: 'Add User', id: 'add_user' },
        { label: 'Get User', id: 'get_user' },
        { label: 'Get User Threads', id: 'get_user_threads' },
      ],
      placeholder: 'Select an operation',
      value: () => 'add_messages',
    },
    {
      id: 'threadId',
      title: 'Thread ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter thread identifier',
      condition: {
        field: 'operation',
        value: ['add_messages', 'get_messages', 'get_context', 'create_thread', 'delete_thread'],
      },
      required: true,
    },
    {
      id: 'userId',
      title: 'User ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter user identifier',
      condition: {
        field: 'operation',
        value: ['create_thread', 'add_user', 'get_user', 'get_user_threads'],
      },
      required: true,
    },
    {
      id: 'messages',
      title: 'Messages',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: 'JSON array, e.g. [{"role": "user", "content": "Hi, my name is Ada"}]',
      condition: {
        field: 'operation',
        value: 'add_messages',
      },
      required: true,
    },
    {
      id: 'email',
      title: 'Email',
      type: 'short-input',
      layout: 'full',
      placeholder: "User's email address",
      condition: {
        field: 'operation',
        value: 'add_user',
      },
    },
    {
      id: 'firstName',
      title: 'First Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'First name',
      condition: {
        field: 'operation',
        value: 'add_user',
      },
    },
    {
      id: 'lastName',
      title: 'Last Name',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Last name',
      condition: {
        field: 'operation',
        value: 'add_user',
      },
    },
    {
      id: 'metadata',
      title: 'Metadata',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: 'Optional JSON metadata, e.g. {"plan": "pro"}',
      condition: {
        field: 'operation',
        value: 'add_user',
      },
    },
    {
      id: 'limit',
      title: 'Message Limit',
      type: 'slider',
      layout: 'full',
      min: 1,
      max: 100,
      step: 1,
      integer: true,
      condition: {
        field: 'operation',
        value: 'get_messages',
      },
    },
    {
      id: 'minRating',
      title: 'Minimum Fact Rating',
      type: 'slider',
      layout: 'full',
      min: 0,
      max: 1,
      step: 0.1,
      condition: {
        field: 'operation',
        value: 'get_context',
      },
    },
    {
      id: 'pageNumber',
      title: 'Page Number',
      type: 'short-input',
      layout: 'half',
      placeholder: '1',
      condition: {
        field: 'operation',
        value: 'get_threads',
      },
    },
    {
      id: 'pageSize',
      title: 'Page Size',
      type: 'short-input',
      layout: 'half',
      placeholder: '20',
      condition: {
        field: 'operation',
        value: 'get_threads',
      },
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your Zep API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: [
      'zep_add_messages',
      'zep_get_messages',
      'zep_get_context',
      'zep_create_thread',
      'zep_delete_thread',
      'zep_get_threads',
      'zep_add_user',
      'zep_get_user',
      'zep_get_user_threads',
    ],
    config: {
      tool: (params: Record<string, any>) => {
        const operation = params.operation || 'add_messages'
        switch (operation) {
          case 'add_messages':
            return 'zep_add_messages'
          case 'get_messages':
            return 'zep_get_messages'
          case 'get_context':
            return 'zep_get_context'
          case 'create_thread':
            return 'zep_create_thread'
          case 'delete_thread':
            return 'zep_delete_thread'
          case 'get_threads':
            return 'zep_get_threads'
          case 'add_user':
            return 'zep_add_user'
          case 'get_user':
            return 'zep_get_user'
          case 'get_user_threads':
            return 'zep_get_user_threads'
          default:
            return 'zep_add_messages'
        }
      },
      params: (params: Record<string, any>) => {
        const operation = params.operation || 'add_messages'
        const errors: string[] = []

        if (!params.apiKey) {
          errors.push('API Key is required')
        }

        const needsThread = [
          'add_messages',
          'get_messages',
          'get_context',
          'create_thread',
          'delete_thread',
        ].includes(operation)
        if (needsThread && !params.threadId) {
          errors.push('Thread ID is required')
        }

        const needsUser = ['create_thread', 'add_user', 'get_user', 'get_user_threads'].includes(
          operation
        )
        if (needsUser && !params.userId) {
          errors.push('User ID is required')
        }

        if (operation === 'add_messages') {
          if (!params.messages) {
            errors.push('Messages are required')
          } else {
            try {
              const arr =
                typeof params.messages === 'string' ? JSON.parse(params.messages) : params.messages
              if (!Array.isArray(arr) || arr.length === 0) {
                errors.push('Messages must be a non-empty array')
              }
            } catch (_e) {
              errors.push('Messages must be valid JSON')
            }
          }
        }

        if (errors.length > 0) {
          throw new Error(`Zep Block Error: ${errors.join(', ')}`)
        }

        const result: Record<string, any> = { apiKey: params.apiKey }

        if (params.threadId) result.threadId = params.threadId
        if (params.userId) result.userId = params.userId

        switch (operation) {
          case 'add_messages':
            result.messages =
              typeof params.messages === 'string' ? JSON.parse(params.messages) : params.messages
            break
          case 'get_messages':
            if (params.limit) result.limit = Number(params.limit)
            break
          case 'get_context':
            if (params.minRating !== undefined && params.minRating !== '') {
              result.minRating = Number(params.minRating)
            }
            break
          case 'get_threads':
            if (params.pageNumber) result.pageNumber = Number(params.pageNumber)
            if (params.pageSize) result.pageSize = Number(params.pageSize)
            break
          case 'add_user':
            if (params.email) result.email = params.email
            if (params.firstName) result.firstName = params.firstName
            if (params.lastName) result.lastName = params.lastName
            if (params.metadata) {
              result.metadata =
                typeof params.metadata === 'string' ? JSON.parse(params.metadata) : params.metadata
            }
            break
        }

        return result
      },
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'Zep API key' },
    threadId: { type: 'string', description: 'Thread identifier' },
    userId: { type: 'string', description: 'User identifier' },
    messages: { type: 'json', description: 'Array of message objects' },
    email: { type: 'string', description: 'User email address' },
    firstName: { type: 'string', description: 'User first name' },
    lastName: { type: 'string', description: 'User last name' },
    metadata: { type: 'json', description: 'User metadata' },
    limit: { type: 'number', description: 'Maximum messages to return' },
    minRating: { type: 'number', description: 'Minimum fact rating for context' },
    pageNumber: { type: 'number', description: 'Page number for thread listing' },
    pageSize: { type: 'number', description: 'Page size for thread listing' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the operation succeeded' },
    messages: { type: 'json', description: 'Messages data' },
    context: { type: 'string', description: 'Synthesized memory context block' },
    thread: { type: 'json', description: 'Thread object' },
    threads: { type: 'json', description: 'List of threads' },
    user: { type: 'json', description: 'User object' },
    total_count: { type: 'number', description: 'Total count for list operations' },
    row_count: { type: 'number', description: 'Number of rows returned' },
    result: { type: 'json', description: 'Raw API response' },
  },
}
