import { and, desc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logs/console/logger'
import { db } from '@/db'
import { memory } from '@/db/schema'

const logger = createLogger('MemoryByIdAPI')

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET handler for retrieving a specific memory by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    logger.info(`[${requestId}] Processing memory get request for ID: ${id}`)

    // Get parameters from query
    const url = new URL(request.url)
    const workflowId = url.searchParams.get('workflowId')
    const limit = Number.parseInt(url.searchParams.get('limit') || '10')
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    if (!workflowId) {
      logger.warn(`[${requestId}] Missing required parameter: workflowId`)
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Workflow identifier is required',
          },
        },
        { status: 400 }
      )
    }

    // Query the database for the memory record with limit and sorting
    const memories = await db
      .select()
      .from(memory)
      .where(and(eq(memory.key, id), eq(memory.workflowId, workflowId)))
      .orderBy(sortOrder === 'asc' ? memory.createdAt : desc(memory.createdAt))
      .limit(limit)

    if (memories.length === 0) {
      logger.warn(`[${requestId}] Record not found: ${id} for workflow: ${workflowId}`)
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Record not found',
          },
        },
        { status: 404 }
      )
    }

    // Process the memory record to apply message-level limiting and sorting
    const processedMemories = memories.map((memoryRecord) => {
      let processedData = memoryRecord.data
      let originalCount = 0

      // If data is an array of messages, apply limiting and sorting
      if (Array.isArray(memoryRecord.data)) {
        let messages = memoryRecord.data as any[]
        originalCount = messages.length

        // Sort messages by timestamp if available, otherwise keep original order
        if (messages.length > 0 && messages[0].timestamp) {
          messages = messages.sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime()
            const dateB = new Date(b.timestamp).getTime()
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
          })
        }

        // Apply message limit if specified and greater than 0
        if (limit && limit > 0) {
          if (sortOrder === 'asc') {
            messages = messages.slice(0, limit)
          } else {
            // For 'desc', take the last N messages (most recent)
            messages = messages.slice(-limit)
          }
        }

        processedData = messages
      } else {
        originalCount = 1
      }

      return {
        ...memoryRecord,
        data: processedData,
        originalMessageCount: originalCount,
      }
    })

    // Calculate total counts
    const totalOriginalMessages = processedMemories.reduce(
      (sum, mem) => sum + (mem.originalMessageCount || 0),
      0
    )
    const totalProcessedMessages = processedMemories.reduce((sum, mem) => {
      return sum + (Array.isArray(mem.data) ? mem.data.length : 1)
    }, 0)

    logger.info(
      `[${requestId}] Retrieved ${memories.length} record(s): ${id} for workflow: ${workflowId}, processed ${totalProcessedMessages}/${totalOriginalMessages} messages`
    )
    return NextResponse.json(
      {
        success: true,
        data: {
          memories: processedMemories,
          count: totalProcessedMessages,
          totalCount: totalOriginalMessages,
          recordCount: memories.length,
          limit: limit,
          sortOrder: sortOrder,
          id: id,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to retrieve memory',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler for removing a specific memory
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    logger.info(`[${requestId}] Processing memory delete request for ID: ${id}`)

    // Get workflowId from query parameter (required)
    const url = new URL(request.url)
    const workflowId = url.searchParams.get('workflowId')

    if (!workflowId) {
      logger.warn(`[${requestId}] Missing required parameter: workflowId`)
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'workflowId parameter is required',
          },
        },
        { status: 400 }
      )
    }

    // Verify memory exists before attempting to delete
    const existingMemory = await db
      .select({ id: memory.id })
      .from(memory)
      .where(and(eq(memory.key, id), eq(memory.workflowId, workflowId)))
      .limit(1)

    if (existingMemory.length === 0) {
      logger.warn(`[${requestId}] Memory not found: ${id} for workflow: ${workflowId}`)
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Memory not found',
          },
        },
        { status: 404 }
      )
    }

    // Hard delete the memory
    await db.delete(memory).where(and(eq(memory.key, id), eq(memory.workflowId, workflowId)))

    logger.info(`[${requestId}] Memory deleted successfully: ${id} for workflow: ${workflowId}`)
    return NextResponse.json(
      {
        success: true,
        data: { message: 'Memory deleted successfully' },
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to delete memory',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PUT handler for updating a specific memory
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID().slice(0, 8)
  const { id } = await params

  try {
    logger.info(`[${requestId}] Processing memory update request for ID: ${id}`)

    // Parse request body
    const body = await request.json()
    const { data, workflowId } = body

    if (!data) {
      logger.warn(`[${requestId}] Missing required field: data`)
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Memory data is required',
          },
        },
        { status: 400 }
      )
    }

    if (!workflowId) {
      logger.warn(`[${requestId}] Missing required field: workflowId`)
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'workflowId is required',
          },
        },
        { status: 400 }
      )
    }

    // Verify memory exists before attempting to update
    const existingMemories = await db
      .select()
      .from(memory)
      .where(and(eq(memory.key, id), eq(memory.workflowId, workflowId)))
      .limit(1)

    if (existingMemories.length === 0) {
      logger.warn(`[${requestId}] Memory not found: ${id} for workflow: ${workflowId}`)
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Memory not found',
          },
        },
        { status: 404 }
      )
    }

    const existingMemory = existingMemories[0]

    // Validate memory data based on the existing memory type
    if (existingMemory.type === 'agent') {
      if (!data.role || !data.content) {
        logger.warn(`[${requestId}] Missing agent memory fields`)
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Agent memory requires role and content',
            },
          },
          { status: 400 }
        )
      }

      if (!['user', 'assistant', 'system'].includes(data.role)) {
        logger.warn(`[${requestId}] Invalid agent role: ${data.role}`)
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Agent role must be user, assistant, or system',
            },
          },
          { status: 400 }
        )
      }
    }

    // Update the memory with new data
    await db.delete(memory).where(and(eq(memory.key, id), eq(memory.workflowId, workflowId)))

    // Fetch the updated memory
    const updatedMemories = await db
      .select()
      .from(memory)
      .where(and(eq(memory.key, id), eq(memory.workflowId, workflowId)))
      .limit(1)

    logger.info(`[${requestId}] Memory updated successfully: ${id} for workflow: ${workflowId}`)
    return NextResponse.json(
      {
        success: true,
        data: updatedMemories[0],
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to update memory',
        },
      },
      { status: 500 }
    )
  }
}
