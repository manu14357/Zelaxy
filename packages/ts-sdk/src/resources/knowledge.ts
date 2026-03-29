import { BaseClient } from '../base'
import type { KnowledgeBase, KnowledgeDocument, KnowledgeSearchResult } from '../types'

export class KnowledgeResource extends BaseClient {
  async list(): Promise<KnowledgeBase[]> {
    const result = await this.get<KnowledgeBase[] | { data: KnowledgeBase[] }>('/api/knowledge')
    return Array.isArray(result) ? result : result.data
  }

  async get_(id: string): Promise<KnowledgeBase> {
    return this.get<KnowledgeBase>(`/api/knowledge/${id}`)
  }

  async create(params: { name: string; description?: string }): Promise<KnowledgeBase> {
    return this.post<KnowledgeBase>('/api/knowledge', params)
  }

  async update(
    id: string,
    params: { name?: string; description?: string }
  ): Promise<KnowledgeBase> {
    return this.patch<KnowledgeBase>(`/api/knowledge/${id}`, params)
  }

  async delete_(id: string): Promise<void> {
    await this.del(`/api/knowledge/${id}`)
  }

  async documents(knowledgeBaseId: string): Promise<KnowledgeDocument[]> {
    const result = await this.get<KnowledgeDocument[] | { data: KnowledgeDocument[] }>(
      `/api/knowledge/${knowledgeBaseId}/documents`
    )
    return Array.isArray(result) ? result : result.data
  }

  async uploadDocument(
    knowledgeBaseId: string,
    file: { name: string; content: Buffer; type: string }
  ): Promise<KnowledgeDocument> {
    // Use multipart form data for file upload
    const FormData = (await import('node-fetch')).FormData
    const { Blob } = await import('node-fetch')
    const form = new FormData()

    form.append('file', new Blob([new Uint8Array(file.content)], { type: file.type }), file.name)

    const response = await this.requestRaw(`/api/knowledge/${knowledgeBaseId}/documents`, {
      method: 'POST',
      body: form as any,
    })

    if (!response.ok) {
      const err = (await response.json().catch(() => ({}))) as any
      throw new Error(err.error || `Upload failed: ${response.status}`)
    }
    return (await response.json()) as KnowledgeDocument
  }

  async deleteDocument(knowledgeBaseId: string, documentId: string): Promise<void> {
    await this.del(`/api/knowledge/${knowledgeBaseId}/documents/${documentId}`)
  }

  async search(knowledgeBaseId: string, query: string): Promise<KnowledgeSearchResult[]> {
    return this.post<KnowledgeSearchResult[]>('/api/knowledge/search', {
      knowledgeBaseId,
      query,
    })
  }
}
