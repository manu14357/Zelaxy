/**
 * Image Search Tool - Ingest Operation
 */

import type { ImageIngestResponse } from '@/tools/image_search/types'
import type { ToolConfig } from '@/tools/types'

export const imageSearchIngestTool: ToolConfig<any, ImageIngestResponse> = {
  id: 'image_search_ingest',
  name: 'Image Search Ingest',
  description:
    'Ingest and index image files from various data sources into an image catalog for searching',
  version: '1.0.0',

  params: {
    catalogId: {
      type: 'string',
      required: true,
      description: 'ID of the image catalog to ingest files into',
    },
    dataSource: {
      type: 'string',
      required: true,
      description:
        'Data source type: upload, network, s3, azure_blob, google_drive, postgresql, mssql, url',
    },
    // Network
    networkPath: {
      type: 'string',
      required: false,
      description: 'Network/local folder path to scan for files',
    },
    networkRecursive: {
      type: 'boolean',
      required: false,
      description: 'Whether to scan subfolders recursively',
    },
    // S3
    s3Bucket: {
      type: 'string',
      required: false,
      description: 'AWS S3 bucket name',
    },
    s3Prefix: {
      type: 'string',
      required: false,
      description: 'S3 key prefix (folder path)',
    },
    s3Region: {
      type: 'string',
      required: false,
      description: 'AWS region',
    },
    s3AccessKey: {
      type: 'string',
      required: false,
      description: 'AWS access key ID',
    },
    s3SecretKey: {
      type: 'string',
      required: false,
      description: 'AWS secret access key',
    },
    // Azure
    azureConnectionString: {
      type: 'string',
      required: false,
      description: 'Azure Blob Storage connection string',
    },
    azureContainer: {
      type: 'string',
      required: false,
      description: 'Azure container name',
    },
    // Google Drive
    googleDriveFolderId: {
      type: 'string',
      required: false,
      description: 'Google Drive folder ID',
    },
    googleDriveAccessToken: {
      type: 'string',
      required: false,
      description: 'Google Drive OAuth access token',
    },
    // Database (PostgreSQL)
    dbConnectionString: {
      type: 'string',
      required: false,
      description: 'PostgreSQL database connection string',
    },
    dbQuery: {
      type: 'string',
      required: false,
      description: 'PostgreSQL SQL query to retrieve file paths',
    },
    // Database (MSSQL)
    mssqlConnectionString: {
      type: 'string',
      required: false,
      description: 'MSSQL database connection string',
    },
    mssqlQuery: {
      type: 'string',
      required: false,
      description: 'MSSQL SQL query to retrieve file paths',
    },
    // URL
    urls: {
      type: 'string',
      required: false,
      description: 'Comma-separated URLs of image files',
    },
    // Processing options
    extractionMethod: {
      type: 'string',
      required: false,
      description: 'Extraction method: auto, oda, autodesk_aps, ai_vision, ocr',
    },
    apiKey: {
      type: 'string',
      required: false,
      description: 'API key for AI vision extraction and embedding generation',
    },
  },

  request: {
    url: () => '/api/image-search',
    method: 'POST',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    body: (params) => {
      // Build connection config based on data source
      let connectionConfig: Record<string, any> = {}

      switch (params.dataSource) {
        case 'network':
          connectionConfig = {
            path: params.networkPath,
            recursive: params.networkRecursive !== false,
          }
          break
        case 's3':
          connectionConfig = {
            bucket: params.s3Bucket,
            prefix: params.s3Prefix || '',
            region: params.s3Region || 'us-east-1',
            accessKeyId: params.s3AccessKey,
            secretAccessKey: params.s3SecretKey,
          }
          break
        case 'azure_blob':
          connectionConfig = {
            connectionString: params.azureConnectionString,
            container: params.azureContainer,
          }
          break
        case 'google_drive':
          connectionConfig = {
            folderId: params.googleDriveFolderId,
            accessToken: params.googleDriveAccessToken,
          }
          break
        case 'postgresql':
          connectionConfig = {
            connectionString: params.dbConnectionString,
            query: params.dbQuery,
          }
          break
        case 'mssql':
          connectionConfig = {
            connectionString: params.mssqlConnectionString,
            query: params.mssqlQuery,
          }
          break
        case 'url':
          connectionConfig = {
            urls: params.urls ? params.urls.split(',').map((u: string) => u.trim()) : [],
          }
          break
      }

      return {
        action: 'ingest',
        catalogId: params.catalogId,
        dataSource: params.dataSource,
        connectionConfig,
        extractionMethod: params.extractionMethod || 'auto',
        apiKey: params.apiKey || params._context?.credential,
        userId: params._context?.userId || 'system',
      }
    },
  },

  transformResponse: async (response): Promise<ImageIngestResponse> => {
    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        output: {
          catalogId: '',
          totalDiscovered: 0,
          processed: 0,
          failed: 0,
          errors: [],
          message: result.error || 'Ingestion failed',
        },
        error: result.error,
      }
    }

    return {
      success: true,
      output: result.output,
    }
  },

  outputs: {
    catalogId: {
      type: 'string',
      description: 'The catalog ID files were ingested into',
    },
    totalDiscovered: {
      type: 'number',
      description: 'Total files discovered from the data source',
    },
    processed: {
      type: 'number',
      description: 'Number of files successfully processed',
    },
    failed: {
      type: 'number',
      description: 'Number of files that failed processing',
    },
    message: {
      type: 'string',
      description: 'Summary message of the ingestion',
    },
  },
}
