import type { OutputProperty, ToolResponse } from '@/tools/types'

/**
 * Shared description of a Zep thread object, reused across the list/thread
 * returning tools so their `outputs` stay consistent.
 */
export const THREAD_OUTPUT_PROPERTIES: Record<string, OutputProperty> = {
  uuid: { type: 'string', description: 'Internal UUID of the thread' },
  thread_id: { type: 'string', description: 'Thread identifier' },
  user_id: { type: 'string', description: 'User the thread belongs to', optional: true },
  created_at: {
    type: 'string',
    description: 'ISO timestamp the thread was created',
    optional: true,
  },
  updated_at: {
    type: 'string',
    description: 'ISO timestamp the thread was last updated',
    optional: true,
  },
  metadata: {
    type: 'json',
    description: 'Arbitrary metadata attached to the thread',
    optional: true,
  },
}

export interface ZepMessage {
  role?: string
  role_type?: string
  content: string
  name?: string
  uuid?: string
  created_at?: string
  metadata?: Record<string, any>
}

export interface ZepThread {
  uuid?: string
  thread_id?: string
  user_id?: string
  created_at?: string
  updated_at?: string
  metadata?: Record<string, any>
}

export interface ZepUser {
  uuid?: string
  user_id?: string
  email?: string
  first_name?: string
  last_name?: string
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface ZepResponse extends ToolResponse {
  output: {
    // Common status flag returned by mutating operations
    success?: boolean
    // Messages
    messages?: ZepMessage[]
    // Context (get_context)
    context?: string
    // Threads (single + list)
    thread?: ZepThread
    threads?: ZepThread[]
    // Users
    user?: ZepUser
    // Pagination metadata
    total_count?: number
    row_count?: number
    // Passthrough for raw responses
    result?: any
  }
}
