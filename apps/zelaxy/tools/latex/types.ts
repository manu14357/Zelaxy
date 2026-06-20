import type { ToolResponse } from '@/tools/types'

export interface LatexResource {
  path?: string
  main?: boolean
  content?: string
  file?: string
  url?: string
}

export interface CompileParams {
  content: string
  compiler?: string
  resources?: LatexResource[]
}

export interface SearchPackagesParams {
  query: string
}

export interface LatexCompileResponse extends ToolResponse {
  output: {
    data: { pdfBase64: string; dataUrl: string }
    metadata: { compiler: string; status: number }
  }
}

export interface LatexPackagesResponse extends ToolResponse {
  output: {
    data: Record<string, any>[]
    metadata: { count: number; status: number }
  }
}

export type LatexResponse = LatexCompileResponse | LatexPackagesResponse
