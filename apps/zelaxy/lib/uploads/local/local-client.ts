import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '@/lib/logs/console/logger'
import { UPLOAD_DIR_SERVER } from '@/lib/uploads/setup.server'
import type { FileInfo } from '@/lib/uploads/storage-client'

const logger = createLogger('LocalStorageClient')

/**
 * Upload a file to local storage
 * @param file Buffer containing file data
 * @param fileName Original file name
 * @param contentType MIME type of the file
 * @param size File size in bytes (optional, will use buffer length if not provided)
 * @returns Object with file information
 */
export async function uploadToLocal(
  file: Buffer,
  fileName: string,
  contentType: string,
  size?: number
): Promise<FileInfo> {
  try {
    // Generate a unique key with timestamp prefix to avoid collisions
    const timestamp = Date.now()
    const uuid = uuidv4().split('-')[0] // Short UUID
    const extension = fileName.includes('.') ? fileName.split('.').pop() : ''
    const baseName = fileName.replace(/\.[^/.]+$/, '') // Remove extension
    const key = extension
      ? `${timestamp}-${uuid}-${baseName}.${extension}`
      : `${timestamp}-${uuid}-${fileName}`

    // Create the full file path
    const fullPath = join(UPLOAD_DIR_SERVER, key)

    logger.debug(`Writing file to local storage: ${fullPath}`)

    // Write the file to local storage
    await writeFile(fullPath, file)

    const fileSize = size || file.length
    const servePath = `/api/files/serve/${key}`

    logger.info(`Successfully uploaded file to local storage: ${key} (${fileSize} bytes)`)

    return {
      path: servePath,
      key,
      name: fileName,
      size: fileSize,
      type: contentType,
    }
  } catch (error) {
    logger.error(`Failed to upload file to local storage: ${fileName}`, error)
    throw new Error(
      `Local storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Download a file from local storage
 * @param key File key/name
 * @returns File buffer
 */
export async function downloadFromLocal(key: string): Promise<Buffer> {
  try {
    const { readFile } = await import('fs/promises')
    const fullPath = join(UPLOAD_DIR_SERVER, key)

    logger.debug(`Reading file from local storage: ${fullPath}`)

    const fileBuffer = await readFile(fullPath)

    logger.info(
      `Successfully downloaded file from local storage: ${key} (${fileBuffer.length} bytes)`
    )

    return fileBuffer
  } catch (error) {
    logger.error(`Failed to download file from local storage: ${key}`, error)
    throw new Error(
      `Local storage download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Delete a file from local storage
 * @param key File key/name
 */
export async function deleteFromLocal(key: string): Promise<void> {
  try {
    const { unlink, existsSync } = await import('fs')
    const { promisify } = await import('util')
    const unlinkAsync = promisify(unlink)

    const fullPath = join(UPLOAD_DIR_SERVER, key)

    if (!existsSync(fullPath)) {
      logger.info(`File not found in local storage, but that's okay: ${key}`)
      return
    }

    logger.debug(`Deleting file from local storage: ${fullPath}`)

    await unlinkAsync(fullPath)

    logger.info(`Successfully deleted file from local storage: ${key}`)
  } catch (error) {
    logger.error(`Failed to delete file from local storage: ${key}`, error)
    throw new Error(
      `Local storage deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
