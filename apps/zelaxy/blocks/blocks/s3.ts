import { S3Icon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { S3Response } from '@/tools/s3/types'

export const S3Block: BlockConfig<S3Response> = {
  type: 's3',
  name: 'S3',
  description: 'View and upload S3 files',
  longDescription:
    'Retrieve files from Amazon S3 buckets using presigned URLs, or upload objects to a bucket.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#E0E0E0',
  icon: S3Icon,
  subBlocks: [
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Get Object', id: 'get_object' },
        { label: 'Put Object', id: 'put_object' },
      ],
      value: () => 'get_object',
    },
    {
      id: 'accessKeyId',
      title: 'Access Key ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your AWS Access Key ID',
      password: true,
      required: true,
    },
    {
      id: 'secretAccessKey',
      title: 'Secret Access Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter your AWS Secret Access Key',
      password: true,
      required: true,
    },
    {
      id: 's3Uri',
      title: 'S3 Object URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'e.g., https://bucket-name.s3.region.amazonaws.com/path/to/file',
      required: true,
      condition: { field: 'operation', value: 'get_object' },
    },
    {
      id: 'region',
      title: 'Region',
      type: 'short-input',
      layout: 'full',
      placeholder: 'e.g., us-east-1',
      condition: { field: 'operation', value: 'put_object' },
    },
    {
      id: 'bucket',
      title: 'Bucket',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Target S3 bucket name',
      required: true,
      condition: { field: 'operation', value: 'put_object' },
    },
    {
      id: 'key',
      title: 'Object Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'e.g., folder/file.txt',
      required: true,
      condition: { field: 'operation', value: 'put_object' },
    },
    {
      id: 'content',
      title: 'Content',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Content to upload as the object body',
      required: true,
      condition: { field: 'operation', value: 'put_object' },
    },
    {
      id: 'contentType',
      title: 'Content Type',
      type: 'short-input',
      layout: 'full',
      placeholder: 'e.g., text/plain (defaults to application/octet-stream)',
      condition: { field: 'operation', value: 'put_object' },
    },
  ],
  tools: {
    access: ['s3_get_object', 's3_put_object'],
    config: {
      tool: (params) => (params.operation === 'put_object' ? 's3_put_object' : 's3_get_object'),
      params: (params) => {
        // Validate shared required fields
        if (!params.accessKeyId) {
          throw new Error('Access Key ID is required')
        }
        if (!params.secretAccessKey) {
          throw new Error('Secret Access Key is required')
        }

        if (params.operation === 'put_object') {
          if (!params.bucket) {
            throw new Error('Bucket is required')
          }
          if (!params.key) {
            throw new Error('Object Key is required')
          }
          if (params.content === undefined || params.content === null || params.content === '') {
            throw new Error('Content is required')
          }

          return {
            accessKeyId: params.accessKeyId,
            secretAccessKey: params.secretAccessKey,
            region: params.region || 'us-east-1',
            bucket: params.bucket,
            key: params.key,
            content: params.content,
            contentType: params.contentType || 'application/octet-stream',
          }
        }

        // get_object (default)
        if (!params.s3Uri) {
          throw new Error('S3 Object URL is required')
        }

        // Parse S3 URI
        try {
          const url = new URL(params.s3Uri)
          const hostname = url.hostname

          // Extract bucket name from hostname
          const bucketName = hostname.split('.')[0]

          // Extract region from hostname
          const regionMatch = hostname.match(/s3[.-]([^.]+)\.amazonaws\.com/)
          const region = regionMatch ? regionMatch[1] : 'us-east-1'

          // Extract object key from pathname (remove leading slash)
          const objectKey = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname

          if (!bucketName) {
            throw new Error('Could not extract bucket name from URL')
          }

          if (!objectKey) {
            throw new Error('No object key found in URL')
          }

          return {
            accessKeyId: params.accessKeyId,
            secretAccessKey: params.secretAccessKey,
            region,
            bucketName,
            objectKey,
          }
        } catch (_error) {
          throw new Error(
            'Invalid S3 Object URL format. Expected format: https://bucket-name.s3.region.amazonaws.com/path/to/file'
          )
        }
      },
    },
  },
  inputs: {
    operation: { type: 'string', description: 'Operation to perform (get_object or put_object)' },
    accessKeyId: { type: 'string', description: 'AWS access key ID' },
    secretAccessKey: { type: 'string', description: 'AWS secret access key' },
    s3Uri: { type: 'string', description: 'S3 object URL (get_object)' },
    region: { type: 'string', description: 'AWS region (put_object)' },
    bucket: { type: 'string', description: 'Target bucket name (put_object)' },
    key: { type: 'string', description: 'Object key (put_object)' },
    content: { type: 'string', description: 'Object content to upload (put_object)' },
    contentType: { type: 'string', description: 'MIME type of the object (put_object)' },
  },
  outputs: {
    url: { type: 'string', description: 'Presigned URL (get_object)' },
    metadata: { type: 'json', description: 'Object metadata (get_object)' },
    location: { type: 'string', description: 'URL of the uploaded object (put_object)' },
    bucket: { type: 'string', description: 'Bucket the object was uploaded to (put_object)' },
    key: { type: 'string', description: 'Key of the uploaded object (put_object)' },
    etag: { type: 'string', description: 'ETag of the uploaded object (put_object)' },
    versionId: { type: 'string', description: 'Version ID if versioning is enabled (put_object)' },
  },
}
