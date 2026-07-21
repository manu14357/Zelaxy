import { and, eq, inArray, or, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logs/console/logger'
import { loadWorkflowFromNormalizedTables } from '@/lib/workflows/db-helpers'
import * as schema from '@/db/schema'
import { workflow, workflowBlocks, workflowEdges, workflowSubflows } from '@/db/schema'

const logger = createLogger('SocketDatabase')

// Create dedicated database connection for socket server with optimized settings
const connectionString = env.POSTGRES_URL ?? env.DATABASE_URL
const socketDb = drizzle(
  postgres(connectionString, {
    prepare: false,
    idle_timeout: 10,
    connect_timeout: 20,
    max: 25,
    onnotice: () => {},
    debug: false,
  }),
  { schema }
)

// Use dedicated connection for socket operations, fallback to shared db for compatibility
const db = socketDb

// Constants
const DEFAULT_LOOP_ITERATIONS = 5

/**
 * Shared function to handle auto-connect edge insertion
 * @param tx - Database transaction
 * @param workflowId - The workflow ID
 * @param autoConnectEdge - The auto-connect edge data
 * @param logger - Logger instance
 */
async function insertAutoConnectEdge(
  tx: any,
  workflowId: string,
  autoConnectEdge: any,
  logger: any
) {
  if (!autoConnectEdge) return

  await tx.insert(workflowEdges).values({
    id: autoConnectEdge.id,
    workflowId,
    sourceBlockId: autoConnectEdge.source,
    targetBlockId: autoConnectEdge.target,
    sourceHandle: autoConnectEdge.sourceHandle || null,
    targetHandle: autoConnectEdge.targetHandle || null,
  })
  logger.debug(
    `Added auto-connect edge ${autoConnectEdge.id}: ${autoConnectEdge.source} -> ${autoConnectEdge.target}`
  )
}

// Enum for subflow types
enum SubflowType {
  LOOP = 'loop',
  PARALLEL = 'parallel',
}

// Helper function to check if a block type is a subflow type
function isSubflowBlockType(blockType: string): blockType is SubflowType {
  return Object.values(SubflowType).includes(blockType as SubflowType)
}

// Recursively find all descendant block ids of a container using the parentId column.
// Zelaxy stores the parent link in a dedicated `parent_id` column (not data->>'parentId').
function findDescendants(
  containerId: string,
  allBlocks: Array<{ id: string; parentId: string | null }>
): string[] {
  const descendants: string[] = []
  const visited = new Set<string>()
  const stack = [containerId]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (visited.has(current)) continue
    visited.add(current)
    for (const b of allBlocks) {
      if (b.parentId === current) {
        descendants.push(b.id)
        stack.push(b.id)
      }
    }
  }
  return descendants
}

// Helper function to update subflow node lists when child blocks are added/removed
export async function updateSubflowNodeList(dbOrTx: any, workflowId: string, parentId: string) {
  try {
    // Get all child blocks of this parent
    const childBlocks = await dbOrTx
      .select({ id: workflowBlocks.id })
      .from(workflowBlocks)
      .where(and(eq(workflowBlocks.workflowId, workflowId), eq(workflowBlocks.parentId, parentId)))

    const childNodeIds = childBlocks.map((block: any) => block.id)

    // Get current subflow config
    const subflowData = await dbOrTx
      .select({ config: workflowSubflows.config })
      .from(workflowSubflows)
      .where(and(eq(workflowSubflows.id, parentId), eq(workflowSubflows.workflowId, workflowId)))
      .limit(1)

    if (subflowData.length > 0) {
      const updatedConfig = {
        ...subflowData[0].config,
        nodes: childNodeIds,
      }

      await dbOrTx
        .update(workflowSubflows)
        .set({
          config: updatedConfig,
          updatedAt: new Date(),
        })
        .where(and(eq(workflowSubflows.id, parentId), eq(workflowSubflows.workflowId, workflowId)))

      logger.debug(`Updated subflow ${parentId} node list: [${childNodeIds.join(', ')}]`)
    }
  } catch (error) {
    logger.error(`Error updating subflow node list for ${parentId}:`, error)
    // This runs inside the persistWorkflowOperation transaction. The expected "subflow row not
    // created yet" case is already handled by the length check above, so anything reaching here is a
    // real DB failure — rethrow so the enclosing transaction rolls back and we never commit a block
    // change whose parent subflow keeps a stale `nodes` array (which would mis-scope loop/parallel
    // execution).
    throw error
  }
}

// Get workflow state
export async function getWorkflowState(workflowId: string) {
  try {
    const workflowData = await db
      .select()
      .from(workflow)
      .where(eq(workflow.id, workflowId))
      .limit(1)

    if (!workflowData.length) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    // Load from normalized tables first (same logic as REST API)
    const normalizedData = await loadWorkflowFromNormalizedTables(workflowId)

    if (normalizedData) {
      // Use normalized data as source of truth
      const existingState = workflowData[0].state || {}

      const finalState = {
        // Default values for expected properties
        deploymentStatuses: {},
        hasActiveWebhook: false,
        // Preserve any existing state properties
        ...existingState,
        // Override with normalized data (this takes precedence)
        blocks: normalizedData.blocks,
        edges: normalizedData.edges,
        loops: normalizedData.loops,
        parallels: normalizedData.parallels,
        lastSaved: Date.now(),
        isDeployed: workflowData[0].isDeployed || false,
        deployedAt: workflowData[0].deployedAt,
      }

      return {
        ...workflowData[0],
        state: finalState,
        lastModified: Date.now(),
      }
    }
    // Fallback to JSON blob
    return {
      ...workflowData[0],
      lastModified: Date.now(),
    }
  } catch (error) {
    logger.error(`Error fetching workflow state for ${workflowId}:`, error)
    throw error
  }
}

// Persist workflow operation
export async function persistWorkflowOperation(workflowId: string, operation: any) {
  const startTime = Date.now()
  try {
    const { operation: op, target, payload, timestamp, userId } = operation

    // Log high-frequency operations for monitoring
    if (op === 'update-position' && Math.random() < 0.01) {
      // Log 1% of position updates
      logger.debug('Socket DB operation sample:', {
        operation: op,
        target,
        workflowId: `${workflowId.substring(0, 8)}...`,
      })
    }

    await db.transaction(async (tx) => {
      // Update the workflow's last modified timestamp first
      await tx
        .update(workflow)
        .set({ updatedAt: new Date(timestamp) })
        .where(eq(workflow.id, workflowId))

      // Handle different operation types within the transaction
      switch (target) {
        case 'block':
          await handleBlockOperationTx(tx, workflowId, op, payload, userId)
          break
        case 'blocks':
          await handleBlocksOperationTx(tx, workflowId, op, payload, userId)
          break
        case 'edge':
          await handleEdgeOperationTx(tx, workflowId, op, payload, userId)
          break
        case 'edges':
          await handleEdgesOperationTx(tx, workflowId, op, payload, userId)
          break
        case 'subflow':
          await handleSubflowOperationTx(tx, workflowId, op, payload, userId)
          break
        case 'variable':
          await handleVariableOperationTx(tx, workflowId, op, payload, userId)
          break
        default:
          throw new Error(`Unknown operation target: ${target}`)
      }
    })

    // Log slow operations for monitoring
    const duration = Date.now() - startTime
    if (duration > 100) {
      // Log operations taking more than 100ms
      logger.warn('Slow socket DB operation:', {
        operation: operation.operation,
        target: operation.target,
        duration: `${duration}ms`,
        workflowId: `${workflowId.substring(0, 8)}...`,
      })
    }
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(
      `❌ Error persisting workflow operation (${operation.operation} on ${operation.target}) after ${duration}ms:`,
      error
    )
    throw error
  }
}

// Block operations
async function handleBlockOperationTx(
  tx: any,
  workflowId: string,
  operation: string,
  payload: any,
  userId: string
) {
  switch (operation) {
    case 'add': {
      // Validate required fields for add operation
      if (!payload.id || !payload.type || !payload.name || !payload.position) {
        throw new Error('Missing required fields for add block operation')
      }

      logger.debug(`[SERVER] Adding block: ${payload.type} (${payload.id})`, {
        isSubflowType: isSubflowBlockType(payload.type),
      })

      // Extract parentId and extent from payload.data if they exist there, otherwise from payload directly
      const parentId = payload.parentId || payload.data?.parentId || null
      const extent = payload.extent || payload.data?.extent || null

      logger.debug(`[SERVER] Block parent info:`, {
        blockId: payload.id,
        hasParent: !!parentId,
        parentId,
        extent,
        payloadParentId: payload.parentId,
        dataParentId: payload.data?.parentId,
      })

      try {
        const insertData = {
          id: payload.id,
          workflowId,
          type: payload.type,
          name: payload.name,
          positionX: payload.position.x,
          positionY: payload.position.y,
          data: payload.data || {},
          subBlocks: payload.subBlocks || {},
          outputs: payload.outputs || {},
          parentId,
          extent,
          enabled: payload.enabled ?? true,
          horizontalHandles: payload.horizontalHandles ?? true,
          isWide: payload.isWide ?? false,
          advancedMode: payload.advancedMode ?? false,
          height: payload.height || 0,
        }

        await tx.insert(workflowBlocks).values(insertData)

        // Handle auto-connect edge if present
        await insertAutoConnectEdge(tx, workflowId, payload.autoConnectEdge, logger)
      } catch (insertError) {
        logger.error(`[SERVER] ❌ Failed to insert block ${payload.id}:`, insertError)
        throw insertError
      }

      // Auto-create subflow entry for loop/parallel blocks
      if (isSubflowBlockType(payload.type)) {
        try {
          const subflowConfig =
            payload.type === SubflowType.LOOP
              ? {
                  id: payload.id,
                  nodes: [], // Empty initially, will be populated when child blocks are added
                  iterations: payload.data?.count || DEFAULT_LOOP_ITERATIONS,
                  loopType: payload.data?.loopType || 'for',
                  forEachItems: payload.data?.collection || '',
                }
              : {
                  id: payload.id,
                  nodes: [], // Empty initially, will be populated when child blocks are added
                  distribution: payload.data?.collection || '',
                }

          logger.debug(
            `[SERVER] Auto-creating ${payload.type} subflow ${payload.id}:`,
            subflowConfig
          )

          await tx.insert(workflowSubflows).values({
            id: payload.id,
            workflowId,
            type: payload.type,
            config: subflowConfig,
          })
        } catch (subflowError) {
          logger.error(
            `[SERVER] ❌ Failed to create ${payload.type} subflow ${payload.id}:`,
            subflowError
          )
          throw subflowError
        }
      }

      // If this block has a parent, update the parent's subflow node list
      if (parentId) {
        await updateSubflowNodeList(tx, workflowId, parentId)
      }

      logger.debug(`Added block ${payload.id} (${payload.type}) to workflow ${workflowId}`)
      break
    }

    case 'update-position': {
      if (!payload.id || !payload.position) {
        throw new Error('Missing required fields for update position operation')
      }

      const updateResult = await tx
        .update(workflowBlocks)
        .set({
          positionX: payload.position.x,
          positionY: payload.position.y,
          updatedAt: new Date(),
        })
        .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))
        .returning({ id: workflowBlocks.id })

      if (updateResult.length === 0) {
        throw new Error(`Block ${payload.id} not found in workflow ${workflowId}`)
      }
      break
    }

    case 'remove': {
      if (!payload.id) {
        throw new Error('Missing block ID for remove operation')
      }

      // Check if this is a subflow block that needs cascade deletion
      const blockToRemove = await tx
        .select({ type: workflowBlocks.type, parentId: workflowBlocks.parentId })
        .from(workflowBlocks)
        .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))
        .limit(1)

      if (blockToRemove.length > 0 && isSubflowBlockType(blockToRemove[0].type)) {
        // Cascade delete: Remove all child blocks first
        const childBlocks = await tx
          .select({ id: workflowBlocks.id, type: workflowBlocks.type })
          .from(workflowBlocks)
          .where(
            and(eq(workflowBlocks.workflowId, workflowId), eq(workflowBlocks.parentId, payload.id))
          )

        logger.debug(
          `[SERVER] Starting cascade deletion for subflow block ${payload.id} (type: ${blockToRemove[0].type})`
        )
        logger.debug(
          `[SERVER] Found ${childBlocks.length} child blocks to delete: [${childBlocks.map((b: any) => `${b.id} (${b.type})`).join(', ')}]`
        )

        // Remove edges connected to child blocks
        for (const childBlock of childBlocks) {
          await tx
            .delete(workflowEdges)
            .where(
              and(
                eq(workflowEdges.workflowId, workflowId),
                or(
                  eq(workflowEdges.sourceBlockId, childBlock.id),
                  eq(workflowEdges.targetBlockId, childBlock.id)
                )
              )
            )
        }

        // Remove child blocks from database
        await tx
          .delete(workflowBlocks)
          .where(
            and(eq(workflowBlocks.workflowId, workflowId), eq(workflowBlocks.parentId, payload.id))
          )

        // Remove the subflow entry
        await tx
          .delete(workflowSubflows)
          .where(
            and(eq(workflowSubflows.id, payload.id), eq(workflowSubflows.workflowId, workflowId))
          )
      }

      // Remove any edges connected to this block
      await tx
        .delete(workflowEdges)
        .where(
          and(
            eq(workflowEdges.workflowId, workflowId),
            or(
              eq(workflowEdges.sourceBlockId, payload.id),
              eq(workflowEdges.targetBlockId, payload.id)
            )
          )
        )

      // Finally remove the block itself
      await tx
        .delete(workflowBlocks)
        .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))

      // If this block had a parent, update the parent's subflow node list
      if (blockToRemove.length > 0 && blockToRemove[0].parentId) {
        await updateSubflowNodeList(tx, workflowId, blockToRemove[0].parentId)
      }

      logger.debug(`Removed block ${payload.id} and its connections from workflow ${workflowId}`)
      break
    }

    case 'update-name': {
      if (!payload.id || !payload.name) {
        throw new Error('Missing required fields for update name operation')
      }

      const updateResult = await tx
        .update(workflowBlocks)
        .set({
          name: payload.name,
          updatedAt: new Date(),
        })
        .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))
        .returning({ id: workflowBlocks.id })

      if (updateResult.length === 0) {
        throw new Error(`Block ${payload.id} not found in workflow ${workflowId}`)
      }

      logger.debug(`Updated block name: ${payload.id} -> "${payload.name}"`)
      break
    }

    case 'toggle-enabled': {
      if (!payload.id) {
        throw new Error('Missing block ID for toggle enabled operation')
      }

      // Get current enabled state
      const currentBlock = await tx
        .select({ enabled: workflowBlocks.enabled })
        .from(workflowBlocks)
        .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))
        .limit(1)

      if (currentBlock.length === 0) {
        throw new Error(`Block ${payload.id} not found in workflow ${workflowId}`)
      }

      const newEnabledState = !currentBlock[0].enabled

      await tx
        .update(workflowBlocks)
        .set({
          enabled: newEnabledState,
          updatedAt: new Date(),
        })
        .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))

      logger.debug(`Toggled block enabled: ${payload.id} -> ${newEnabledState}`)
      break
    }

    case 'update-parent': {
      if (!payload.id) {
        throw new Error('Missing block ID for update parent operation')
      }

      const updateResult = await tx
        .update(workflowBlocks)
        .set({
          parentId: payload.parentId || null,
          extent: payload.extent || null,
          updatedAt: new Date(),
        })
        .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))
        .returning({ id: workflowBlocks.id })

      if (updateResult.length === 0) {
        throw new Error(`Block ${payload.id} not found in workflow ${workflowId}`)
      }

      // If the block now has a parent, update the parent's subflow node list
      if (payload.parentId) {
        await updateSubflowNodeList(tx, workflowId, payload.parentId)
      }

      logger.debug(
        `Updated block parent: ${payload.id} -> parent: ${payload.parentId}, extent: ${payload.extent}`
      )
      break
    }

    case 'update-wide': {
      if (!payload.id || payload.isWide === undefined) {
        throw new Error('Missing required fields for update wide operation')
      }

      const updateResult = await tx
        .update(workflowBlocks)
        .set({
          isWide: payload.isWide,
          updatedAt: new Date(),
        })
        .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))
        .returning({ id: workflowBlocks.id })

      if (updateResult.length === 0) {
        throw new Error(`Block ${payload.id} not found in workflow ${workflowId}`)
      }

      logger.debug(`Updated block wide state: ${payload.id} -> ${payload.isWide}`)
      break
    }

    case 'update-advanced-mode': {
      if (!payload.id || payload.advancedMode === undefined) {
        throw new Error('Missing required fields for update advanced mode operation')
      }

      const updateResult = await tx
        .update(workflowBlocks)
        .set({
          advancedMode: payload.advancedMode,
          updatedAt: new Date(),
        })
        .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))
        .returning({ id: workflowBlocks.id })

      if (updateResult.length === 0) {
        throw new Error(`Block ${payload.id} not found in workflow ${workflowId}`)
      }

      logger.debug(`Updated block advanced mode: ${payload.id} -> ${payload.advancedMode}`)
      break
    }

    case 'update-trigger-mode': {
      if (!payload.id || payload.triggerMode === undefined) {
        throw new Error('Missing required fields for update trigger mode operation')
      }

      const updateResult = await tx
        .update(workflowBlocks)
        .set({
          triggerMode: payload.triggerMode,
          updatedAt: new Date(),
        })
        .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))
        .returning({ id: workflowBlocks.id })

      if (updateResult.length === 0) {
        throw new Error(`Block ${payload.id} not found in workflow ${workflowId}`)
      }

      logger.debug(`Updated block trigger mode: ${payload.id} -> ${payload.triggerMode}`)
      break
    }

    case 'toggle-handles': {
      if (!payload.id || payload.horizontalHandles === undefined) {
        throw new Error('Missing required fields for toggle handles operation')
      }

      const updateResult = await tx
        .update(workflowBlocks)
        .set({
          horizontalHandles: payload.horizontalHandles,
          updatedAt: new Date(),
        })
        .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))
        .returning({ id: workflowBlocks.id })

      if (updateResult.length === 0) {
        throw new Error(`Block ${payload.id} not found in workflow ${workflowId}`)
      }

      logger.debug(
        `Updated block handles: ${payload.id} -> ${payload.horizontalHandles ? 'horizontal' : 'vertical'}`
      )
      break
    }

    case 'duplicate': {
      // Validate required fields for duplicate operation
      if (!payload.sourceId || !payload.id || !payload.type || !payload.name || !payload.position) {
        throw new Error('Missing required fields for duplicate block operation')
      }

      logger.debug(
        `[SERVER] Duplicating block: ${payload.type} (${payload.sourceId} -> ${payload.id})`,
        {
          isSubflowType: isSubflowBlockType(payload.type),
          payload,
        }
      )

      // Extract parentId and extent from payload
      const parentId = payload.parentId || null
      const extent = payload.extent || null

      try {
        const insertData = {
          id: payload.id,
          workflowId,
          type: payload.type,
          name: payload.name,
          positionX: payload.position.x,
          positionY: payload.position.y,
          data: payload.data || {},
          subBlocks: payload.subBlocks || {},
          outputs: payload.outputs || {},
          parentId,
          extent,
          enabled: payload.enabled ?? true,
          horizontalHandles: payload.horizontalHandles ?? true,
          isWide: payload.isWide ?? false,
          advancedMode: payload.advancedMode ?? false,
          height: payload.height || 0,
        }

        await tx.insert(workflowBlocks).values(insertData)

        // Handle auto-connect edge if present
        await insertAutoConnectEdge(tx, workflowId, payload.autoConnectEdge, logger)
      } catch (insertError) {
        logger.error(`[SERVER] ❌ Failed to insert duplicated block ${payload.id}:`, insertError)
        throw insertError
      }

      // Auto-create subflow entry for loop/parallel blocks
      if (isSubflowBlockType(payload.type)) {
        try {
          const subflowConfig =
            payload.type === SubflowType.LOOP
              ? {
                  id: payload.id,
                  nodes: [], // Empty initially, will be populated when child blocks are added
                  iterations: payload.data?.count || DEFAULT_LOOP_ITERATIONS,
                  loopType: payload.data?.loopType || 'for',
                  forEachItems: payload.data?.collection || '',
                }
              : {
                  id: payload.id,
                  nodes: [], // Empty initially, will be populated when child blocks are added
                  distribution: payload.data?.collection || '',
                }

          logger.debug(
            `[SERVER] Auto-creating ${payload.type} subflow for duplicated block ${payload.id}:`,
            subflowConfig
          )

          await tx.insert(workflowSubflows).values({
            id: payload.id,
            workflowId,
            type: payload.type,
            config: subflowConfig,
          })
        } catch (subflowError) {
          logger.error(
            `[SERVER] ❌ Failed to create ${payload.type} subflow for duplicated block ${payload.id}:`,
            subflowError
          )
          throw subflowError
        }
      }

      // If this block has a parent, update the parent's subflow node list
      if (parentId) {
        await updateSubflowNodeList(tx, workflowId, parentId)
      }

      logger.debug(
        `Duplicated block ${payload.sourceId} -> ${payload.id} (${payload.type}) in workflow ${workflowId}`
      )
      break
    }

    // Add other block operations as needed
    default:
      logger.warn(`Unknown block operation: ${operation}`)
      throw new Error(`Unsupported block operation: ${operation}`)
  }
}

// Batch block operations (multi-select drag/delete/paste). Additive to the
// single-block handler above: these persist N blocks in one transaction so a
// multi-select gesture is one op, not N. No locked/protected filtering (Zelaxy
// has none); parentId/extent/isWide are dedicated columns.
async function handleBlocksOperationTx(
  tx: any,
  workflowId: string,
  operation: string,
  payload: any,
  userId: string
) {
  switch (operation) {
    case 'batch-update-positions': {
      const { updates } = payload
      if (!Array.isArray(updates) || updates.length === 0) {
        return
      }

      for (const update of updates) {
        const { id, position } = update
        if (!id || !position) continue

        await tx
          .update(workflowBlocks)
          .set({
            positionX: position.x,
            positionY: position.y,
            updatedAt: new Date(),
          })
          .where(and(eq(workflowBlocks.id, id), eq(workflowBlocks.workflowId, workflowId)))
      }

      logger.debug(`Batch updated positions for ${updates.length} blocks in workflow ${workflowId}`)
      break
    }

    case 'batch-add-blocks': {
      const { blocks, edges, loops, parallels, subBlockValues } = payload

      logger.info(`Batch adding blocks to workflow ${workflowId}`, {
        blockCount: blocks?.length || 0,
        edgeCount: edges?.length || 0,
        loopCount: Object.keys(loops || {}).length,
        parallelCount: Object.keys(parallels || {}).length,
      })

      if (Array.isArray(blocks) && blocks.length > 0) {
        const blockValues = blocks.map((block: Record<string, any>) => {
          const blockId = block.id as string
          const parentId = (block.parentId ?? block.data?.parentId ?? null) as string | null
          const extent = (block.extent ?? block.data?.extent ?? null) as string | null

          // Overlay any explicitly provided subBlock values on top of the block's own subBlocks
          const baseSubBlocks = (block.subBlocks as Record<string, any>) || {}
          const overlay = subBlockValues?.[blockId]
          const mergedSubBlocks = overlay
            ? Object.fromEntries(
                Object.entries(baseSubBlocks).map(([key, sub]) => [
                  key,
                  overlay[key] !== undefined ? { ...(sub as any), value: overlay[key] } : sub,
                ])
              )
            : baseSubBlocks

          return {
            id: blockId,
            workflowId,
            type: block.type as string,
            name: block.name as string,
            positionX: (block.position as { x: number; y: number }).x,
            positionY: (block.position as { x: number; y: number }).y,
            data: (block.data as Record<string, any>) || {},
            subBlocks: mergedSubBlocks,
            outputs: (block.outputs as Record<string, any>) || {},
            parentId,
            extent,
            enabled: (block.enabled as boolean) ?? true,
            horizontalHandles: (block.horizontalHandles as boolean) ?? true,
            isWide: (block.isWide as boolean) ?? false,
            advancedMode: (block.advancedMode as boolean) ?? false,
            triggerMode: (block.triggerMode as boolean) ?? false,
            height: (block.height as number) || 0,
          }
        })

        await tx
          .insert(workflowBlocks)
          .values(blockValues)
          .onConflictDoUpdate({
            target: workflowBlocks.id,
            set: {
              type: sql`excluded.type`,
              name: sql`excluded.name`,
              positionX: sql`excluded.position_x`,
              positionY: sql`excluded.position_y`,
              enabled: sql`excluded.enabled`,
              horizontalHandles: sql`excluded.horizontal_handles`,
              isWide: sql`excluded.is_wide`,
              advancedMode: sql`excluded.advanced_mode`,
              triggerMode: sql`excluded.trigger_mode`,
              height: sql`excluded.height`,
              subBlocks: sql`excluded.sub_blocks`,
              outputs: sql`excluded.outputs`,
              data: sql`excluded.data`,
              parentId: sql`excluded.parent_id`,
              extent: sql`excluded.extent`,
              updatedAt: sql`now()`,
            },
          })

        // Auto-create subflow entries for loop/parallel blocks not already supplied in payload
        const loopIds = new Set(loops ? Object.keys(loops) : [])
        const parallelIds = new Set(parallels ? Object.keys(parallels) : [])
        for (const block of blocks as Array<Record<string, any>>) {
          const blockId = block.id as string
          if (block.type === SubflowType.LOOP && !loopIds.has(blockId)) {
            await tx
              .insert(workflowSubflows)
              .values({
                id: blockId,
                workflowId,
                type: 'loop',
                config: {
                  id: blockId,
                  nodes: [],
                  iterations: block.data?.count || DEFAULT_LOOP_ITERATIONS,
                  loopType: block.data?.loopType || 'for',
                  forEachItems: block.data?.collection || '',
                },
              })
              .onConflictDoUpdate({
                target: workflowSubflows.id,
                set: { config: sql`excluded.config`, updatedAt: sql`now()` },
              })
          } else if (block.type === SubflowType.PARALLEL && !parallelIds.has(blockId)) {
            await tx
              .insert(workflowSubflows)
              .values({
                id: blockId,
                workflowId,
                type: 'parallel',
                config: {
                  id: blockId,
                  nodes: [],
                  distribution: block.data?.collection || '',
                },
              })
              .onConflictDoUpdate({
                target: workflowSubflows.id,
                set: { config: sql`excluded.config`, updatedAt: sql`now()` },
              })
          }
        }
      }

      if (Array.isArray(edges) && edges.length > 0) {
        const edgeValues = edges.map((edge: Record<string, any>) => ({
          id: edge.id as string,
          workflowId,
          sourceBlockId: edge.source as string,
          targetBlockId: edge.target as string,
          sourceHandle: (edge.sourceHandle as string | null) || null,
          targetHandle: (edge.targetHandle as string | null) || null,
        }))

        await tx
          .insert(workflowEdges)
          .values(edgeValues)
          .onConflictDoUpdate({
            target: workflowEdges.id,
            set: {
              sourceBlockId: sql`excluded.source_block_id`,
              targetBlockId: sql`excluded.target_block_id`,
              sourceHandle: sql`excluded.source_handle`,
              targetHandle: sql`excluded.target_handle`,
            },
          })
      }

      if (loops && Object.keys(loops).length > 0) {
        const loopValues = Object.entries(loops).map(([id, loop]) => ({
          id,
          workflowId,
          type: 'loop',
          config: loop as Record<string, any>,
        }))
        await tx
          .insert(workflowSubflows)
          .values(loopValues)
          .onConflictDoUpdate({
            target: workflowSubflows.id,
            set: { config: sql`excluded.config`, updatedAt: sql`now()` },
          })
      }

      if (parallels && Object.keys(parallels).length > 0) {
        const parallelValues = Object.entries(parallels).map(([id, parallel]) => ({
          id,
          workflowId,
          type: 'parallel',
          config: parallel as Record<string, any>,
        }))
        await tx
          .insert(workflowSubflows)
          .values(parallelValues)
          .onConflictDoUpdate({
            target: workflowSubflows.id,
            set: { config: sql`excluded.config`, updatedAt: sql`now()` },
          })
      }

      // Update parent subflow node lists for any newly parented blocks
      const parentIds = new Set<string>()
      for (const block of (blocks as Array<Record<string, any>>) || []) {
        const parentId = (block.parentId ?? block.data?.parentId) as string | undefined
        if (parentId) parentIds.add(parentId)
      }
      for (const parentId of parentIds) {
        await updateSubflowNodeList(tx, workflowId, parentId)
      }

      logger.info(`Successfully batch added blocks to workflow ${workflowId}`)
      break
    }

    case 'batch-remove-blocks': {
      const { ids } = payload
      if (!Array.isArray(ids) || ids.length === 0) {
        return
      }

      logger.info(`Batch removing ${ids.length} blocks from workflow ${workflowId}`)

      // Fetch all blocks so we can cascade subflow descendants and collect parents
      const allBlocks = await tx
        .select({
          id: workflowBlocks.id,
          type: workflowBlocks.type,
          parentId: workflowBlocks.parentId,
        })
        .from(workflowBlocks)
        .where(eq(workflowBlocks.workflowId, workflowId))

      type BlockRecord = (typeof allBlocks)[number]
      const blocksById: Record<string, BlockRecord> = Object.fromEntries(
        allBlocks.map((b: BlockRecord) => [b.id, b])
      )

      // Collect ids plus all descendants of any subflow (loop/parallel) being removed
      const allBlocksToDelete = new Set<string>(ids)
      for (const id of ids) {
        const block = blocksById[id]
        if (block && isSubflowBlockType(block.type)) {
          for (const descId of findDescendants(id, allBlocks)) {
            allBlocksToDelete.add(descId)
          }
        }
      }

      const blockIdsArray = Array.from(allBlocksToDelete)

      // Collect parent ids BEFORE deletion so their node lists can be refreshed
      const parentIds = new Set<string>()
      for (const id of ids) {
        const parentId = blocksById[id]?.parentId
        if (parentId) parentIds.add(parentId)
      }

      // Remove edges connected to any of the blocks
      await tx
        .delete(workflowEdges)
        .where(
          and(
            eq(workflowEdges.workflowId, workflowId),
            or(
              inArray(workflowEdges.sourceBlockId, blockIdsArray),
              inArray(workflowEdges.targetBlockId, blockIdsArray)
            )
          )
        )

      // Remove subflow entries
      await tx
        .delete(workflowSubflows)
        .where(
          and(
            eq(workflowSubflows.workflowId, workflowId),
            inArray(workflowSubflows.id, blockIdsArray)
          )
        )

      // Remove the blocks themselves
      await tx
        .delete(workflowBlocks)
        .where(
          and(eq(workflowBlocks.workflowId, workflowId), inArray(workflowBlocks.id, blockIdsArray))
        )

      // Refresh parent subflow node lists (skip parents that were themselves removed)
      for (const parentId of parentIds) {
        if (!allBlocksToDelete.has(parentId)) {
          await updateSubflowNodeList(tx, workflowId, parentId)
        }
      }

      logger.info(
        `Successfully batch removed ${blockIdsArray.length} blocks from workflow ${workflowId}`
      )
      break
    }

    default:
      logger.warn(`Unknown blocks operation: ${operation}`)
      throw new Error(`Unsupported blocks operation: ${operation}`)
  }
}

// Batch edge operations (multi-select delete). Additive to the single-edge handler.
async function handleEdgesOperationTx(
  tx: any,
  workflowId: string,
  operation: string,
  payload: any,
  userId: string
) {
  switch (operation) {
    case 'batch-remove-edges': {
      const { ids } = payload
      if (!Array.isArray(ids) || ids.length === 0) {
        return
      }

      logger.info(`Batch removing ${ids.length} edges from workflow ${workflowId}`)

      await tx
        .delete(workflowEdges)
        .where(and(eq(workflowEdges.workflowId, workflowId), inArray(workflowEdges.id, ids)))

      logger.debug(`Batch removed edges from workflow ${workflowId}`)
      break
    }

    default:
      logger.warn(`Unknown edges operation: ${operation}`)
      throw new Error(`Unsupported edges operation: ${operation}`)
  }
}

// Edge operations
async function handleEdgeOperationTx(
  tx: any,
  workflowId: string,
  operation: string,
  payload: any,
  userId: string
) {
  switch (operation) {
    case 'add': {
      // Validate required fields
      if (!payload.id || !payload.source || !payload.target) {
        throw new Error('Missing required fields for add edge operation')
      }

      await tx.insert(workflowEdges).values({
        id: payload.id,
        workflowId,
        sourceBlockId: payload.source,
        targetBlockId: payload.target,
        sourceHandle: payload.sourceHandle || null,
        targetHandle: payload.targetHandle || null,
      })

      logger.debug(`Added edge ${payload.id}: ${payload.source} -> ${payload.target}`)
      break
    }

    case 'remove': {
      if (!payload.id) {
        throw new Error('Missing edge ID for remove operation')
      }

      const deleteResult = await tx
        .delete(workflowEdges)
        .where(and(eq(workflowEdges.id, payload.id), eq(workflowEdges.workflowId, workflowId)))
        .returning({ id: workflowEdges.id })

      if (deleteResult.length === 0) {
        throw new Error(`Edge ${payload.id} not found in workflow ${workflowId}`)
      }

      logger.debug(`Removed edge ${payload.id} from workflow ${workflowId}`)
      break
    }

    default:
      logger.warn(`Unknown edge operation: ${operation}`)
      throw new Error(`Unsupported edge operation: ${operation}`)
  }
}

// Subflow operations
async function handleSubflowOperationTx(
  tx: any,
  workflowId: string,
  operation: string,
  payload: any,
  userId: string
) {
  switch (operation) {
    case 'update': {
      if (!payload.id || !payload.config) {
        throw new Error('Missing required fields for update subflow operation')
      }

      logger.debug(`[SERVER] Updating subflow ${payload.id} with config:`, payload.config)

      // Update the subflow configuration
      const updateResult = await tx
        .update(workflowSubflows)
        .set({
          config: payload.config,
          updatedAt: new Date(),
        })
        .where(
          and(eq(workflowSubflows.id, payload.id), eq(workflowSubflows.workflowId, workflowId))
        )
        .returning({ id: workflowSubflows.id })

      if (updateResult.length === 0) {
        throw new Error(`Subflow ${payload.id} not found in workflow ${workflowId}`)
      }

      logger.debug(`[SERVER] Successfully updated subflow ${payload.id} in database`)

      // Also update the corresponding block's data to keep UI in sync
      if (payload.type === 'loop' && payload.config.iterations !== undefined) {
        // Update the loop block's data.count property
        await tx
          .update(workflowBlocks)
          .set({
            data: {
              ...payload.config,
              count: payload.config.iterations,
              loopType: payload.config.loopType,
              collection: payload.config.forEachItems,
              width: 500,
              height: 300,
              type: 'loopNode',
            },
            updatedAt: new Date(),
          })
          .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))
      } else if (payload.type === 'parallel') {
        // Update the parallel block's data properties
        const blockData = {
          ...payload.config,
          width: 500,
          height: 300,
          type: 'parallelNode',
        }

        // Include count if provided
        if (payload.config.count !== undefined) {
          blockData.count = payload.config.count
        }

        // Include collection if provided
        if (payload.config.distribution !== undefined) {
          blockData.collection = payload.config.distribution
        }

        // Include parallelType if provided
        if (payload.config.parallelType !== undefined) {
          blockData.parallelType = payload.config.parallelType
        }

        await tx
          .update(workflowBlocks)
          .set({
            data: blockData,
            updatedAt: new Date(),
          })
          .where(and(eq(workflowBlocks.id, payload.id), eq(workflowBlocks.workflowId, workflowId)))
      }

      break
    }

    // Add other subflow operations as needed
    default:
      logger.warn(`Unknown subflow operation: ${operation}`)
      throw new Error(`Unsupported subflow operation: ${operation}`)
  }
}

// Variable operations - updates workflow.variables JSON field
async function handleVariableOperationTx(
  tx: any,
  workflowId: string,
  operation: string,
  payload: any,
  userId: string
) {
  // Get current workflow variables. Lock the workflow row (FOR UPDATE) for the duration of the
  // transaction: variables is a single JSON blob updated read-modify-write, so without the lock two
  // concurrent add/remove/duplicate ops both read the old blob and the second write clobbers the
  // first (lost update under READ COMMITTED). Mirrors the hardened variable-update handler.
  const workflowData = await tx
    .select({ variables: workflow.variables })
    .from(workflow)
    .where(eq(workflow.id, workflowId))
    .limit(1)
    .for('update')

  if (workflowData.length === 0) {
    throw new Error(`Workflow ${workflowId} not found`)
  }

  const currentVariables = (workflowData[0].variables as Record<string, any>) || {}

  switch (operation) {
    case 'add': {
      if (!payload.id || !payload.name || payload.type === undefined) {
        throw new Error('Missing required fields for add variable operation')
      }

      // Add the new variable
      const updatedVariables = {
        ...currentVariables,
        [payload.id]: {
          id: payload.id,
          workflowId: payload.workflowId,
          name: payload.name,
          type: payload.type,
          value: payload.value || '',
        },
      }

      await tx
        .update(workflow)
        .set({
          variables: updatedVariables,
          updatedAt: new Date(),
        })
        .where(eq(workflow.id, workflowId))

      logger.debug(`Added variable ${payload.id} (${payload.name}) to workflow ${workflowId}`)
      break
    }

    case 'remove': {
      if (!payload.variableId) {
        throw new Error('Missing variable ID for remove operation')
      }

      // Remove the variable
      const { [payload.variableId]: _, ...updatedVariables } = currentVariables

      await tx
        .update(workflow)
        .set({
          variables: updatedVariables,
          updatedAt: new Date(),
        })
        .where(eq(workflow.id, workflowId))

      logger.debug(`Removed variable ${payload.variableId} from workflow ${workflowId}`)
      break
    }

    case 'duplicate': {
      if (!payload.sourceVariableId || !payload.id) {
        throw new Error('Missing required fields for duplicate variable operation')
      }

      const sourceVariable = currentVariables[payload.sourceVariableId]
      if (!sourceVariable) {
        throw new Error(`Source variable ${payload.sourceVariableId} not found`)
      }

      // Create duplicated variable with unique name
      const baseName = `${sourceVariable.name} (copy)`
      let uniqueName = baseName
      let nameIndex = 1

      // Ensure name uniqueness
      const existingNames = Object.values(currentVariables).map((v: any) => v.name)
      while (existingNames.includes(uniqueName)) {
        uniqueName = `${baseName} (${nameIndex})`
        nameIndex++
      }

      const duplicatedVariable = {
        ...sourceVariable,
        id: payload.id,
        name: uniqueName,
      }

      const updatedVariables = {
        ...currentVariables,
        [payload.id]: duplicatedVariable,
      }

      await tx
        .update(workflow)
        .set({
          variables: updatedVariables,
          updatedAt: new Date(),
        })
        .where(eq(workflow.id, workflowId))

      logger.debug(
        `Duplicated variable ${payload.sourceVariableId} -> ${payload.id} (${uniqueName}) in workflow ${workflowId}`
      )
      break
    }

    default:
      logger.warn(`Unknown variable operation: ${operation}`)
      throw new Error(`Unsupported variable operation: ${operation}`)
  }
}
