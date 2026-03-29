export interface ChatMessage {
  id: string
  content: string | any
  workflowId: string
  type: 'user' | 'workflow'
  timestamp: string
  blockId?: string
  isStreaming?: boolean
  files?: { name: string; size: number; type: string }[]
}

export interface OutputConfig {
  blockId: string
  path: string
}

export interface ChatStore {
  messages: ChatMessage[]
  selectedWorkflowOutputs: Record<string, string[]>
  conversationIds: Record<string, string>
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'> & { id?: string }) => void
  clearChat: (workflowId: string | null) => void
  exportChatCSV: (workflowId: string) => void
  getWorkflowMessages: (workflowId: string) => ChatMessage[]
  setSelectedWorkflowOutput: (workflowId: string, outputIds: string[]) => void
  getSelectedWorkflowOutput: (workflowId: string) => string[]
  appendMessageContent: (messageId: string, content: string) => void
  finalizeMessageStream: (messageId: string) => void
  removeMessage: (messageId: string) => void
  getConversationId: (workflowId: string) => string
  generateNewConversationId: (workflowId: string) => string
}
