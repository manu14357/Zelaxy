/**
 * Image Search Block
 *
 * A powerful block for indexing and searching images, DWG/CAD drawings,
 * with support for multiple data sources and search algorithms.
 *
 * Operations:
 *   1. Create Catalog  — creates a new image catalog
 *   2. Ingest Files    — discovers and indexes files from a data source
 *   3. Search          — keyword / visual / hybrid / spatial search
 *   4. Status          — check catalog indexing progress
 */

import { ImageSearchIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ImageSearchResponse } from '@/tools/image_search/types'

export const ImageSearchBlock: BlockConfig<ImageSearchResponse> = {
  type: 'image_search',
  name: 'Image Search',
  description: 'Search images & CAD drawings',
  longDescription:
    'Index and search images, DWG/DXF CAD drawings with keyword, visual similarity, hybrid, and spatial search. Supports upload, network, S3, Azure Blob, Google Drive, database, and URL sources. Scales to 100K+ files.',
  docsLink: '#',
  category: 'tools',
  bgColor: '#EA580C',
  icon: ImageSearchIcon,
  subBlocks: [
    // ─── Operation selector ────────────────────────────────────────
    {
      id: 'operation',
      title: 'Operation',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Create Catalog', id: 'image_search_catalog' },
        { label: 'Ingest Files', id: 'image_search_ingest' },
        { label: 'Search', id: 'image_search_search' },
        { label: 'Status', id: 'image_search_status' },
      ],
      value: () => 'image_search_search',
    },

    // ═══════════════════════════════════════════════════════════════
    // CREATE CATALOG sub-blocks
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'name',
      title: 'Catalog Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'My Image Catalog',
      condition: { field: 'operation', value: 'image_search_catalog' },
      required: true,
    },
    {
      id: 'description',
      title: 'Description',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Describe what this catalog contains...',
      condition: { field: 'operation', value: 'image_search_catalog' },
    },
    {
      id: 'processingMode',
      title: 'Processing Mode',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Batch', id: 'batch' },
        { label: 'Real-time', id: 'realtime' },
      ],
      value: () => 'batch',
      condition: { field: 'operation', value: 'image_search_catalog' },
    },
    {
      id: 'extractionMethod',
      title: 'Extraction Method',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Auto Detect', id: 'auto' },
        { label: 'ODA Converter', id: 'oda' },
        { label: 'Autodesk APS (Cloud)', id: 'autodesk_aps' },
        { label: 'AI Vision (GPT-4o)', id: 'ai_vision' },
        { label: 'OCR', id: 'ocr' },
      ],
      value: () => 'auto',
      condition: { field: 'operation', value: 'image_search_catalog' },
    },

    // ═══════════════════════════════════════════════════════════════
    // INGEST sub-blocks
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'catalogId',
      title: 'Catalog ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter catalog ID',
      condition: { field: 'operation', value: 'image_search_ingest' },
      required: true,
    },
    {
      id: 'dataSource',
      title: 'Data Source',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'File Upload', id: 'upload' },
        { label: 'Network / Local Folder', id: 'network' },
        { label: 'AWS S3', id: 's3' },
        { label: 'Azure Blob Storage', id: 'azure_blob' },
        { label: 'Google Drive', id: 'google_drive' },
        { label: 'PostgreSQL Database', id: 'postgresql' },
        { label: 'MSSQL Database', id: 'mssql' },
        { label: 'URL', id: 'url' },
      ],
      value: () => 'upload',
      condition: { field: 'operation', value: 'image_search_ingest' },
    },
    // Network source
    {
      id: 'networkPath',
      title: 'Folder Path',
      type: 'short-input',
      layout: 'full',
      placeholder: '/shared/drawings or \\\\server\\share\\drawings',
      condition: { field: 'dataSource', value: 'network' },
    },
    {
      id: 'networkRecursive',
      title: 'Scan Subfolders',
      type: 'switch',
      layout: 'full',
      condition: { field: 'dataSource', value: 'network' },
    },
    // S3 source
    {
      id: 's3Bucket',
      title: 'S3 Bucket',
      type: 'short-input',
      layout: 'full',
      placeholder: 'my-image-bucket',
      condition: { field: 'dataSource', value: 's3' },
    },
    {
      id: 's3Prefix',
      title: 'S3 Prefix',
      type: 'short-input',
      layout: 'full',
      placeholder: 'folder/subfolder/',
      condition: { field: 'dataSource', value: 's3' },
    },
    {
      id: 's3Region',
      title: 'AWS Region',
      type: 'short-input',
      layout: 'full',
      placeholder: 'us-east-1',
      condition: { field: 'dataSource', value: 's3' },
    },
    {
      id: 's3AccessKey',
      title: 'AWS Access Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'AKIA...',
      password: true,
      condition: { field: 'dataSource', value: 's3' },
    },
    {
      id: 's3SecretKey',
      title: 'AWS Secret Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Secret key',
      password: true,
      condition: { field: 'dataSource', value: 's3' },
    },
    // Azure Blob source
    {
      id: 'azureConnectionString',
      title: 'Connection String',
      type: 'short-input',
      layout: 'full',
      placeholder: 'DefaultEndpointsProtocol=https;AccountName=...',
      password: true,
      condition: { field: 'dataSource', value: 'azure_blob' },
    },
    {
      id: 'azureContainer',
      title: 'Container Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'images',
      condition: { field: 'dataSource', value: 'azure_blob' },
    },
    // Google Drive source
    {
      id: 'googleDriveFolderId',
      title: 'Folder ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Google Drive folder ID',
      condition: { field: 'dataSource', value: 'google_drive' },
    },
    {
      id: 'googleDriveAccessToken',
      title: 'Access Token',
      type: 'short-input',
      layout: 'full',
      placeholder: 'OAuth access token',
      password: true,
      condition: { field: 'dataSource', value: 'google_drive' },
    },
    // PostgreSQL source
    {
      id: 'dbConnectionString',
      title: 'Connection String',
      type: 'short-input',
      layout: 'full',
      placeholder: 'postgresql://user:pass@host:5432/dbname',
      password: true,
      condition: { field: 'dataSource', value: 'postgresql' },
    },
    {
      id: 'dbQuery',
      title: 'SQL Query',
      type: 'long-input',
      layout: 'full',
      placeholder: 'SELECT file_path FROM images WHERE active = true',
      condition: { field: 'dataSource', value: 'postgresql' },
    },
    // MSSQL source
    {
      id: 'mssqlConnectionString',
      title: 'Connection String',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Server=...;Database=...;User Id=...;Password=...',
      password: true,
      condition: { field: 'dataSource', value: 'mssql' },
    },
    {
      id: 'mssqlQuery',
      title: 'SQL Query',
      type: 'long-input',
      layout: 'full',
      placeholder: 'SELECT file_path FROM images WHERE active = 1',
      condition: { field: 'dataSource', value: 'mssql' },
    },
    // URL source
    {
      id: 'urls',
      title: 'File URLs',
      type: 'long-input',
      layout: 'full',
      placeholder: 'https://example.com/drawing1.dwg, https://example.com/image2.png',
      condition: { field: 'dataSource', value: 'url' },
    },
    // Ingest extraction method
    {
      id: 'ingestExtractionMethod',
      title: 'Extraction Method',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Auto Detect', id: 'auto' },
        { label: 'ODA Converter', id: 'oda' },
        { label: 'Autodesk APS (Cloud)', id: 'autodesk_aps' },
        { label: 'AI Vision (GPT-4o)', id: 'ai_vision' },
        { label: 'OCR', id: 'ocr' },
      ],
      value: () => 'auto',
      condition: { field: 'operation', value: 'image_search_ingest' },
    },

    // ═══════════════════════════════════════════════════════════════
    // SEARCH sub-blocks
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'searchCatalogId',
      title: 'Catalog ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter catalog ID to search',
      condition: { field: 'operation', value: 'image_search_search' },
      required: true,
    },
    {
      id: 'query',
      title: 'Search Query',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Search for text, dimensions, part names...',
      condition: { field: 'operation', value: 'image_search_search' },
    },
    {
      id: 'mode',
      title: 'Search Mode',
      type: 'dropdown',
      layout: 'full',
      options: [
        { label: 'Hybrid (Keyword + Visual)', id: 'hybrid' },
        { label: 'Keyword (Full-text)', id: 'keyword' },
        { label: 'Visual Similarity', id: 'visual' },
        { label: 'Spatial (CAD Layers / Blocks)', id: 'spatial' },
      ],
      value: () => 'hybrid',
      condition: { field: 'operation', value: 'image_search_search' },
    },
    {
      id: 'imageUrl',
      title: 'Reference Image URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'URL of image for visual similarity search',
      condition: { field: 'mode', value: 'visual' },
    },
    {
      id: 'topK',
      title: 'Results Count',
      type: 'slider',
      layout: 'full',
      min: 1,
      max: 100,
      condition: { field: 'operation', value: 'image_search_search' },
    },
    {
      id: 'spatialLayer',
      title: 'CAD Layer Filter',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Filter by layer name (e.g. DIMENSIONS)',
      condition: { field: 'mode', value: 'spatial' },
    },
    {
      id: 'spatialBlock',
      title: 'CAD Block Filter',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Filter by block name (e.g. TITLE_BLOCK)',
      condition: { field: 'mode', value: 'spatial' },
    },

    // ═══════════════════════════════════════════════════════════════
    // STATUS sub-blocks
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'statusCatalogId',
      title: 'Catalog ID',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter catalog ID',
      condition: { field: 'operation', value: 'image_search_status' },
      required: true,
    },

    // ═══════════════════════════════════════════════════════════════
    // Common — API Key
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'OpenAI API key (for embeddings & AI Vision)',
      password: true,
    },
  ],

  tools: {
    access: [
      'image_search_catalog',
      'image_search_ingest',
      'image_search_search',
      'image_search_status',
    ],
    config: {
      tool: (params) => {
        switch (params.operation) {
          case 'image_search_catalog':
            return 'image_search_catalog'
          case 'image_search_ingest':
            // Map ingest-specific fields
            params.extractionMethod = params.ingestExtractionMethod || 'auto'
            return 'image_search_ingest'
          case 'image_search_search':
            // Map search-specific catalog ID
            params.catalogId = params.searchCatalogId
            return 'image_search_search'
          case 'image_search_status':
            params.catalogId = params.statusCatalogId
            return 'image_search_status'
          default:
            return 'image_search_search'
        }
      },
    },
  },

  inputs: {
    operation: { type: 'string', description: 'Operation to perform' },
    apiKey: { type: 'string', description: 'OpenAI API key' },
    // Create Catalog
    name: { type: 'string', description: 'Catalog name' },
    description: { type: 'string', description: 'Catalog description' },
    processingMode: { type: 'string', description: 'batch or realtime' },
    extractionMethod: { type: 'string', description: 'Extraction method' },
    // Ingest
    catalogId: { type: 'string', description: 'Catalog ID' },
    dataSource: { type: 'string', description: 'Data source type' },
    networkPath: { type: 'string', description: 'Network folder path' },
    networkRecursive: { type: 'boolean', description: 'Scan subfolders' },
    s3Bucket: { type: 'string', description: 'S3 bucket name' },
    s3Prefix: { type: 'string', description: 'S3 key prefix' },
    s3Region: { type: 'string', description: 'AWS region' },
    s3AccessKey: { type: 'string', description: 'AWS access key' },
    s3SecretKey: { type: 'string', description: 'AWS secret key' },
    azureConnectionString: { type: 'string', description: 'Azure connection string' },
    azureContainer: { type: 'string', description: 'Azure container name' },
    googleDriveFolderId: { type: 'string', description: 'Google Drive folder ID' },
    googleDriveAccessToken: { type: 'string', description: 'Google Drive access token' },
    dbConnectionString: { type: 'string', description: 'PostgreSQL connection string' },
    dbQuery: { type: 'string', description: 'PostgreSQL SQL query for file paths' },
    mssqlConnectionString: { type: 'string', description: 'MSSQL connection string' },
    mssqlQuery: { type: 'string', description: 'MSSQL SQL query for file paths' },
    urls: { type: 'string', description: 'Comma-separated file URLs' },
    ingestExtractionMethod: { type: 'string', description: 'Extraction method for ingestion' },
    // Search
    searchCatalogId: { type: 'string', description: 'Search catalog ID' },
    query: { type: 'string', description: 'Search query' },
    mode: { type: 'string', description: 'Search mode' },
    imageUrl: { type: 'string', description: 'Reference image URL' },
    topK: { type: 'number', description: 'Number of results' },
    spatialLayer: { type: 'string', description: 'CAD layer filter' },
    spatialBlock: { type: 'string', description: 'CAD block filter' },
    // Status
    statusCatalogId: { type: 'string', description: 'Status check catalog ID' },
  },

  outputs: {
    // Search outputs
    results: { type: 'json', description: 'Search results with file paths and extracted text' },
    totalResults: { type: 'number', description: 'Total results count' },
    // Catalog outputs
    catalogId: { type: 'string', description: 'Created/queried catalog ID' },
    message: { type: 'string', description: 'Operation result message' },
    // Ingest outputs
    processed: { type: 'number', description: 'Number of files processed' },
    failed: { type: 'number', description: 'Number of files failed' },
    // Status outputs
    status: { type: 'string', description: 'Catalog status' },
    indexingProgress: { type: 'number', description: 'Indexing progress (0-100)' },
    fileCount: { type: 'number', description: 'Total indexed files' },
  },
}
