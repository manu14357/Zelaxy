/**
 * Image Search - Shared Types
 *
 * Core type definitions for the Image Search system including
 * catalog management, file processing, indexing, and search operations.
 */

// ==========================================
// Data Source Types
// ==========================================

export type DataSourceType =
  | 'upload'
  | 'network'
  | 's3'
  | 'azure_blob'
  | 'google_drive'
  | 'postgresql'
  | 'mssql'
  | 'url'

export type ExtractionMethod = 'auto' | 'oda' | 'autodesk_aps' | 'ai_vision' | 'ocr'

export type ProcessingMode = 'batch' | 'realtime'

export type FileType = 'image' | 'dwg' | 'dxf' | 'pdf' | 'svg'

export type EmbeddingType = 'text' | 'visual' | 'combined'

// ==========================================
// Connection Config (per data source)
// ==========================================

export interface NetworkConnectionConfig {
  path: string // SMB/NFS/UNC path
  username?: string
  password?: string
  domain?: string
  recursive?: boolean
  fileExtensions?: string[] // Filter by extensions
}

export interface S3ConnectionConfig {
  bucket: string
  prefix?: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  recursive?: boolean
  fileExtensions?: string[]
}

export interface AzureBlobConnectionConfig {
  connectionString: string
  containerName: string
  prefix?: string
  recursive?: boolean
  fileExtensions?: string[]
}

export interface GoogleDriveConnectionConfig {
  accessToken: string
  folderId: string
  recursive?: boolean
  fileExtensions?: string[]
}

export interface DatabaseConnectionConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  query: string // SQL query returning filePath, filename, and optional metadata columns
  encrypt?: boolean
  trustServerCertificate?: boolean
}

export interface URLConnectionConfig {
  urls: string[] // Direct file URLs
}

export type ConnectionConfig =
  | NetworkConnectionConfig
  | S3ConnectionConfig
  | AzureBlobConnectionConfig
  | GoogleDriveConnectionConfig
  | DatabaseConnectionConfig
  | URLConnectionConfig

// ==========================================
// File Discovery
// ==========================================

export interface DiscoveredFile {
  filename: string
  filePath: string // Original path or URL
  fileSize: number
  mimeType: string
  fileType: FileType
  metadata?: Record<string, any> // Extra metadata from discovery (e.g., DB columns)
}

// ==========================================
// Extraction Results
// ==========================================

export interface ExtractedTextResult {
  text: string
  method: ExtractionMethod
  confidence: number // 0-1
  entities: TextEntity[] // Individual text entities found
}

export interface TextEntity {
  text: string
  type: 'text' | 'mtext' | 'dimension' | 'attribute' | 'label' | 'annotation' | 'title'
  position?: { x: number; y: number; z?: number }
  layer?: string
  style?: string
}

export interface SpatialData {
  layers: LayerInfo[]
  blocks: BlockInfo[]
  dimensions: DimensionInfo[]
  coordinates: CoordinateInfo[]
  boundingBox?: BoundingBox
  units?: string // mm, inches, etc.
  scale?: number
}

export interface LayerInfo {
  name: string
  color?: string
  lineType?: string
  visible: boolean
  frozen: boolean
  entityCount: number
}

export interface BlockInfo {
  name: string
  insertionPoint?: { x: number; y: number; z?: number }
  scale?: { x: number; y: number; z?: number }
  rotation?: number
  attributes: Record<string, string>
  layer?: string
}

export interface DimensionInfo {
  type: 'linear' | 'angular' | 'radial' | 'diameter' | 'ordinate' | 'aligned'
  value: number
  unit?: string
  text?: string
  position?: { x: number; y: number }
  layer?: string
}

export interface CoordinateInfo {
  x: number
  y: number
  z?: number
  entityType: string
  layer?: string
}

export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  minZ?: number
  maxZ?: number
}

// ==========================================
// Processing Results
// ==========================================

export interface FileProcessingResult {
  documentId: string
  filename: string
  fileType: FileType
  extractedText: string
  textLength: number
  metadata: Record<string, any>
  spatialData: SpatialData | null
  thumbnailUrl: string | null
  extractionMethod: ExtractionMethod
  processingTimeMs: number
  error?: string
}

// ==========================================
// Search Types
// ==========================================

export type SearchMode = 'keyword' | 'visual' | 'hybrid' | 'spatial'

export interface SearchQuery {
  catalogIds: string[]
  query?: string // Text query for keyword/hybrid search
  imageUrl?: string // Image URL for visual similarity search
  mode: SearchMode
  topK: number // Number of results to return (1-100)
  filters?: SearchFilters
  spatialFilters?: SpatialSearchFilters
}

export interface SearchFilters {
  tags?: Record<string, string> // tagDisplayName -> value
  fileType?: FileType[]
  extractionMethod?: ExtractionMethod[]
  dateRange?: { from?: string; to?: string }
  metadata?: Record<string, any> // JSONB metadata filters
}

export interface SpatialSearchFilters {
  layers?: string[] // Filter by layer names
  blockNames?: string[] // Filter by block names
  dimensionRange?: { min?: number; max?: number; unit?: string }
  coordinateRange?: {
    minX?: number
    maxX?: number
    minY?: number
    maxY?: number
  }
  hasBlocks?: boolean
  hasDimensions?: boolean
}

export interface SearchResult {
  documentId: string
  filename: string
  filePath: string | null
  fileUrl: string | null
  thumbnailUrl: string | null
  fileType: FileType
  similarity: number // 0-1
  matchedContent: string // Text snippet that matched
  extractedText: string | null
  metadata: Record<string, any>
  spatialData: SpatialData | null
  tags: Record<string, string>
  rankingDetails?: {
    keywordScore?: number
    visualScore?: number
    spatialScore?: number
    fusedScore: number
  }
}

export interface SearchResponse {
  results: SearchResult[]
  totalFound: number
  searchTimeMs: number
  searchMode: SearchMode
  query?: string
}

// ==========================================
// Indexing Types
// ==========================================

export interface IndexingJob {
  catalogId: string
  files: DiscoveredFile[]
  extractionMethod: ExtractionMethod
  embeddingModel: string
  batchSize: number
  onProgress?: (progress: IndexingProgress) => void
}

export interface IndexingProgress {
  catalogId: string
  totalFiles: number
  processedFiles: number
  failedFiles: number
  percentage: number
  currentFile?: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  errors: Array<{ filename: string; error: string }>
}

// ==========================================
// Supported File Extensions
// ==========================================

export const SUPPORTED_IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.tiff',
  '.tif',
  '.bmp',
  '.webp',
  '.gif',
] as const

export const SUPPORTED_CAD_EXTENSIONS = ['.dwg', '.dxf'] as const

export const SUPPORTED_DOCUMENT_EXTENSIONS = ['.pdf', '.svg'] as const

export const ALL_SUPPORTED_EXTENSIONS = [
  ...SUPPORTED_IMAGE_EXTENSIONS,
  ...SUPPORTED_CAD_EXTENSIONS,
  ...SUPPORTED_DOCUMENT_EXTENSIONS,
] as const

export const ACCEPTED_FILE_TYPES = ALL_SUPPORTED_EXTENSIONS.join(',')

export function getFileType(filename: string): FileType {
  const ext = filename.toLowerCase().split('.').pop() || ''
  if (ext === 'dwg') return 'dwg'
  if (ext === 'dxf') return 'dxf'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'svg') return 'svg'
  return 'image'
}

export function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || ''
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    bmp: 'image/bmp',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    dwg: 'application/acad',
    dxf: 'application/dxf',
  }
  return mimeMap[ext] || 'application/octet-stream'
}
