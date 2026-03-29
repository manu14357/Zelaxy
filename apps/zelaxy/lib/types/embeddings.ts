export interface EmbeddingModel {
  id: string
  provider: string
  name: string
  dimensions: number
  available: boolean
  description: string
  requiresApiKey?: boolean
}

export interface CloudProvider {
  id: string
  name: string
  description: string
  apiKeyRequired: boolean
  models: Omit<EmbeddingModel, 'available'>[]
}

export interface EmbeddingDetectionResponse {
  success: boolean
  data: {
    detectedModels: EmbeddingModel[]
    cloudProviders: CloudProvider[]
    recommendations?: {
      local?: EmbeddingModel
      cloud?: EmbeddingModel
    }
  }
  error?: string
}

export interface ApiKeyTestRequest {
  apiKeys: {
    openai?: string
    anthropic?: string
    cohere?: string
    [key: string]: string | undefined
  }
}

export interface ProcessingOptions {
  chunkSize?: number
  chunkOverlap?: number
  embeddingModel: {
    id: string
    provider: string
    name: string
    dimensions: number
    apiKey?: string // For user-provided API keys
  }
}
