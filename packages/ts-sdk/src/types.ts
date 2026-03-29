// ─── Common ────────────────────────────────────────────────────────────────

export interface ZelaxyConfig {
  apiKey: string
  baseUrl?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total?: number
  page?: number
  limit?: number
}

// ─── Errors ────────────────────────────────────────────────────────────────

export class ZelaxyError extends Error {
  public code?: string
  public status?: number

  constructor(message: string, code?: string, status?: number) {
    super(message)
    this.name = 'ZelaxyError'
    this.code = code
    this.status = status
  }
}

// ─── Auth / Users ──────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string | null
  email: string
  image?: string | null
  createdAt?: string
  role?: string
}

export interface ApiKey {
  id: string
  name: string
  key?: string
  createdAt: string
  lastUsedAt?: string | null
}

export interface OAuthConnection {
  id: string
  provider: string
  email?: string
  createdAt: string
}

// ─── Workflows ─────────────────────────────────────────────────────────────

export interface Workflow {
  id: string
  name: string
  description?: string | null
  state?: any
  createdAt: string
  updatedAt: string
  folderId?: string | null
  isDeployed?: boolean
  deployedAt?: string | null
  color?: string | null
  lastSyncedAt?: string | null
}

export interface WorkflowExecutionResult {
  success: boolean
  output?: any
  error?: string
  logs?: any[]
  metadata?: {
    duration?: number
    executionId?: string
    [key: string]: any
  }
  traceSpans?: any[]
  totalDuration?: number
}

export interface WorkflowStatus {
  isDeployed: boolean
  deployedAt?: string
  isPublished: boolean
  needsRedeployment: boolean
}

export interface ExecutionOptions {
  input?: any
  timeout?: number
}

export interface WorkflowCreateParams {
  name: string
  description?: string
}

export interface WorkflowUpdateParams {
  name?: string
  description?: string
  state?: any
  color?: string
  folderId?: string | null
}

export interface WorkflowLog {
  id: string
  workflowId: string
  status: string
  duration?: number
  createdAt: string
  output?: any
  error?: string | null
}

// ─── Templates ─────────────────────────────────────────────────────────────

export interface Template {
  id: string
  name: string
  description?: string
  category?: string
  state?: any
  createdAt: string
  stars?: number
}

// ─── Knowledge Base ────────────────────────────────────────────────────────

export interface KnowledgeBase {
  id: string
  name: string
  description?: string | null
  documentCount?: number
  createdAt: string
  updatedAt: string
}

export interface KnowledgeDocument {
  id: string
  knowledgeBaseId: string
  name: string
  type: string
  size?: number
  chunkCount?: number
  status?: string
  createdAt: string
}

export interface KnowledgeSearchResult {
  content: string
  similarity: number
  documentId: string
  documentName: string
  chunkId?: string
}

// ─── Tools ─────────────────────────────────────────────────────────────────

export interface Tool {
  id: string
  name: string
  description?: string
  category?: string
  type?: string
}

export interface CustomTool {
  id: string
  name: string
  description?: string
  schema?: any
  code?: string
  createdAt: string
}

export interface McpServer {
  id: string
  name: string
  url: string
  status?: string
  toolCount?: number
  createdAt: string
}

export interface McpTool {
  name: string
  description?: string
  inputSchema?: any
}

// ─── Organizations & Workspaces ────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  slug?: string
  logo?: string | null
  createdAt: string
  memberCount?: number
}

export interface OrganizationMember {
  id: string
  userId: string
  role: string
  user?: {
    name: string | null
    email: string
    image?: string | null
  }
  joinedAt: string
}

export interface Workspace {
  id: string
  name: string
  organizationId?: string
  createdAt: string
}

// ─── Webhooks ──────────────────────────────────────────────────────────────

export interface Webhook {
  id: string
  workflowId: string
  path: string
  isActive: boolean
  createdAt: string
  lastTriggeredAt?: string | null
  provider?: string
}

export interface WebhookCreateParams {
  workflowId: string
  path?: string
  provider?: string
}

// ─── Schedules ─────────────────────────────────────────────────────────────

export interface Schedule {
  id: string
  workflowId: string
  cronExpression: string
  isActive: boolean
  nextRunAt?: string | null
  lastRunAt?: string | null
  createdAt: string
}

export interface ScheduleCreateParams {
  workflowId: string
  cronExpression: string
}

// ─── Chat ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatOptions {
  model?: string
  mode?: 'ask' | 'agent'
  workflowId?: string
  history?: ChatMessage[]
  stream?: boolean
}

export interface ChatResponse {
  content: string
  model?: string
  citations?: Array<{ title: string; url: string }>
  toolCalls?: Array<{ name: string; status: string; result?: any }>
}

// ─── Files ─────────────────────────────────────────────────────────────────

export interface UploadedFile {
  id: string
  name: string
  url: string
  size: number
  type: string
  createdAt: string
}

// ─── Folders ───────────────────────────────────────────────────────────────

export interface Folder {
  id: string
  name: string
  parentId?: string | null
  createdAt: string
}

// ─── Providers ─────────────────────────────────────────────────────────────

export interface Provider {
  id: string
  name: string
  models: ProviderModel[]
}

export interface ProviderModel {
  id: string
  name: string
  provider: string
  contextLength?: number
}
