import type { S3PutObjectParams, S3PutResponse } from '@/tools/s3/types'
import type { ToolConfig } from '@/tools/types'

/**
 * Uploads an object to S3.
 *
 * A direct-from-tool PUT is not viable: the tools runtime JSON.stringifies request
 * bodies (unless x-ndjson / form-urlencoded), which corrupts binary bytes and breaks
 * the SigV4 x-amz-content-sha256 hash. So this tool posts its params to an
 * unauthenticated internal route (`/api/tools/s3/put-object`) that performs the upload
 * with the AWS SDK. The user's AWS credentials are the auth boundary.
 */
export const s3PutObjectTool: ToolConfig<S3PutObjectParams, S3PutResponse> = {
  id: 's3_put_object',
  name: 'S3 Put Object',
  description: 'Upload an object to an AWS S3 bucket',
  version: '1.0.0',

  params: {
    accessKeyId: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your AWS Access Key ID',
    },
    secretAccessKey: {
      type: 'string',
      required: true,
      visibility: 'user-only',
      description: 'Your AWS Secret Access Key',
    },
    region: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      default: 'us-east-1',
      description: 'AWS region of the target bucket',
    },
    bucket: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Target S3 bucket name',
    },
    key: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Object key (path) within the bucket',
    },
    content: {
      type: 'string',
      required: true,
      visibility: 'user-or-llm',
      description: 'Content to upload as the object body',
    },
    contentType: {
      type: 'string',
      required: false,
      visibility: 'user-only',
      default: 'application/octet-stream',
      description: 'MIME type of the object (e.g. text/plain, application/json)',
    },
  },

  request: {
    url: '/api/tools/s3/put-object',
    method: 'POST',
    headers: () => ({ 'Content-Type': 'application/json' }),
    body: (params: S3PutObjectParams) => ({
      region: params.region || 'us-east-1',
      accessKeyId: params.accessKeyId,
      secretAccessKey: params.secretAccessKey,
      bucket: params.bucket,
      key: params.key,
      content: params.content,
      contentType: params.contentType || 'application/octet-stream',
    }),
  },

  transformResponse: async (response: Response): Promise<S3PutResponse> => {
    let data: any
    try {
      data = await response.json()
    } catch (error) {
      return {
        success: false,
        output: { location: '', bucket: '', key: '', etag: '' },
        error: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }

    if (!response.ok || !data?.success) {
      return {
        success: false,
        output: { location: '', bucket: '', key: '', etag: '' },
        error: data?.error || `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    return {
      success: true,
      output: data.output,
    }
  },

  outputs: {
    location: { type: 'string', description: 'Public URL of the uploaded object' },
    bucket: { type: 'string', description: 'Bucket the object was uploaded to' },
    key: { type: 'string', description: 'Key of the uploaded object' },
    etag: { type: 'string', description: 'ETag returned by S3 for the uploaded object' },
    versionId: {
      type: 'string',
      description: 'Version ID if bucket versioning is enabled',
      optional: true,
    },
  },
}
