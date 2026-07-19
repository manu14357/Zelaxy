import type { ToolResponse } from '@/tools/types'

export interface S3Response extends ToolResponse {
  output: {
    url: string
    metadata: {
      fileType: string
      size: number
      name: string
      lastModified: string
      error?: string
    }
  }
}

export interface S3PutObjectParams {
  accessKeyId: string
  secretAccessKey: string
  region?: string
  bucket: string
  key: string
  content: string
  contentType?: string
}

export interface S3PutResponse extends ToolResponse {
  output: {
    location: string
    bucket: string
    key: string
    etag: string
    versionId?: string | null
  }
}
