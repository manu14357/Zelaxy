import { createLogger } from '@/lib/logs/console/logger'
import { BlockType } from '@/executor/consts'
import type { BlockHandler, ExecutionContext } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

const logger = createLogger('VariablesBlockHandler')

interface VariableAssignment {
  variableId?: string
  variableName: string
  value: any
}

function parseAssignments(raw: any): VariableAssignment[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return [] }
  }
  if (Array.isArray(raw)) return raw
  return []
}

export class VariablesBlockHandler implements BlockHandler {
  canHandle(block: SerializedBlock): boolean {
    return block.metadata?.id === BlockType.VARIABLES
  }

  async execute(
    block: SerializedBlock,
    inputs: Record<string, any>,
    ctx: ExecutionContext
  ): Promise<any> {
    if (!ctx.workflowVariables) ctx.workflowVariables = {}

    const assignments = parseAssignments(inputs.variables)
    const output: Record<string, any> = {}

    for (const assignment of assignments) {
      const { variableId, variableName, value } = assignment

      // Find existing variable by ID or name
      const existingEntry = variableId && Object.prototype.hasOwnProperty.call(ctx.workflowVariables, variableId)
        ? [variableId, ctx.workflowVariables[variableId]] as [string, any]
        : Object.entries(ctx.workflowVariables).find(([, v]) => v?.name === variableName)

      if (existingEntry) {
        const [id, variable] = existingEntry
        ctx.workflowVariables[id] = { ...variable, value }
      } else {
        logger.warn(`Variable "${variableName}" not found in workflow variables`)
      }

      output[variableName] = value
    }

    logger.info('Variables block executed', { assignments: assignments.length })
    return output
  }
}
