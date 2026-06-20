import type { ToolResponse } from '@/tools/types'

export interface GreenhouseBaseParams {
  apiKey: string
}

export interface ListCandidatesParams extends GreenhouseBaseParams {
  per_page?: number
  page?: number
  job_id?: string
  email?: string
}

export interface GetCandidateParams extends GreenhouseBaseParams {
  id: string
}

export interface ListJobsParams extends GreenhouseBaseParams {
  per_page?: number
  page?: number
  status?: string
}

export interface ListApplicationsParams extends GreenhouseBaseParams {
  per_page?: number
  page?: number
  job_id?: string
  status?: string
}

export interface GreenhouseObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface GreenhouseListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type GreenhouseResponse = GreenhouseObjectResponse | GreenhouseListResponse
