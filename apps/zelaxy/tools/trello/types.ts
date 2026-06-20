import type { ToolResponse } from '@/tools/types'

export interface TrelloBaseParams {
  apiKey: string
  token: string
}

export interface TrelloCreateCardParams extends TrelloBaseParams {
  idList: string
  name: string
  desc?: string
}

export interface TrelloListCardsParams extends TrelloBaseParams {
  boardId: string
}

export interface TrelloGetBoardParams extends TrelloBaseParams {
  boardId: string
}

export interface TrelloCreateBoardParams extends TrelloBaseParams {
  name: string
  desc?: string
}

export interface TrelloMoveCardParams extends TrelloBaseParams {
  cardId: string
  idList: string
}

export interface TrelloObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { id: string; url?: string }
  }
}

export interface TrelloListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type TrelloResponse = TrelloObjectResponse | TrelloListResponse
