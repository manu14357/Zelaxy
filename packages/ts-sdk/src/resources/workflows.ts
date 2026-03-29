import { BaseClient } from '../base'
import type {
  ExecutionOptions,
  Workflow,
  WorkflowCreateParams,
  WorkflowExecutionResult,
  WorkflowLog,
  WorkflowStatus,
  WorkflowUpdateParams,
} from '../types'

export class WorkflowsResource extends BaseClient {
  async list(): Promise<Workflow[]> {
    const result = await this.get<Workflow[] | { data: Workflow[] }>('/api/workflows')
    return Array.isArray(result) ? result : result.data
  }

  async get_(id: string): Promise<Workflow> {
    return this.get<Workflow>(`/api/workflows/${id}`)
  }

  async create(params: WorkflowCreateParams): Promise<Workflow> {
    return this.post<Workflow>('/api/workflows', params)
  }

  async update(id: string, params: WorkflowUpdateParams): Promise<Workflow> {
    return this.patch<Workflow>(`/api/workflows/${id}`, params)
  }

  async delete_(id: string): Promise<void> {
    await this.del(`/api/workflows/${id}`)
  }

  async execute(id: string, options: ExecutionOptions = {}): Promise<WorkflowExecutionResult> {
    const { input, timeout = 30000 } = options

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const result = await this.post<WorkflowExecutionResult>(
        `/api/workflows/${id}/execute`,
        input || {}
      )
      return result
    } finally {
      clearTimeout(timer)
    }
  }

  async status(id: string): Promise<WorkflowStatus> {
    return this.get<WorkflowStatus>(`/api/workflows/${id}/status`)
  }

  async deploy(id: string): Promise<any> {
    return this.post(`/api/workflows/${id}/deploy`)
  }

  async duplicate(id: string): Promise<Workflow> {
    return this.post<Workflow>(`/api/workflows/${id}/duplicate`)
  }

  async logs(id: string): Promise<WorkflowLog[]> {
    const result = await this.get<WorkflowLog[] | { data: WorkflowLog[] }>(
      `/api/workflows/${id}/log`
    )
    return Array.isArray(result) ? result : result.data
  }

  async exportYaml(id: string): Promise<string> {
    const result = await this.get<{ yaml: string } | string>(`/api/workflows/${id}/yaml`)
    return typeof result === 'string' ? result : result.yaml
  }

  async importYaml(yamlContent: string): Promise<Workflow> {
    return this.post<Workflow>('/api/yaml/to-workflow', { yamlContent })
  }

  async stats(id: string): Promise<any> {
    return this.get(`/api/workflows/${id}/stats`)
  }

  async variables(id: string): Promise<any> {
    return this.get(`/api/workflows/${id}/variables`)
  }

  async setVariables(id: string, variables: Record<string, string>): Promise<any> {
    return this.post(`/api/workflows/${id}/variables`, variables)
  }
}
