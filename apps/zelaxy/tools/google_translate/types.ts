import type { ToolResponse } from '@/tools/types'

export interface GoogleTranslateBaseParams {
  apiKey: string
}

export interface TranslateParams extends GoogleTranslateBaseParams {
  q: string
  target: string
  source?: string
  format?: string
}

export interface DetectLanguageParams extends GoogleTranslateBaseParams {
  q: string
}

export interface ListLanguagesParams extends GoogleTranslateBaseParams {
  target?: string
}

export interface GoogleTranslateObjectResponse extends ToolResponse {
  output: {
    data: Record<string, any>
    metadata: { detectedSourceLanguage?: string; language?: string }
  }
}

export interface GoogleTranslateListResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number }
  }
}

export type GoogleTranslateResponse = GoogleTranslateObjectResponse | GoogleTranslateListResponse
