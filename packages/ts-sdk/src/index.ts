// ─── Re-export all types ───────────────────────────────────────────────────

export type { ClientConfig } from './base'
// ─── Re-export base client ─────────────────────────────────────────────────
export { BaseClient } from './base'
export { AuthResource } from './resources/auth'
export { ChatResource } from './resources/chat'
export { FilesResource } from './resources/files'
export { KnowledgeResource } from './resources/knowledge'
export { OrganizationsResource } from './resources/organizations'
export { ProvidersResource } from './resources/providers'
export { SchedulesResource } from './resources/schedules'
export { TemplatesResource } from './resources/templates'
export { ToolsResource } from './resources/tools'
export { WebhooksResource } from './resources/webhooks'
// ─── Re-export resource classes ────────────────────────────────────────────
export { WorkflowsResource } from './resources/workflows'
export * from './types'

import { AuthResource } from './resources/auth'
import { ChatResource } from './resources/chat'
import { FilesResource } from './resources/files'
import { KnowledgeResource } from './resources/knowledge'
import { OrganizationsResource } from './resources/organizations'
import { ProvidersResource } from './resources/providers'
import { SchedulesResource } from './resources/schedules'
import { TemplatesResource } from './resources/templates'
import { ToolsResource } from './resources/tools'
import { WebhooksResource } from './resources/webhooks'
import { WorkflowsResource } from './resources/workflows'
// ─── Import for composition ────────────────────────────────────────────────
import type {
  ExecutionOptions,
  WorkflowExecutionResult,
  WorkflowStatus,
  ZelaxyConfig,
} from './types'

export class ZelaxyClient {
  public readonly workflows: WorkflowsResource
  public readonly auth: AuthResource
  public readonly knowledge: KnowledgeResource
  public readonly tools: ToolsResource
  public readonly organizations: OrganizationsResource
  public readonly webhooks: WebhooksResource
  public readonly schedules: SchedulesResource
  public readonly chat: ChatResource
  public readonly templates: TemplatesResource
  public readonly files: FilesResource
  public readonly providers: ProvidersResource

  private _apiKey: string
  private _baseUrl: string

  constructor(config: ZelaxyConfig) {
    this._apiKey = config.apiKey
    this._baseUrl = (config.baseUrl || 'http://localhost:3000').replace(/\/+$/, '')

    const clientConfig = { apiKey: this._apiKey, baseUrl: this._baseUrl }
    this.workflows = new WorkflowsResource(clientConfig)
    this.auth = new AuthResource(clientConfig)
    this.knowledge = new KnowledgeResource(clientConfig)
    this.tools = new ToolsResource(clientConfig)
    this.organizations = new OrganizationsResource(clientConfig)
    this.webhooks = new WebhooksResource(clientConfig)
    this.schedules = new SchedulesResource(clientConfig)
    this.chat = new ChatResource(clientConfig)
    this.templates = new TemplatesResource(clientConfig)
    this.files = new FilesResource(clientConfig)
    this.providers = new ProvidersResource(clientConfig)
  }

  // ── Backward-compatible convenience methods ────────────────────────────

  async executeWorkflow(
    workflowId: string,
    options: ExecutionOptions = {}
  ): Promise<WorkflowExecutionResult> {
    return this.workflows.execute(workflowId, options)
  }

  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus> {
    return this.workflows.status(workflowId)
  }

  async validateWorkflow(workflowId: string): Promise<boolean> {
    try {
      const status = await this.workflows.status(workflowId)
      return status.isDeployed
    } catch {
      return false
    }
  }

  setApiKey(apiKey: string): void {
    this._apiKey = apiKey
    const clientConfig = { apiKey: this._apiKey, baseUrl: this._baseUrl }
    this._rebuildResources(clientConfig)
  }

  setBaseUrl(baseUrl: string): void {
    this._baseUrl = baseUrl.replace(/\/+$/, '')
    const clientConfig = { apiKey: this._apiKey, baseUrl: this._baseUrl }
    this._rebuildResources(clientConfig)
  }

  private _rebuildResources(config: { apiKey: string; baseUrl: string }): void {
    ;(this as any).workflows = new WorkflowsResource(config)
    ;(this as any).auth = new AuthResource(config)
    ;(this as any).knowledge = new KnowledgeResource(config)
    ;(this as any).tools = new ToolsResource(config)
    ;(this as any).organizations = new OrganizationsResource(config)
    ;(this as any).webhooks = new WebhooksResource(config)
    ;(this as any).schedules = new SchedulesResource(config)
    ;(this as any).chat = new ChatResource(config)
    ;(this as any).templates = new TemplatesResource(config)
    ;(this as any).files = new FilesResource(config)
    ;(this as any).providers = new ProvidersResource(config)
  }
}

export { ZelaxyClient as default }
