import type { ToolResponse } from '@/tools/types'

export interface ShopifyBaseParams {
  apiKey: string
  storeDomain: string
}

export interface ListProductsParams extends ShopifyBaseParams {
  limit?: number
}

export interface CreateProductParams extends ShopifyBaseParams {
  title: string
  body_html?: string
}

export interface ListOrdersParams extends ShopifyBaseParams {
  limit?: number
  status?: string
}

export interface GetOrderParams extends ShopifyBaseParams {
  orderId: string
}

export interface ShopifyObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string }
  }
}

export interface ShopifyListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type ShopifyResponse = ShopifyObjectResponse | ShopifyListResponse
