import type { ToolResponse } from '@/tools/types'

export interface TextractBaseParams {
  awsRegion: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
}

export interface TextractDetectDocumentTextParams extends TextractBaseParams {
  s3Bucket: string
  s3Name: string
}

export interface TextractAnalyzeDocumentParams extends TextractBaseParams {
  s3Bucket: string
  s3Name: string
  featureTypes?: string[]
}

export interface TextractResponse extends ToolResponse {
  output: {
    data: Record<string, any>
  }
}
