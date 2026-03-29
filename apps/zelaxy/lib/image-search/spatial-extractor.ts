/**
 * Spatial Data Extractor
 *
 * Extracts and normalizes spatial data from DXF files for searchable queries.
 * Handles layers, blocks, dimensions, coordinates, and bounding boxes.
 * Produces a standardized SpatialData structure stored as JSONB in the database.
 */

import type {
  BlockInfo,
  BoundingBox,
  CoordinateInfo,
  DimensionInfo,
  LayerInfo,
  SpatialData,
  SpatialSearchFilters,
} from './types'

// ==========================================
// Spatial Data Normalization
// ==========================================

/**
 * Normalize and validate spatial data from parsing
 */
export function normalizeSpatialData(raw: Partial<SpatialData>): SpatialData {
  return {
    layers: normalizeLayers(raw.layers || []),
    blocks: normalizeBlocks(raw.blocks || []),
    dimensions: normalizeDimensions(raw.dimensions || []),
    coordinates: normalizeCoordinates(raw.coordinates || []),
    boundingBox: raw.boundingBox
      ? normalizeBoundingBox(raw.boundingBox)
      : computeBoundingBox(raw.coordinates || []),
    units: raw.units,
    scale: raw.scale,
  }
}

function normalizeLayers(layers: LayerInfo[]): LayerInfo[] {
  return layers.map((l) => ({
    name: l.name.trim(),
    color: l.color,
    lineType: l.lineType,
    visible: l.visible ?? true,
    frozen: l.frozen ?? false,
    entityCount: l.entityCount ?? 0,
  }))
}

function normalizeBlocks(blocks: BlockInfo[]): BlockInfo[] {
  return blocks.map((b) => ({
    name: b.name.trim(),
    insertionPoint: b.insertionPoint,
    scale: b.scale,
    rotation: b.rotation,
    attributes: b.attributes || {},
    layer: b.layer?.trim(),
  }))
}

function normalizeDimensions(dimensions: DimensionInfo[]): DimensionInfo[] {
  return dimensions.map((d) => ({
    type: d.type || 'linear',
    value: typeof d.value === 'number' ? d.value : Number.parseFloat(String(d.value)) || 0,
    unit: d.unit,
    text: d.text,
    position: d.position,
    layer: d.layer?.trim(),
  }))
}

function normalizeCoordinates(coordinates: CoordinateInfo[]): CoordinateInfo[] {
  // Limit to 10000 coordinates to prevent massive JSONB
  return coordinates.slice(0, 10000).map((c) => ({
    x: typeof c.x === 'number' ? c.x : Number.parseFloat(String(c.x)) || 0,
    y: typeof c.y === 'number' ? c.y : Number.parseFloat(String(c.y)) || 0,
    z: c.z,
    entityType: c.entityType || 'unknown',
    layer: c.layer?.trim(),
  }))
}

function normalizeBoundingBox(bb: BoundingBox): BoundingBox {
  return {
    minX: bb.minX,
    minY: bb.minY,
    maxX: bb.maxX,
    maxY: bb.maxY,
    minZ: bb.minZ,
    maxZ: bb.maxZ,
  }
}

function computeBoundingBox(coordinates: CoordinateInfo[]): BoundingBox | undefined {
  if (coordinates.length === 0) return undefined

  return {
    minX: Math.min(...coordinates.map((c) => c.x)),
    minY: Math.min(...coordinates.map((c) => c.y)),
    maxX: Math.max(...coordinates.map((c) => c.x)),
    maxY: Math.max(...coordinates.map((c) => c.y)),
    minZ: coordinates.some((c) => c.z !== undefined)
      ? Math.min(...coordinates.filter((c) => c.z !== undefined).map((c) => c.z!))
      : undefined,
    maxZ: coordinates.some((c) => c.z !== undefined)
      ? Math.max(...coordinates.filter((c) => c.z !== undefined).map((c) => c.z!))
      : undefined,
  }
}

// ==========================================
// Spatial Filtering (in-memory for JSONB data)
// ==========================================

/**
 * Check if a document's spatial data matches the given spatial filters.
 * Used for post-filtering search results or in SQL JSONB conditions.
 */
export function matchesSpatialFilters(
  spatialData: SpatialData | null,
  filters: SpatialSearchFilters
): boolean {
  if (!spatialData) return false

  // Layer filter
  if (filters.layers && filters.layers.length > 0) {
    const docLayers = new Set(spatialData.layers.map((l) => l.name.toLowerCase()))
    const hasMatchingLayer = filters.layers.some((f) => docLayers.has(f.toLowerCase()))
    if (!hasMatchingLayer) return false
  }

  // Block name filter
  if (filters.blockNames && filters.blockNames.length > 0) {
    const docBlocks = new Set(spatialData.blocks.map((b) => b.name.toLowerCase()))
    const hasMatchingBlock = filters.blockNames.some((f) => docBlocks.has(f.toLowerCase()))
    if (!hasMatchingBlock) return false
  }

  // Dimension range filter
  if (filters.dimensionRange) {
    const { min, max } = filters.dimensionRange
    const hasMatchingDimension = spatialData.dimensions.some((d) => {
      if (min !== undefined && d.value < min) return false
      if (max !== undefined && d.value > max) return false
      return true
    })
    if (!hasMatchingDimension) return false
  }

  // Coordinate range filter
  if (filters.coordinateRange) {
    const { minX, maxX, minY, maxY } = filters.coordinateRange
    if (spatialData.boundingBox) {
      const bb = spatialData.boundingBox
      if (minX !== undefined && bb.maxX < minX) return false
      if (maxX !== undefined && bb.minX > maxX) return false
      if (minY !== undefined && bb.maxY < minY) return false
      if (maxY !== undefined && bb.minY > maxY) return false
    } else {
      return false // No bounding box means no coordinate data
    }
  }

  // Has blocks filter
  if (filters.hasBlocks === true && spatialData.blocks.length === 0) return false
  if (filters.hasBlocks === false && spatialData.blocks.length > 0) return false

  // Has dimensions filter
  if (filters.hasDimensions === true && spatialData.dimensions.length === 0) return false
  if (filters.hasDimensions === false && spatialData.dimensions.length > 0) return false

  return true
}

// ==========================================
// Spatial Data Summary (for embedding/search)
// ==========================================

/**
 * Generate a text summary of spatial data for embedding alongside extracted text.
 * This makes spatial features searchable via keyword/vector search.
 */
export function generateSpatialSummary(spatialData: SpatialData): string {
  const parts: string[] = []

  // Layers
  if (spatialData.layers.length > 0) {
    const layerNames = spatialData.layers.map((l) => l.name).join(', ')
    parts.push(`Layers: ${layerNames}`)

    const visibleLayers = spatialData.layers.filter((l) => l.visible).length
    parts.push(`Visible layers: ${visibleLayers}/${spatialData.layers.length}`)
  }

  // Blocks
  if (spatialData.blocks.length > 0) {
    const uniqueBlocks = [...new Set(spatialData.blocks.map((b) => b.name))]
    parts.push(`Blocks: ${uniqueBlocks.join(', ')}`)
    parts.push(`Block instances: ${spatialData.blocks.length}`)

    // Block attributes
    const allAttrs = spatialData.blocks.flatMap((b) =>
      Object.entries(b.attributes).map(([k, v]) => `${k}=${v}`)
    )
    if (allAttrs.length > 0) {
      parts.push(`Block attributes: ${allAttrs.slice(0, 50).join(', ')}`)
    }
  }

  // Dimensions
  if (spatialData.dimensions.length > 0) {
    const dimSummary = spatialData.dimensions
      .map((d) => `${d.type}: ${d.value}${d.unit || ''}`)
      .slice(0, 50)
      .join(', ')
    parts.push(`Dimensions: ${dimSummary}`)

    const minDim = Math.min(...spatialData.dimensions.map((d) => d.value))
    const maxDim = Math.max(...spatialData.dimensions.map((d) => d.value))
    parts.push(`Dimension range: ${minDim} to ${maxDim}`)
  }

  // Bounding box
  if (spatialData.boundingBox) {
    const bb = spatialData.boundingBox
    parts.push(
      `Drawing bounds: X[${bb.minX.toFixed(2)}, ${bb.maxX.toFixed(2)}] Y[${bb.minY.toFixed(2)}, ${bb.maxY.toFixed(2)}]`
    )
    const width = bb.maxX - bb.minX
    const height = bb.maxY - bb.minY
    parts.push(`Drawing size: ${width.toFixed(2)} x ${height.toFixed(2)}`)
  }

  // Units
  if (spatialData.units) {
    parts.push(`Units: ${spatialData.units}`)
  }

  return parts.join('\n')
}

// ==========================================
// SQL Conditions Builder (for JSONB spatial queries)
// ==========================================

/**
 * Build SQL conditions for spatial filtering on the JSONB spatial_data column.
 * Returns an array of raw SQL condition strings.
 */
export function buildSpatialSQLConditions(filters: SpatialSearchFilters): string[] {
  const conditions: string[] = []

  if (filters.layers && filters.layers.length > 0) {
    // Check if any layer name matches
    const layerConditions = filters.layers.map(
      (layer) => `"spatial_data"->'layers' @> '[{"name": "${layer.replace(/'/g, "''")}"}]'::jsonb`
    )
    conditions.push(`(${layerConditions.join(' OR ')})`)
  }

  if (filters.blockNames && filters.blockNames.length > 0) {
    const blockConditions = filters.blockNames.map(
      (block) => `"spatial_data"->'blocks' @> '[{"name": "${block.replace(/'/g, "''")}"}]'::jsonb`
    )
    conditions.push(`(${blockConditions.join(' OR ')})`)
  }

  if (filters.hasBlocks === true) {
    conditions.push(`jsonb_array_length("spatial_data"->'blocks') > 0`)
  }
  if (filters.hasBlocks === false) {
    conditions.push(
      `(jsonb_array_length("spatial_data"->'blocks') = 0 OR "spatial_data"->'blocks' IS NULL)`
    )
  }

  if (filters.hasDimensions === true) {
    conditions.push(`jsonb_array_length("spatial_data"->'dimensions') > 0`)
  }
  if (filters.hasDimensions === false) {
    conditions.push(
      `(jsonb_array_length("spatial_data"->'dimensions') = 0 OR "spatial_data"->'dimensions' IS NULL)`
    )
  }

  if (filters.coordinateRange) {
    const { minX, maxX, minY, maxY } = filters.coordinateRange
    if (minX !== undefined) {
      conditions.push(`("spatial_data"->'boundingBox'->>'maxX')::float >= ${minX}`)
    }
    if (maxX !== undefined) {
      conditions.push(`("spatial_data"->'boundingBox'->>'minX')::float <= ${maxX}`)
    }
    if (minY !== undefined) {
      conditions.push(`("spatial_data"->'boundingBox'->>'maxY')::float >= ${minY}`)
    }
    if (maxY !== undefined) {
      conditions.push(`("spatial_data"->'boundingBox'->>'minY')::float <= ${maxY}`)
    }
  }

  return conditions
}
