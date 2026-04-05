import { createLogger } from '@/lib/logs/console/logger'
import type { BlockOutput } from '@/blocks/types'
import { BlockType } from '@/executor/consts'
import type { PathTracker } from '@/executor/path/path'
import type { InputResolver } from '@/executor/resolver/resolver'
import type { BlockHandler, ExecutionContext } from '@/executor/types'
import type { SerializedBlock } from '@/serializer/types'

const logger = createLogger('SwitchBlockHandler')

interface SwitchCase {
  id: string
  title: string
  value: string
}

/**
 * Handler for Switch blocks that route based on exact value matching.
 * Works like JavaScript's switch statement — deterministic, fast, no LLM needed.
 * Supports {{}} variable references in case values.
 */
export class SwitchBlockHandler implements BlockHandler {
  constructor(
    private pathTracker: PathTracker,
    private resolver: InputResolver
  ) {}

  canHandle(block: SerializedBlock): boolean {
    return block.metadata?.id === BlockType.SWITCH
  }

  async execute(
    block: SerializedBlock,
    inputs: Record<string, any>,
    context: ExecutionContext
  ): Promise<BlockOutput> {
    const inputValue = String(inputs.value ?? '')
    const casesRaw = inputs.cases
    const matchMode: string = String(inputs.matchMode ?? 'exact')

    logger.info(`Executing switch block: ${block.id}`, {
      inputValue,
      matchMode,
    })

    // Parse cases
    let cases: SwitchCase[] = []
    if (typeof casesRaw === 'string') {
      try {
        const parsed = JSON.parse(casesRaw)
        if (Array.isArray(parsed)) {
          cases = parsed
        }
      } catch {
        logger.error('Failed to parse switch cases JSON')
        throw new Error('Invalid switch cases configuration')
      }
    } else if (Array.isArray(casesRaw)) {
      cases = casesRaw
    }

    if (cases.length === 0) {
      throw new Error('Switch block requires at least one case')
    }

    // Get outgoing connections
    const outgoingConnections = context.workflow?.connections.filter(
      (conn) => conn.source === block.id
    )

    // Resolve {{}} references in individual case values
    const resolvedCases = cases.map((c) => {
      if (c.title.toLowerCase() === 'default' || !c.value) return c
      let resolvedValue = c.value
      if (resolvedValue.includes('{{')) {
        resolvedValue = this.resolver.resolveVariableReferences(resolvedValue, block)
        resolvedValue = this.resolver.resolveBlockReferences(resolvedValue, context, block)
        resolvedValue = this.resolver.resolveEnvVariables(resolvedValue, false)
      }
      return { ...c, value: resolvedValue }
    })

    // Match against cases using the selected mode — like JS switch(expression)
    const normalizedInput = inputValue.trim()
    let matchedCase: SwitchCase | undefined
    let selectedConnection: { target: string; sourceHandle?: string } | null = null

    for (const c of resolvedCases) {
      // Skip the default case during matching — it's the fallback
      if (c.title.toLowerCase() === 'default') continue

      const caseValue = c.value.trim()
      const isMatch = this.matchCase(normalizedInput, caseValue, matchMode)

      if (isMatch) {
        matchedCase = c
        selectedConnection = this.findConnection(outgoingConnections, c.id)
        break
      }
    }

    // If a case matched but its connection wasn't found, fall through to default
    if (matchedCase && !selectedConnection) {
      logger.warn(
        `Switch block ${block.id}: case "${matchedCase.title}" matched but has no connection, falling through to default`
      )
      matchedCase = undefined
    }

    // If no case matched, use default
    if (!matchedCase) {
      const defaultCase = resolvedCases.find((c) => c.title.toLowerCase() === 'default')
      if (defaultCase) {
        matchedCase = defaultCase
        selectedConnection = this.findConnection(outgoingConnections, defaultCase.id)
      }
    }

    if (!matchedCase || !selectedConnection) {
      const availableHandles = outgoingConnections?.map((c) => c.sourceHandle).join(', ') || 'none'
      const caseIds = resolvedCases.map((c) => `case-${c.id}`).join(', ')
      throw new Error(
        `Switch block "${block.metadata?.name}": no connection found for value "${normalizedInput}". ` +
          `Available sourceHandles: [${availableHandles}]. Expected case IDs: [${caseIds}].`
      )
    }

    // Find target block
    const targetBlock = context.workflow?.blocks.find((b) => b.id === selectedConnection?.target)
    if (!targetBlock) {
      throw new Error(`Target block ${selectedConnection?.target} not found`)
    }

    // Store the decision (reuse condition decisions map with case- prefix)
    context.decisions.condition.set(block.id, matchedCase.id)

    logger.info(
      `Switch block ${block.id} matched case "${matchedCase.title}" (${matchedCase.id}) [mode: ${matchMode}], routing to ${targetBlock.metadata?.name || targetBlock.id}`
    )

    return {
      matchedValue: matchedCase.value,
      selectedCaseId: matchedCase.id,
      inputValue: normalizedInput,
      matchMode,
      selectedPath: {
        blockId: targetBlock.id,
        blockType: targetBlock.metadata?.id || 'unknown',
        blockTitle: targetBlock.metadata?.name || 'Untitled Block',
      },
      selectedConditionId: matchedCase.id,
    } as unknown as BlockOutput
  }

  /**
   * Find a connection for a given case ID, with fallback strategies.
   * Tries: exact case-{id} match > legacy 'source' handle > any unassigned connection.
   */
  private findConnection(
    outgoingConnections:
      | Array<{ source: string; target: string; sourceHandle?: string }>
      | undefined,
    caseId: string
  ): { target: string; sourceHandle?: string } | null {
    if (!outgoingConnections || outgoingConnections.length === 0) return null

    // Primary: exact sourceHandle match
    const exact = outgoingConnections.find((conn) => conn.sourceHandle === `case-${caseId}`)
    if (exact) return exact

    // Fallback: edges with generic 'source' handle (from auto-connection before fix)
    const legacySource = outgoingConnections.find(
      (conn) => conn.sourceHandle === 'source' || !conn.sourceHandle
    )
    if (legacySource) {
      logger.warn(
        `Using fallback connection (sourceHandle: '${legacySource.sourceHandle || 'undefined'}') for case ${caseId}. ` +
          'Re-connect the edge from the correct switch case handle to fix this.'
      )
      return legacySource
    }

    return null
  }

  /**
   * Match input against a case value using the specified match mode.
   * Supports: exact, contains, startsWith, endsWith, regex, numeric.
   */
  private matchCase(input: string, caseValue: string, mode: string): boolean {
    switch (mode) {
      case 'exact':
        return input === caseValue

      case 'contains':
        return input.toLowerCase().includes(caseValue.toLowerCase())

      case 'startsWith':
        return input.toLowerCase().startsWith(caseValue.toLowerCase())

      case 'endsWith':
        return input.toLowerCase().endsWith(caseValue.toLowerCase())

      case 'regex': {
        try {
          const regex = new RegExp(caseValue, 'i')
          return regex.test(input)
        } catch {
          logger.warn(`Invalid regex pattern in case: ${caseValue}`)
          return false
        }
      }

      case 'numeric': {
        const inputNum = Number(input)
        if (Number.isNaN(inputNum)) return false

        // Support operators: > < >= <= == !=
        const operatorMatch = caseValue.match(/^(>=|<=|!=|>|<|==)\s*(.+)$/)
        if (operatorMatch) {
          const [, operator, valueStr] = operatorMatch
          const caseNum = Number(valueStr.trim())
          if (Number.isNaN(caseNum)) return false

          switch (operator) {
            case '>':
              return inputNum > caseNum
            case '<':
              return inputNum < caseNum
            case '>=':
              return inputNum >= caseNum
            case '<=':
              return inputNum <= caseNum
            case '==':
              return inputNum === caseNum
            case '!=':
              return inputNum !== caseNum
            default:
              return false
          }
        }
        // No operator — exact numeric comparison
        const caseNum = Number(caseValue)
        return !Number.isNaN(caseNum) && inputNum === caseNum
      }

      default:
        return input === caseValue
    }
  }
}
