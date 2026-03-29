import { createLogger } from '@/lib/logs/console/logger'
import type { CustomBlobConfig } from '@/lib/uploads/blob/blob-client'
import type { CustomS3Config } from '@/lib/uploads/s3/s3-client'
import { USE_BLOB_STORAGE, USE_S3_STORAGE } from '@/lib/uploads/setup'

const logger = createLogger('StorageClient')

// Client-safe type definitions
export type FileInfo = {
  path: string
  key: string
  name: string
  size: number
  type: string
}

export type CustomStorageConfig = {
  // S3 config
  bucket?: string
  region?: string
  // Blob config
  containerName?: string
  accountName?: string
  accountKey?: string
  connectionString?: string
}

/**
 * Upload a file to the configured storage provider
 * @param file Buffer containing file data
 * @param fileName Original file name
 * @param contentType MIME type of the file
 * @param size File size in bytes (optional, will use buffer length if not provided)
 * @returns Object with file information
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string,
  size?: number
): Promise<FileInfo>

/**
 * Upload a file to the configured storage provider with custom configuration
 * @param file Buffer containing file data
 * @param fileName Original file name
 * @param contentType MIME type of the file
 * @param customConfig Custom storage configuration
 * @param size File size in bytes (optional, will use buffer length if not provided)
 * @returns Object with file information
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string,
  customConfig: CustomStorageConfig,
  size?: number
): Promise<FileInfo>

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string,
  configOrSize?: CustomStorageConfig | number,
  size?: number
): Promise<FileInfo> {
  if (USE_BLOB_STORAGE) {
    logger.info(`Uploading file to Azure Blob Storage: ${fileName}`)
    const { uploadToBlob } = await import('@/lib/uploads/blob/blob-client')
    if (typeof configOrSize === 'object') {
      const blobConfig: CustomBlobConfig = {
        containerName: configOrSize.containerName!,
        accountName: configOrSize.accountName!,
        accountKey: configOrSize.accountKey,
        connectionString: configOrSize.connectionString,
      }
      return uploadToBlob(file, fileName, contentType, blobConfig, size)
    }
    return uploadToBlob(file, fileName, contentType, configOrSize)
  }

  if (USE_S3_STORAGE) {
    logger.info(`Uploading file to S3: ${fileName}`)
    const { uploadToS3 } = await import('@/lib/uploads/s3/s3-client')
    if (typeof configOrSize === 'object') {
      const s3Config: CustomS3Config = {
        bucket: configOrSize.bucket!,
        region: configOrSize.region!,
      }
      return uploadToS3(file, fileName, contentType, s3Config, size)
    }
    return uploadToS3(file, fileName, contentType, configOrSize)
  }

  // Fallback to local storage when no cloud storage is configured
  logger.info(`Uploading file to local storage: ${fileName}`)
  const { uploadToLocal } = await import('@/lib/uploads/local/local-client')
  const actualSize = typeof configOrSize === 'number' ? configOrSize : size
  return uploadToLocal(file, fileName, contentType, actualSize)
}

/**
 * Download a file from the configured storage provider
 * @param key File key/name
 * @returns File buffer
 */
export async function downloadFile(key: string): Promise<Buffer> {
  if (USE_BLOB_STORAGE) {
    logger.info(`Downloading file from Azure Blob Storage: ${key}`)
    const { downloadFromBlob } = await import('@/lib/uploads/blob/blob-client')
    return downloadFromBlob(key)
  }

  if (USE_S3_STORAGE) {
    logger.info(`Downloading file from S3: ${key}`)
    const { downloadFromS3 } = await import('@/lib/uploads/s3/s3-client')
    return downloadFromS3(key)
  }

  // Fallback to local storage when no cloud storage is configured
  logger.info(`Downloading file from local storage: ${key}`)
  const { downloadFromLocal } = await import('@/lib/uploads/local/local-client')
  return downloadFromLocal(key)
}

/**
 * Delete a file from the configured storage provider
 * @param key File key/name
 */
export async function deleteFile(key: string): Promise<void> {
  if (USE_BLOB_STORAGE) {
    logger.info(`Deleting file from Azure Blob Storage: ${key}`)
    const { deleteFromBlob } = await import('@/lib/uploads/blob/blob-client')
    return deleteFromBlob(key)
  }

  if (USE_S3_STORAGE) {
    logger.info(`Deleting file from S3: ${key}`)
    const { deleteFromS3 } = await import('@/lib/uploads/s3/s3-client')
    return deleteFromS3(key)
  }

  // Fallback to local storage when no cloud storage is configured
  logger.info(`Deleting file from local storage: ${key}`)
  const { deleteFromLocal } = await import('@/lib/uploads/local/local-client')
  return deleteFromLocal(key)
}

/**
 * Generate a presigned URL for direct file access
 * @param key File key/name
 * @param expiresIn Time in seconds until URL expires
 * @returns Presigned URL
 */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  if (USE_BLOB_STORAGE) {
    logger.info(`Generating presigned URL for Azure Blob Storage: ${key}`)
    const { getPresignedUrl: getBlobPresignedUrl } = await import('@/lib/uploads/blob/blob-client')
    return getBlobPresignedUrl(key, expiresIn)
  }

  if (USE_S3_STORAGE) {
    logger.info(`Generating presigned URL for S3: ${key}`)
    const { getPresignedUrl: getS3PresignedUrl } = await import('@/lib/uploads/s3/s3-client')
    return getS3PresignedUrl(key, expiresIn)
  }

  // For local storage, return the serve path since there's no presigned URL concept
  logger.info(`Generating serve URL for local storage: ${key}`)
  return `/api/files/serve/${key}`
}

/**
 * Generate a presigned URL for direct file access with custom configuration
 * @param key File key/name
 * @param customConfig Custom storage configuration
 * @param expiresIn Time in seconds until URL expires
 * @returns Presigned URL
 */
export async function getPresignedUrlWithConfig(
  key: string,
  customConfig: CustomStorageConfig,
  expiresIn = 3600
): Promise<string> {
  if (USE_BLOB_STORAGE) {
    logger.info(`Generating presigned URL for Azure Blob Storage with custom config: ${key}`)
    const { getPresignedUrlWithConfig: getBlobPresignedUrlWithConfig } = await import(
      '@/lib/uploads/blob/blob-client'
    )
    // Convert CustomStorageConfig to CustomBlobConfig
    const blobConfig: CustomBlobConfig = {
      containerName: customConfig.containerName!,
      accountName: customConfig.accountName!,
      accountKey: customConfig.accountKey,
      connectionString: customConfig.connectionString,
    }
    return getBlobPresignedUrlWithConfig(key, blobConfig, expiresIn)
  }

  if (USE_S3_STORAGE) {
    logger.info(`Generating presigned URL for S3 with custom config: ${key}`)
    const { getPresignedUrlWithConfig: getS3PresignedUrlWithConfig } = await import(
      '@/lib/uploads/s3/s3-client'
    )
    // Convert CustomStorageConfig to CustomS3Config
    const s3Config: CustomS3Config = {
      bucket: customConfig.bucket!,
      region: customConfig.region!,
    }
    return getS3PresignedUrlWithConfig(key, s3Config, expiresIn)
  }

  // For local storage, return the serve path since there's no presigned URL concept
  logger.info(`Generating serve URL for local storage with custom config: ${key}`)
  return `/api/files/serve/${key}`
}

/**
 * Get the current storage provider name
 */
export function getStorageProvider(): 'blob' | 's3' | 'local' {
  if (USE_BLOB_STORAGE) return 'blob'
  if (USE_S3_STORAGE) return 's3'
  return 'local'
}

/**
 * Check if we're using cloud storage (either S3 or Blob)
 */
export function isUsingCloudStorage(): boolean {
  return USE_BLOB_STORAGE || USE_S3_STORAGE
}

/**
 * Get the appropriate serve path prefix based on storage provider
 */
export function getServePathPrefix(): string {
  if (USE_BLOB_STORAGE) return '/api/files/serve/blob/'
  if (USE_S3_STORAGE) return '/api/files/serve/s3/'
  return '/api/files/serve/'
}
