import type { ToolResponse } from '@/tools/types'

export interface ConvexBaseParams {
  deploymentUrl: string
  adminKey?: string
}

export interface ConvexRunQueryParams extends ConvexBaseParams {
  path: string
  args?: Record<string, any>
}

export interface ConvexRunMutationParams extends ConvexBaseParams {
  path: string
  args?: Record<string, any>
}

export interface ConvexResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { status?: string }
  }
}
