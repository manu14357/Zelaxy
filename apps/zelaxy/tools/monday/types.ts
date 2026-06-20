import type { ToolResponse } from '@/tools/types'

export interface MondayBaseParams {
  apiKey: string
}

export interface MondayListBoardsParams extends MondayBaseParams {
  limit?: number
}

export interface MondayGetBoardItemsParams extends MondayBaseParams {
  boardId: string
  limit?: number
}

export interface MondayCreateItemParams extends MondayBaseParams {
  boardId: string
  itemName: string
}

export interface MondayUpdateItemParams extends MondayBaseParams {
  itemId: string
  columnId: string
  value: string
}

export interface MondayResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: Record<string, any>
  }
}
