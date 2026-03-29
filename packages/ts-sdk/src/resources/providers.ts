import { BaseClient } from '../base'
import type { Provider, ProviderModel } from '../types'

export class ProvidersResource extends BaseClient {
  async list(): Promise<Provider[]> {
    const result = await this.get<Provider[] | { data: Provider[] }>('/api/providers')
    return Array.isArray(result) ? result : result.data
  }

  async models(): Promise<ProviderModel[]> {
    const result = await this.get<ProviderModel[] | { data: ProviderModel[] }>(
      '/api/providers/models'
    )
    return Array.isArray(result) ? result : result.data
  }
}
