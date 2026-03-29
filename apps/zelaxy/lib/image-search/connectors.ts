/**
 * Data Source Connectors
 *
 * Handles file discovery from multiple data sources:
 *   - Local file upload (browser)
 *   - Network shared folders (SMB/NFS)
 *   - Cloud storage (S3, Azure Blob, Google Drive)
 *   - Databases (PostgreSQL, MSSQL — query for file paths)
 *   - URL/HTTP endpoints
 *
 * Each connector discovers files and returns DiscoveredFile[] for the indexer.
 */

import fs from 'fs/promises'
import path from 'path'
import {
  ALL_SUPPORTED_EXTENSIONS,
  type AzureBlobConnectionConfig,
  type ConnectionConfig,
  type DatabaseConnectionConfig,
  type DataSourceType,
  type DiscoveredFile,
  type GoogleDriveConnectionConfig,
  getFileType,
  getMimeType,
  type NetworkConnectionConfig,
  type S3ConnectionConfig,
  type URLConnectionConfig,
} from './types'

// ==========================================
// Connector Interface
// ==========================================

export interface ConnectorResult {
  files: DiscoveredFile[]
  totalFound: number
  errors: Array<{ path: string; error: string }>
}

// ==========================================
// Upload Connector (browser uploads already stored locally)
// ==========================================

/**
 * Handle files that were uploaded via the browser file-upload SubBlock.
 * These files are already on disk in the uploads/ directory.
 */
export async function discoverFromUpload(
  fileInfos: Array<{ path: string; name: string; size?: number }>
): Promise<ConnectorResult> {
  const files: DiscoveredFile[] = []
  const errors: Array<{ path: string; error: string }> = []

  for (const fileInfo of fileInfos) {
    try {
      const stats = await fs.stat(fileInfo.path)
      const filename = fileInfo.name || path.basename(fileInfo.path)

      if (!isSupportedFile(filename)) {
        errors.push({ path: fileInfo.path, error: `Unsupported file type: ${filename}` })
        continue
      }

      files.push({
        filename,
        filePath: fileInfo.path,
        fileSize: fileInfo.size || stats.size,
        mimeType: getMimeType(filename),
        fileType: getFileType(filename),
      })
    } catch (error) {
      errors.push({
        path: fileInfo.path,
        error: `File access error: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  return { files, totalFound: files.length, errors }
}

// ==========================================
// Network Connector (SMB/NFS/local path)
// ==========================================

/**
 * Discover files from a network share or local directory path.
 * Supports recursive scanning with file type filtering.
 */
export async function discoverFromNetwork(
  config: NetworkConnectionConfig
): Promise<ConnectorResult> {
  const files: DiscoveredFile[] = []
  const errors: Array<{ path: string; error: string }> = []
  const extensions = config.fileExtensions || ALL_SUPPORTED_EXTENSIONS.map((e) => e)

  async function scanDirectory(dirPath: string, depth = 0): Promise<void> {
    if (depth > 10) return // Max recursion depth

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory() && config.recursive !== false) {
          await scanDirectory(fullPath, depth + 1)
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          if (extensions.some((e) => e.toLowerCase() === ext)) {
            try {
              const stats = await fs.stat(fullPath)
              files.push({
                filename: entry.name,
                filePath: fullPath,
                fileSize: stats.size,
                mimeType: getMimeType(entry.name),
                fileType: getFileType(entry.name),
              })
            } catch (err) {
              errors.push({
                path: fullPath,
                error: `Cannot stat file: ${err instanceof Error ? err.message : String(err)}`,
              })
            }
          }
        }
      }
    } catch (err) {
      errors.push({
        path: dirPath,
        error: `Cannot read directory: ${err instanceof Error ? err.message : String(err)}`,
      })
    }
  }

  await scanDirectory(config.path)
  return { files, totalFound: files.length, errors }
}

// ==========================================
// S3 Connector
// ==========================================

/**
 * Discover files from an S3 bucket with optional prefix filtering.
 */
export async function discoverFromS3(config: S3ConnectionConfig): Promise<ConnectorResult> {
  const files: DiscoveredFile[] = []
  const errors: Array<{ path: string; error: string }> = []

  try {
    const { S3Client, ListObjectsV2Command, GetObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

    const client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })

    let continuationToken: string | undefined
    const extensions = config.fileExtensions || ALL_SUPPORTED_EXTENSIONS.map((e) => e)

    do {
      const command = new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: config.prefix || '',
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })

      const response = await client.send(command)

      for (const obj of response.Contents || []) {
        if (!obj.Key || !obj.Size) continue

        const filename = path.basename(obj.Key)
        const ext = path.extname(filename).toLowerCase()

        if (!extensions.some((e) => e.toLowerCase() === ext)) continue

        // Generate presigned URL for downloading
        const getObjectCmd = new GetObjectCommand({
          Bucket: config.bucket,
          Key: obj.Key,
        })
        const presignedUrl = await getSignedUrl(client, getObjectCmd, {
          expiresIn: 86400, // 24 hours
        })

        files.push({
          filename,
          filePath: `s3://${config.bucket}/${obj.Key}`,
          fileSize: obj.Size,
          mimeType: getMimeType(filename),
          fileType: getFileType(filename),
          metadata: { s3Key: obj.Key, lastModified: obj.LastModified?.toISOString() },
        })
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)
  } catch (error) {
    errors.push({
      path: `s3://${config.bucket}`,
      error: `S3 error: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  return { files, totalFound: files.length, errors }
}

// ==========================================
// Azure Blob Connector
// ==========================================

/**
 * Discover files from an Azure Blob Storage container.
 */
export async function discoverFromAzureBlob(
  config: AzureBlobConnectionConfig
): Promise<ConnectorResult> {
  const files: DiscoveredFile[] = []
  const errors: Array<{ path: string; error: string }> = []

  try {
    const { BlobServiceClient } = await import('@azure/storage-blob')
    const blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString)
    const containerClient = blobServiceClient.getContainerClient(config.containerName)

    const extensions = config.fileExtensions || ALL_SUPPORTED_EXTENSIONS.map((e) => e)

    for await (const blob of containerClient.listBlobsFlat({
      prefix: config.prefix || '',
    })) {
      const filename = path.basename(blob.name)
      const ext = path.extname(filename).toLowerCase()

      if (!extensions.some((e) => e.toLowerCase() === ext)) continue

      const blobClient = containerClient.getBlobClient(blob.name)

      files.push({
        filename,
        filePath: blobClient.url,
        fileSize: blob.properties.contentLength || 0,
        mimeType: getMimeType(filename),
        fileType: getFileType(filename),
        metadata: {
          blobName: blob.name,
          lastModified: blob.properties.lastModified?.toISOString(),
        },
      })
    }
  } catch (error) {
    errors.push({
      path: `azure://${config.containerName}`,
      error: `Azure Blob error: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  return { files, totalFound: files.length, errors }
}

// ==========================================
// Google Drive Connector
// ==========================================

/**
 * Discover files from a Google Drive folder.
 */
export async function discoverFromGoogleDrive(
  config: GoogleDriveConnectionConfig
): Promise<ConnectorResult> {
  const files: DiscoveredFile[] = []
  const errors: Array<{ path: string; error: string }> = []

  try {
    const extensions = config.fileExtensions || ALL_SUPPORTED_EXTENSIONS.map((e) => e)

    async function listFolder(folderId: string): Promise<void> {
      let pageToken: string | undefined

      do {
        const params = new URLSearchParams({
          q: `'${folderId}' in parents and trashed = false`,
          fields: 'nextPageToken, files(id, name, size, mimeType, modifiedTime)',
          pageSize: '1000',
        })

        if (pageToken) params.set('pageToken', pageToken)

        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${config.accessToken}` },
          }
        )

        if (!response.ok) {
          throw new Error(`Google Drive API error: ${response.statusText}`)
        }

        const data = (await response.json()) as {
          files: Array<{
            id: string
            name: string
            size?: string
            mimeType: string
            modifiedTime?: string
          }>
          nextPageToken?: string
        }

        for (const file of data.files) {
          // Recurse into folders
          if (
            file.mimeType === 'application/vnd.google-apps.folder' &&
            config.recursive !== false
          ) {
            await listFolder(file.id)
            continue
          }

          const ext = path.extname(file.name).toLowerCase()
          if (!extensions.some((e) => e.toLowerCase() === ext)) continue

          files.push({
            filename: file.name,
            filePath: `gdrive://${file.id}`,
            fileSize: Number.parseInt(file.size || '0', 10),
            mimeType: getMimeType(file.name),
            fileType: getFileType(file.name),
            metadata: {
              driveFileId: file.id,
              lastModified: file.modifiedTime,
            },
          })
        }

        pageToken = data.nextPageToken
      } while (pageToken)
    }

    await listFolder(config.folderId)
  } catch (error) {
    errors.push({
      path: `gdrive://${config.folderId}`,
      error: `Google Drive error: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  return { files, totalFound: files.length, errors }
}

// ==========================================
// Database Connector (PostgreSQL / MSSQL)
// ==========================================

/**
 * Discover file paths from a database query.
 * The query should return columns: filePath, filename (optional), metadata (optional JSON)
 */
export async function discoverFromDatabase(
  config: DatabaseConnectionConfig,
  dbType: 'postgresql' | 'mssql'
): Promise<ConnectorResult> {
  const files: DiscoveredFile[] = []
  const errors: Array<{ path: string; error: string }> = []

  try {
    if (dbType === 'mssql') {
      // Use the existing MSSQL tool pattern
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/tools/mssql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server: config.host,
          port: config.port,
          database: config.database,
          user: config.username,
          password: config.password,
          encrypt: config.encrypt ?? false,
          trustServerCertificate: config.trustServerCertificate ?? true,
          action: 'query',
          query: config.query,
        }),
      })

      if (!response.ok) {
        throw new Error(`MSSQL query failed: ${response.statusText}`)
      }

      const result = (await response.json()) as {
        data: Array<Record<string, any>>
      }

      for (const row of result.data || []) {
        const filePath = row.filePath || row.file_path || row.path || row.FilePath
        if (!filePath) continue

        const filename = row.filename || row.file_name || row.FileName || path.basename(filePath)

        files.push({
          filename,
          filePath,
          fileSize: row.fileSize || row.file_size || 0,
          mimeType: getMimeType(filename),
          fileType: getFileType(filename),
          metadata: row, // Include all DB columns as metadata
        })
      }
    } else {
      // PostgreSQL — use internal API or direct connection
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/tools/image-search/db-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          dbType,
        }),
      })

      if (!response.ok) {
        throw new Error(`PostgreSQL query failed: ${response.statusText}`)
      }

      const result = (await response.json()) as {
        rows: Array<Record<string, any>>
      }

      for (const row of result.rows || []) {
        const filePath = row.filePath || row.file_path || row.path || row.filepath
        if (!filePath) continue

        const filename = row.filename || row.file_name || path.basename(filePath)

        files.push({
          filename,
          filePath,
          fileSize: row.fileSize || row.file_size || 0,
          mimeType: getMimeType(filename),
          fileType: getFileType(filename),
          metadata: row,
        })
      }
    }
  } catch (error) {
    errors.push({
      path: `${dbType}://${config.host}:${config.port}/${config.database}`,
      error: `Database error: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  return { files, totalFound: files.length, errors }
}

// ==========================================
// URL Connector
// ==========================================

/**
 * Discover files from direct HTTP/HTTPS URLs.
 */
export async function discoverFromURLs(config: URLConnectionConfig): Promise<ConnectorResult> {
  const files: DiscoveredFile[] = []
  const errors: Array<{ path: string; error: string }> = []

  for (const url of config.urls) {
    try {
      // HEAD request to get file info
      const response = await fetch(url, { method: 'HEAD' })

      if (!response.ok) {
        errors.push({ path: url, error: `HTTP ${response.status}: ${response.statusText}` })
        continue
      }

      const contentLength = Number.parseInt(response.headers.get('content-length') || '0', 10)
      const contentType = response.headers.get('content-type') || ''

      // Extract filename from URL or content-disposition
      const disposition = response.headers.get('content-disposition') || ''
      let filename = ''
      const filenameMatch = disposition.match(/filename[*]?=(?:UTF-8'')?["']?([^"';\n]+)/)
      if (filenameMatch) {
        filename = decodeURIComponent(filenameMatch[1])
      } else {
        filename = path.basename(new URL(url).pathname) || 'unknown'
      }

      if (!isSupportedFile(filename)) {
        errors.push({ path: url, error: `Unsupported file type: ${filename}` })
        continue
      }

      files.push({
        filename,
        filePath: url,
        fileSize: contentLength,
        mimeType: contentType || getMimeType(filename),
        fileType: getFileType(filename),
      })
    } catch (error) {
      errors.push({
        path: url,
        error: `URL error: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  return { files, totalFound: files.length, errors }
}

// ==========================================
// Main Connector Dispatcher
// ==========================================

/**
 * Discover files from any supported data source.
 */
export async function discoverFiles(
  sourceType: DataSourceType,
  config: ConnectionConfig,
  uploadedFiles?: Array<{ path: string; name: string; size?: number }>
): Promise<ConnectorResult> {
  switch (sourceType) {
    case 'upload':
      return discoverFromUpload(uploadedFiles || [])

    case 'network':
      return discoverFromNetwork(config as NetworkConnectionConfig)

    case 's3':
      return discoverFromS3(config as S3ConnectionConfig)

    case 'azure_blob':
      return discoverFromAzureBlob(config as AzureBlobConnectionConfig)

    case 'google_drive':
      return discoverFromGoogleDrive(config as GoogleDriveConnectionConfig)

    case 'postgresql':
      return discoverFromDatabase(config as DatabaseConnectionConfig, 'postgresql')

    case 'mssql':
      return discoverFromDatabase(config as DatabaseConnectionConfig, 'mssql')

    case 'url':
      return discoverFromURLs(config as URLConnectionConfig)

    default:
      throw new Error(`Unsupported data source type: ${sourceType}`)
  }
}

// ==========================================
// Helpers
// ==========================================

function isSupportedFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ALL_SUPPORTED_EXTENSIONS.some((e) => e === ext)
}
