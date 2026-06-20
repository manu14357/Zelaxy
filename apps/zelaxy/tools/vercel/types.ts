import type { ToolResponse } from '@/tools/types'

export interface VercelBaseParams {
  apiKey: string
  teamId?: string
}

export interface VercelListProjectsParams extends VercelBaseParams {
  search?: string
  limit?: number
}

export interface VercelListDeploymentsParams extends VercelBaseParams {
  projectId?: string
  target?: string
  state?: string
  limit?: number
}

export interface VercelGetDeploymentParams extends VercelBaseParams {
  deploymentId: string
}

export interface VercelCreateDeploymentParams extends VercelBaseParams {
  name: string
  project?: string
  target?: string
  gitSource?: string
}

export interface VercelObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id?: string; name?: string }
  }
}

export interface VercelListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; hasMore: boolean }
  }
}

export type VercelResponse = VercelObjectResponse | VercelListResponse
