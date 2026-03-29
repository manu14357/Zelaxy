import { useCallback, useEffect, useRef } from 'react'
import { isEqual } from 'lodash'
import { createLogger } from '@/lib/logs/console/logger'
import { useCollaborativeWorkflow } from '@/hooks/use-collaborative-workflow'
import { getProviderFromModel } from '@/providers/utils'
import { useWorkflowDiffStore } from '@/stores/workflow-diff/store'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { useSubBlockStore } from '@/stores/workflows/subblock/store'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'

const logger = createLogger('SubBlockValue')

// Subblock IDs that need to sync to block.data for loop/parallel blocks
const LOOP_SYNC_FIELDS = [
  'count',
  'collection',
  'loopType',
  'maxIterations',
  'parallelExecution',
  'stopOnError',
]
const PARALLEL_SYNC_FIELDS = [
  'count',
  'collection',
  'parallelType',
  'maxConcurrency',
  'waitForAll',
  'stopOnError',
  'timeout',
]

interface UseSubBlockValueOptions {
  debounceMs?: number
  isStreaming?: boolean // Explicit streaming state
  onStreamingEnd?: () => void
}

/**
 * Custom hook to get and set values for a sub-block in a workflow.
 * Handles complex object values properly by using deep equality comparison.
 * Includes automatic debouncing and explicit streaming mode for AI generation.
 *
 * @param blockId The ID of the block containing the sub-block
 * @param subBlockId The ID of the sub-block
 * @param triggerWorkflowUpdate Whether to trigger a workflow update when the value changes
 * @param options Configuration for debouncing and streaming behavior
 * @returns A tuple containing the current value and setter function
 */
export function useSubBlockValue<T = any>(
  blockId: string,
  subBlockId: string,
  triggerWorkflowUpdate = false,
  options?: UseSubBlockValueOptions
): readonly [T | null, (value: T) => void] {
  const { isStreaming = false, onStreamingEnd } = options || {}

  const {
    collaborativeSetSubblockValue,
    collaborativeUpdateIterationCount,
    collaborativeUpdateIterationCollection,
    collaborativeUpdateLoopType,
    collaborativeUpdateParallelType,
    workflowStore,
  } = useCollaborativeWorkflow()

  const blockType = useWorkflowStore(
    useCallback((state) => state.blocks?.[blockId]?.type, [blockId])
  )

  const initialValue = useWorkflowStore(
    useCallback(
      (state) => state.blocks?.[blockId]?.subBlocks?.[subBlockId]?.value ?? null,
      [blockId, subBlockId]
    )
  )

  // Keep a ref to the latest value to prevent unnecessary re-renders
  const valueRef = useRef<T | null>(null)

  // Streaming refs
  const lastEmittedValueRef = useRef<T | null>(null)
  const streamingValueRef = useRef<T | null>(null)
  const wasStreamingRef = useRef<boolean>(false)

  // Get value from subblock store - always call this hook unconditionally
  const storeValue = useSubBlockStore(
    useCallback((state) => state.getValue(blockId, subBlockId), [blockId, subBlockId])
  )

  // Check if we're in diff mode and get diff value if available
  const { isShowingDiff, diffWorkflow } = useWorkflowDiffStore()
  const diffValue =
    isShowingDiff && diffWorkflow
      ? (diffWorkflow.blocks?.[blockId]?.subBlocks?.[subBlockId]?.value ?? null)
      : null

  // Check if this is an API key field that could be auto-filled
  const isApiKey =
    subBlockId === 'apiKey' || (subBlockId?.toLowerCase().includes('apikey') ?? false)

  // Always call this hook unconditionally - don't wrap it in a condition
  const modelSubBlockValue = useSubBlockStore((state) =>
    blockId ? state.getValue(blockId, 'model') : null
  )

  // Determine if this is a provider-based block type
  const isProviderBasedBlock =
    blockType === 'agent' || blockType === 'router' || blockType === 'evaluator'

  // Compute the modelValue based on block type
  const modelValue = isProviderBasedBlock ? (modelSubBlockValue as string) : null

  // Sync loop subblock values to block.data for executor compatibility
  const syncLoopBlockData = useCallback(
    (loopId: string, field: string, value: any) => {
      logger.debug('Syncing loop block data', { loopId, field, value })

      switch (field) {
        case 'count':
          // Sync iteration count to block.data.count
          collaborativeUpdateIterationCount(loopId, 'loop', Number(value) || 5)
          break
        case 'collection':
          // Sync collection to block.data.collection
          collaborativeUpdateIterationCollection(loopId, 'loop', String(value || ''))
          break
        case 'loopType':
          // Sync loop type to block.data.loopType
          if (value === 'for' || value === 'forEach') {
            collaborativeUpdateLoopType(loopId, value)
          }
          break
        case 'maxIterations':
        case 'parallelExecution':
        case 'stopOnError':
          // These fields need to be synced to block.data directly
          workflowStore.updateBlockData(loopId, { [field]: value })
          break
      }
    },
    [
      collaborativeUpdateIterationCount,
      collaborativeUpdateIterationCollection,
      collaborativeUpdateLoopType,
      workflowStore,
    ]
  )

  // Sync parallel subblock values to block.data for executor compatibility
  const syncParallelBlockData = useCallback(
    (parallelId: string, field: string, value: any) => {
      logger.debug('Syncing parallel block data', { parallelId, field, value })

      switch (field) {
        case 'count':
          // Sync count to block.data.count
          collaborativeUpdateIterationCount(parallelId, 'parallel', Number(value) || 1)
          break
        case 'collection':
          // Sync collection/distribution to block.data.collection
          collaborativeUpdateIterationCollection(parallelId, 'parallel', String(value || ''))
          break
        case 'parallelType':
          // Sync parallel type to block.data.parallelType
          if (value === 'count' || value === 'collection') {
            collaborativeUpdateParallelType(parallelId, value)
          }
          break
        case 'maxConcurrency':
        case 'waitForAll':
        case 'stopOnError':
        case 'timeout':
          // These fields need to be synced to block.data directly
          workflowStore.updateBlockData(parallelId, { [field]: value })
          break
      }
    },
    [
      collaborativeUpdateIterationCount,
      collaborativeUpdateIterationCollection,
      collaborativeUpdateParallelType,
      workflowStore,
    ]
  )

  // Emit the value to socket/DB
  const emitValue = useCallback(
    (value: T) => {
      collaborativeSetSubblockValue(blockId, subBlockId, value)
      lastEmittedValueRef.current = value
    },
    [blockId, subBlockId, collaborativeSetSubblockValue]
  )

  // Handle streaming mode changes
  useEffect(() => {
    // If we just exited streaming mode, emit the final value
    if (wasStreamingRef.current && !isStreaming && streamingValueRef.current !== null) {
      logger.debug('Streaming ended, persisting final value', { blockId, subBlockId })
      emitValue(streamingValueRef.current)
      streamingValueRef.current = null
      onStreamingEnd?.()
    }
    wasStreamingRef.current = isStreaming
  }, [isStreaming, blockId, subBlockId, emitValue, onStreamingEnd])

  // Hook to set a value in the subblock store
  const setValue = useCallback(
    (newValue: T) => {
      // Don't allow updates when in diff mode (readonly preview)
      if (isShowingDiff) {
        logger.debug('Ignoring setValue in diff mode', { blockId, subBlockId })
        return
      }

      // Use deep comparison to avoid unnecessary updates for complex objects
      if (!isEqual(valueRef.current, newValue)) {
        valueRef.current = newValue

        // Update local store immediately for UI responsiveness
        // The collaborative function will also update it, but that's okay for idempotency
        useSubBlockStore.setState((state) => ({
          workflowValues: {
            ...state.workflowValues,
            [useWorkflowRegistry.getState().activeWorkflowId || '']: {
              ...state.workflowValues[useWorkflowRegistry.getState().activeWorkflowId || ''],
              [blockId]: {
                ...state.workflowValues[useWorkflowRegistry.getState().activeWorkflowId || '']?.[
                  blockId
                ],
                [subBlockId]: newValue,
              },
            },
          },
        }))

        // Handle model changes for provider-based blocks - clear API key when provider changes
        if (
          subBlockId === 'model' &&
          isProviderBasedBlock &&
          newValue &&
          typeof newValue === 'string'
        ) {
          const currentApiKeyValue = useSubBlockStore.getState().getValue(blockId, 'apiKey')

          // Only clear if there's currently an API key value
          if (currentApiKeyValue && currentApiKeyValue !== '') {
            const oldModelValue = storeValue as string
            const oldProvider = oldModelValue ? getProviderFromModel(oldModelValue) : null
            const newProvider = getProviderFromModel(newValue)

            // Clear API key if provider changed
            if (oldProvider !== newProvider) {
              // Use collaborative function to clear the API key
              collaborativeSetSubblockValue(blockId, 'apiKey', '')
            }
          }
        }

        // Ensure we're passing the actual value, not a reference that might change
        const valueCopy =
          newValue === null
            ? null
            : typeof newValue === 'object'
              ? JSON.parse(JSON.stringify(newValue))
              : newValue

        // If streaming, just store the value without emitting
        if (isStreaming) {
          streamingValueRef.current = valueCopy
        } else {
          // Emit immediately - let the operation queue handle debouncing and deduplication
          emitValue(valueCopy)
        }

        // Sync loop/parallel subblock values to block.data so executor can read them
        if (blockType === 'loop' && LOOP_SYNC_FIELDS.includes(subBlockId)) {
          syncLoopBlockData(blockId, subBlockId, valueCopy)
        } else if (blockType === 'parallel' && PARALLEL_SYNC_FIELDS.includes(subBlockId)) {
          syncParallelBlockData(blockId, subBlockId, valueCopy)
        }

        if (triggerWorkflowUpdate) {
          useWorkflowStore.getState().triggerUpdate()
        }
      }
    },
    [
      blockId,
      subBlockId,
      blockType,
      isApiKey,
      storeValue,
      triggerWorkflowUpdate,
      modelValue,
      isStreaming,
      emitValue,
      isShowingDiff,
      syncLoopBlockData,
      syncParallelBlockData,
    ]
  )

  // Determine the effective value: diff value takes precedence if in diff mode
  const effectiveValue =
    isShowingDiff && diffValue !== null
      ? diffValue
      : storeValue !== undefined
        ? storeValue
        : initialValue

  // Initialize valueRef on first render
  useEffect(() => {
    valueRef.current = effectiveValue
  }, [])

  // Update the ref if the effective value changes
  // This ensures we're always working with the latest value
  useEffect(() => {
    // Use deep comparison for objects to prevent unnecessary updates
    if (!isEqual(valueRef.current, effectiveValue)) {
      valueRef.current = effectiveValue
    }
  }, [effectiveValue])

  // Return appropriate tuple based on whether options were provided
  return [effectiveValue, setValue] as const
}
