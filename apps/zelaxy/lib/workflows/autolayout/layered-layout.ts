/**
 * Layered workflow auto-layout.
 *
 * Positions blocks in layers (columns) based on their connections, the same way a clean
 * left-to-right flow diagram reads: the trigger/start block (no incoming edges) sits in the
 * leftmost layer, and every block is placed one layer to the right of its furthest predecessor.
 * Blocks that share a layer are stacked vertically.
 *
 * The key property: positions are recomputed PURELY from the graph topology, so whatever ad-hoc
 * coordinates an AI edit produced are discarded in favour of a tidy, deterministic arrangement.
 * Linear workflows therefore render as a straight horizontal line; branches fan out into columns.
 *
 * Container blocks (loop / parallel) get their children laid out RELATIVE to the container (React
 * Flow child coordinates are parent-relative), and the container is then sized to fit its children
 * so they render inside the box instead of spilling out.
 */

export interface LayoutBlockLike {
  position: { x: number; y: number }
  height?: number
  type?: string
  data?: { parentId?: string | null; width?: number; height?: number } | null
}

export interface LayoutEdgeLike {
  source: string
  target: string
}

/** Distance between layer columns (left edge of one column to the left edge of the next). */
const LAYER_X_STEP = 600
/** Vertical gap between blocks stacked in the same layer. */
const ROW_Y_GAP = 150
/** Fallback block height when a block hasn't been measured yet. */
const DEFAULT_BLOCK_HEIGHT = 120
/** Approximate canvas block width — used to size containers around their children. */
const BLOCK_WIDTH = 350
/** Top-left origin of the laid-out graph. */
const ORIGIN_X = 150
const ORIGIN_Y = 200
/** Block types that are free-form annotations and should keep their manual position. */
const SKIP_TYPES = new Set(['note'])
/** Padding inside a container: header space above children + margin around them. */
const CONTAINER_HEADER = 60
const CONTAINER_PAD = 40
const CONTAINER_MIN_WIDTH = 360
const CONTAINER_MIN_HEIGHT = 200

interface GroupLayout {
  positions: Record<string, { x: number; y: number }>
  width: number
  height: number
}

/**
 * Lays out a set of block ids as a layered DAG starting at (originX, originY) and returns their
 * positions plus the bounding width/height of the group.
 */
function layoutGroup(
  ids: string[],
  blocks: Record<string, LayoutBlockLike>,
  edges: LayoutEdgeLike[],
  originX: number,
  originY: number
): GroupLayout {
  const positions: Record<string, { x: number; y: number }> = {}
  if (ids.length === 0) return { positions, width: 0, height: 0 }

  const idSet = new Set(ids)
  const incoming = new Map<string, Set<string>>()
  const outgoing = new Map<string, Set<string>>()
  for (const id of ids) {
    incoming.set(id, new Set())
    outgoing.set(id, new Set())
  }

  for (const edge of edges) {
    if (!idSet.has(edge.source) || !idSet.has(edge.target) || edge.source === edge.target) continue
    outgoing.get(edge.source)!.add(edge.target)
    incoming.get(edge.target)!.add(edge.source)
  }

  // Starter blocks have no incoming edges (the trigger). Fall back to the first block if a cycle
  // leaves nothing without incoming edges.
  let starters = ids.filter((id) => incoming.get(id)!.size === 0)
  if (starters.length === 0) starters = [ids[0]]

  // Kahn-style topological pass: a block's layer is one past its furthest-placed predecessor.
  const layer = new Map<string, number>()
  const inDegree = new Map<string, number>()
  for (const id of ids) inDegree.set(id, incoming.get(id)!.size)

  const queue = [...starters]
  for (const id of starters) layer.set(id, 0)
  const processed = new Set<string>()

  while (queue.length > 0) {
    const id = queue.shift()!
    if (processed.has(id)) continue
    processed.add(id)

    if (incoming.get(id)!.size > 0) {
      let maxPredLayer = -1
      for (const pred of incoming.get(id)!) {
        maxPredLayer = Math.max(maxPredLayer, layer.get(pred) ?? 0)
      }
      layer.set(id, maxPredLayer + 1)
    }

    for (const target of outgoing.get(id)!) {
      inDegree.set(target, (inDegree.get(target) ?? 0) - 1)
      if (inDegree.get(target) === 0 && !processed.has(target)) {
        queue.push(target)
      }
    }
  }

  // Any block left unplaced (part of a cycle) goes to layer 0 so it still gets a position.
  for (const id of ids) {
    if (!layer.has(id)) layer.set(id, 0)
  }

  // Group blocks by layer, preserving a stable order within each column.
  const byLayer = new Map<number, string[]>()
  for (const id of ids) {
    const l = layer.get(id)!
    if (!byLayer.has(l)) byLayer.set(l, [])
    byLayer.get(l)!.push(id)
  }

  const layerNumbers = Array.from(byLayer.keys()).sort((a, b) => a - b)
  let maxRight = originX
  let maxBottom = originY

  for (const layerNum of layerNumbers) {
    const column = byLayer.get(layerNum)!
    const x = originX + layerNum * LAYER_X_STEP
    let y = originY
    for (const id of column) {
      positions[id] = { x, y }
      const h = blocks[id].height || DEFAULT_BLOCK_HEIGHT
      y += h + ROW_Y_GAP
      maxBottom = Math.max(maxBottom, positions[id].y + h)
    }
    maxRight = Math.max(maxRight, x + BLOCK_WIDTH)
  }

  return { positions, width: maxRight - originX, height: maxBottom - originY }
}

/**
 * Computes tidy layered positions for a workflow.
 *
 * Container (loop/parallel) children are laid out relative to their container and the container is
 * sized to fit; root-level blocks (and the containers themselves) are then laid out as one DAG.
 * Notes keep their manual positions.
 *
 * @returns a map of blockId -> new position for every block that should move. Container blocks may
 * also have their `data.width`/`data.height` (and `height`) updated in place to fit their children.
 */
export function computeLayeredPositions(
  blocks: Record<string, LayoutBlockLike>,
  edges: LayoutEdgeLike[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  // Group children by their parent container.
  const childrenByParent = new Map<string, string[]>()
  for (const id of Object.keys(blocks)) {
    const block = blocks[id]
    if (!block) continue
    const parentId = block.data?.parentId
    if (!parentId) continue
    if (block.type && SKIP_TYPES.has(block.type)) continue
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, [])
    childrenByParent.get(parentId)!.push(id)
  }

  // 1. Lay out each container's children (relative to the container) and size the container to fit.
  for (const [containerId, childIds] of childrenByParent) {
    const {
      positions: childPositions,
      width,
      height,
    } = layoutGroup(childIds, blocks, edges, CONTAINER_PAD, CONTAINER_HEADER)
    Object.assign(positions, childPositions)

    const container = blocks[containerId]
    if (container) {
      const w = Math.max(width + CONTAINER_PAD, CONTAINER_MIN_WIDTH)
      const h = Math.max(height + CONTAINER_PAD, CONTAINER_MIN_HEIGHT)
      container.data = { ...(container.data || {}), width: w, height: h }
      // Reflect the computed size in `height` so the root pass spaces the container correctly.
      container.height = h
    }
  }

  // 2. Lay out root-level blocks (no parentId, non-note) — containers participate as sized nodes.
  const rootIds = Object.keys(blocks).filter((id) => {
    const block = blocks[id]
    if (!block) return false
    if (block.data?.parentId) return false
    if (block.type && SKIP_TYPES.has(block.type)) return false
    return true
  })
  const { positions: rootPositions } = layoutGroup(rootIds, blocks, edges, ORIGIN_X, ORIGIN_Y)
  Object.assign(positions, rootPositions)

  return positions
}

/**
 * Applies {@link computeLayeredPositions} in place, mutating each block's `position`.
 */
export function applyLayeredLayout(
  blocks: Record<string, LayoutBlockLike>,
  edges: LayoutEdgeLike[]
): void {
  const positions = computeLayeredPositions(blocks, edges)
  for (const [id, position] of Object.entries(positions)) {
    if (blocks[id]) blocks[id].position = position
  }
}
