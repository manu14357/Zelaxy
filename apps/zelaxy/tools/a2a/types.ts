import type { OutputProperty, ToolResponse } from '@/tools/types'

// Local type definitions (mirrors @a2a-js/sdk shapes)
export type TaskState =
  | 'working'
  | 'completed'
  | 'failed'
  | 'canceled'
  | 'rejected'
  | 'input_required'
  | 'auth_required'

export interface Artifact {
  id: string
  title?: string
  parts: Array<Record<string, unknown>>
  mediaType?: string
}

export interface Message {
  id?: string
  role: string
  parts: Array<Record<string, unknown>>
  timestamp: string
  referenceTaskIds?: string[]
}

/**
 * Shared output property constants for A2A tools.
 */
export const A2A_OUTPUT_PROPERTIES = {
  taskId: { type: 'string', description: 'Unique task identifier' },
  contextId: { type: 'string', description: 'Groups related tasks/messages', optional: true },
  state: {
    type: 'string',
    description:
      'Current lifecycle state (working, completed, failed, canceled, rejected, input_required, auth_required)',
  },
  status: {
    type: 'object',
    description: 'Current task status',
    properties: {
      state: { type: 'string', description: 'Lifecycle state' },
      timestamp: { type: 'string', description: 'ISO 8601 status update time' },
      progress: { type: 'number', description: 'Percentage completion (0-100)', optional: true },
      message: { type: 'string', description: 'Human-readable status description', optional: true },
    },
  },
  artifacts: {
    type: 'array',
    description: 'Task output artifacts',
    items: { type: 'object' },
    optional: true,
  },
  history: {
    type: 'array',
    description: 'Conversation history (Message array)',
    items: { type: 'object' },
    optional: true,
  },
  agentName: { type: 'string', description: 'Agent display name' },
  agentDescription: { type: 'string', description: 'Agent purpose/capabilities', optional: true },
  agentEndpoint: { type: 'string', description: 'Service endpoint URL' },
  agentProvider: {
    type: 'object',
    description: 'Creator organization details',
    properties: {
      name: { type: 'string', description: 'Organization name' },
      url: { type: 'string', description: 'Organization website', optional: true },
    },
    optional: true,
  },
  agentCapabilities: {
    type: 'object',
    description: 'Feature support matrix',
    properties: {
      streaming: { type: 'boolean', description: 'Supports real-time streaming', optional: true },
      pushNotifications: {
        type: 'boolean',
        description: 'Supports webhook callbacks',
        optional: true,
      },
      extendedAgentCard: {
        type: 'boolean',
        description: 'Provides authenticated extended card',
        optional: true,
      },
    },
  },
  agentSkills: {
    type: 'array',
    description: 'Available operations',
    items: { type: 'object' },
    optional: true,
  },
  version: { type: 'string', description: 'A2A protocol version supported by the agent' },
  defaultInputModes: {
    type: 'array',
    description: 'Default input content types accepted by the agent',
    items: { type: 'string' },
    optional: true,
  },
  defaultOutputModes: {
    type: 'array',
    description: 'Default output content types produced by the agent',
    items: { type: 'string' },
    optional: true,
  },
  webhookUrl: { type: 'string', description: 'HTTPS webhook URL for notifications' },
  webhookToken: {
    type: 'string',
    description: 'Authentication token for webhook validation',
    optional: true,
  },
  success: { type: 'boolean', description: 'Whether the operation was successful' },
  cancelled: { type: 'boolean', description: 'Whether cancellation was successful' },
  exists: { type: 'boolean', description: 'Whether the resource exists' },
  isRunning: { type: 'boolean', description: 'Whether the task is still running' },
  content: { type: 'string', description: 'Text response content from the agent' },
} as const satisfies Record<string, OutputProperty>

export interface A2AGetAgentCardParams {
  agentUrl: string
  apiKey?: string
}

export interface A2AGetAgentCardResponse extends ToolResponse {
  output: {
    name: string
    description?: string
    url: string
    version: string
    capabilities?: {
      streaming?: boolean
      pushNotifications?: boolean
      stateTransitionHistory?: boolean
    }
    skills?: Array<{ id: string; name: string; description?: string }>
    defaultInputModes?: string[]
    defaultOutputModes?: string[]
  }
}

interface A2ASendMessageFileInput {
  type: 'file' | 'url'
  data: string
  name: string
  mime?: string
}

export interface A2ASendMessageParams {
  agentUrl: string
  message: string
  taskId?: string
  contextId?: string
  data?: string
  files?: A2ASendMessageFileInput[]
  apiKey?: string
}

export interface A2ASendMessageResponse extends ToolResponse {
  output: {
    content: string
    taskId: string
    contextId?: string
    state: TaskState
    artifacts?: Artifact[]
    history?: Message[]
  }
}

export interface A2AGetTaskParams {
  agentUrl: string
  taskId: string
  apiKey?: string
  historyLength?: number
}

export interface A2AGetTaskResponse extends ToolResponse {
  output: {
    taskId: string
    contextId?: string
    state: TaskState
    artifacts?: Artifact[]
    history?: Message[]
  }
}

export interface A2ACancelTaskParams {
  agentUrl: string
  taskId: string
  apiKey?: string
}

export interface A2ACancelTaskResponse extends ToolResponse {
  output: {
    cancelled: boolean
    state: TaskState
  }
}

export interface A2AResubscribeParams {
  agentUrl: string
  taskId: string
  apiKey?: string
}

export interface A2AResubscribeResponse extends ToolResponse {
  output: {
    taskId: string
    contextId?: string
    state: TaskState
    isRunning: boolean
    artifacts?: Artifact[]
    history?: Message[]
  }
}

export interface A2ASetPushNotificationParams {
  agentUrl: string
  taskId: string
  webhookUrl: string
  token?: string
  apiKey?: string
}

export interface A2ASetPushNotificationResponse extends ToolResponse {
  output: {
    url: string
    token?: string
    success: boolean
  }
}
