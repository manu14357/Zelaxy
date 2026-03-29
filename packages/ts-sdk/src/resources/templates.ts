import { BaseClient } from '../base'
import type { Template } from '../types'

export class TemplatesResource extends BaseClient {
  async list(): Promise<Template[]> {
    const result = await this.get<Template[] | { data: Template[] }>('/api/templates')
    return Array.isArray(result) ? result : result.data
  }

  async get_(id: string): Promise<Template> {
    return this.get<Template>(`/api/templates/${id}`)
  }

  async use(id: string): Promise<any> {
    return this.post(`/api/templates/${id}/use`)
  }

  async star(id: string): Promise<void> {
    await this.post(`/api/templates/${id}/star`)
  }
}
