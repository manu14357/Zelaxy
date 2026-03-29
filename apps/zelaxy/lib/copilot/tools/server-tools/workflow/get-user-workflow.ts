import { eq } from 'drizzle-orm'
import { createLogger } from '@/lib/logs/console/logger'
import { loadWorkflowFromNormalizedTables } from '@/lib/workflows/db-helpers'
import { db } from '@/db'
import { workflow as workflowTable } from '@/db/schema'
import { BaseCopilotTool } from '../base'

interface GetUserWorkflowParams {
  workflowId?: string
  includeMetadata?: boolean
  confirmationMessage?: string
  fullData?: any
  userId?: string
}

class GetUserWorkflowTool extends BaseCopilotTool<GetUserWorkflowParams, string> {
  readonly id = 'get_user_workflow'
  readonly displayName = 'Analyzing your workflow'
  readonly requiresInterrupt = false // Changed: can now fetch from DB directly

  protected async executeImpl(params: GetUserWorkflowParams): Promise<string> {
    const logger = createLogger('GetUserWorkflow')

    logger.info('Server tool received params', {
      hasFullData: !!params.fullData,
      hasConfirmationMessage: !!params.confirmationMessage,
      hasWorkflowId: !!params.workflowId,
      fullDataType: typeof params.fullData,
      fullDataKeys: params.fullData ? Object.keys(params.fullData) : null,
      confirmationMessageLength: params.confirmationMessage?.length || 0,
    })

    // Extract the workflow data from fullData or confirmationMessage
    let workflowData: string | null = null

    if (params.fullData?.userWorkflow) {
      // New format: fullData contains structured data with userWorkflow field
      workflowData = params.fullData.userWorkflow
      logger.info('Using workflow data from fullData.userWorkflow', {
        dataLength: workflowData?.length || 0,
      })
    } else if (params.confirmationMessage) {
      // The confirmationMessage might contain the structured JSON data
      logger.info('Attempting to parse confirmationMessage as structured data', {
        messageLength: params.confirmationMessage.length,
        messagePreview: params.confirmationMessage.substring(0, 100),
      })

      try {
        // Try to parse the confirmation message as structured data
        const parsedMessage = JSON.parse(params.confirmationMessage)
        if (parsedMessage?.userWorkflow) {
          workflowData = parsedMessage.userWorkflow
          logger.info('Successfully extracted userWorkflow from confirmationMessage', {
            dataLength: workflowData?.length || 0,
          })
        } else {
          // Fallback: treat the entire message as workflow data
          workflowData = params.confirmationMessage
          logger.info('Using confirmationMessage directly as workflow data', {
            dataLength: workflowData.length,
          })
        }
      } catch (parseError) {
        // If parsing fails, use the message directly
        workflowData = params.confirmationMessage
        logger.info('Failed to parse confirmationMessage, using directly', {
          dataLength: workflowData.length,
          parseError: parseError instanceof Error ? parseError.message : 'Unknown error',
        })
      }
    } else if (params.workflowId) {
      // Fallback: fetch workflow directly from database using workflowId
      logger.info('No client-side data available, fetching workflow from database', {
        workflowId: params.workflowId,
      })

      workflowData = await fetchWorkflowFromDB(params.workflowId, logger)
    }

    if (!workflowData) {
      throw new Error('No workflow data available. Please provide a workflowId or workflow data.')
    }

    try {
      // Parse the workflow data to validate it's valid JSON
      const workflowState = JSON.parse(workflowData)

      if (!workflowState || !workflowState.blocks) {
        throw new Error('Invalid workflow state received')
      }

      logger.info('Successfully parsed and validated workflow data', {
        blockCount: Object.keys(workflowState.blocks).length,
      })

      // Return the workflow data as properly formatted JSON string
      return JSON.stringify(workflowState, null, 2)
    } catch (error) {
      if (error instanceof SyntaxError) {
        logger.error('Failed to parse workflow data as JSON', { error })
        throw new Error('Invalid workflow data format')
      }
      throw error
    }
  }
}

/**
 * Fetch workflow from database by workflowId
 */
async function fetchWorkflowFromDB(
  workflowId: string,
  logger: ReturnType<typeof createLogger>
): Promise<string> {
  // Fetch workflow from database
  const [workflowRecord] = await db
    .select()
    .from(workflowTable)
    .where(eq(workflowTable.id, workflowId))
    .limit(1)

  if (!workflowRecord) {
    throw new Error(`Workflow ${workflowId} not found in database`)
  }

  // Try to load from normalized tables first, fallback to JSON blob
  let workflowState: any = null

  const normalizedData = await loadWorkflowFromNormalizedTables(workflowId)
  if (normalizedData) {
    workflowState = {
      blocks: normalizedData.blocks,
      edges: normalizedData.edges,
      loops: normalizedData.loops,
      parallels: normalizedData.parallels,
    }
  } else if (workflowRecord.state) {
    // Fallback to JSON blob
    const jsonState = workflowRecord.state as any
    workflowState = {
      blocks: jsonState.blocks || {},
      edges: jsonState.edges || [],
      loops: jsonState.loops || {},
      parallels: jsonState.parallels || {},
    }
  }

  if (!workflowState || !workflowState.blocks) {
    throw new Error('Workflow state is empty or invalid')
  }

  logger.info('Successfully fetched workflow from database', {
    workflowId,
    blockCount: Object.keys(workflowState.blocks).length,
  })

  return JSON.stringify(workflowState, null, 2)
}

// Export the tool instance
export const getUserWorkflowTool = new GetUserWorkflowTool()
