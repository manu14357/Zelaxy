'use client'

import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getBlockDocsUrl } from '@/lib/docs-url'
import { SubBlock } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/components/sub-block/sub-block'
import { getBlock } from '@/blocks'
import type { SubBlockType } from '@/blocks/types'
import { useCollaborativeWorkflow } from '@/hooks/use-collaborative-workflow'
import { usePanelStore } from '@/stores/panel/store'
import { useWorkflowRegistry } from '@/stores/workflows/registry/store'
import { useSubBlockStore } from '@/stores/workflows/subblock/store'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'

interface PropertiesProps {
  panelWidth?: number
}

export function Properties({ panelWidth = 308 }: PropertiesProps) {
  const selectedNodeId = usePanelStore((state) => state.selectedNodeId)
  const blocks = useWorkflowStore((state) => state.blocks)
  const { activeWorkflowId } = useWorkflowRegistry()

  // Collaborative workflow functions
  const { collaborativeToggleBlockAdvancedMode } = useCollaborativeWorkflow()

  // Get subblock values from the subblock store
  const workflowValues = useSubBlockStore((state) => state.workflowValues)
  const subBlockValues = useMemo(() => {
    if (!activeWorkflowId || !selectedNodeId) return {}
    return workflowValues[activeWorkflowId]?.[selectedNodeId] || {}
  }, [workflowValues, activeWorkflowId, selectedNodeId])

  // Get the selected block
  const selectedBlock = useMemo(() => {
    if (!selectedNodeId || !blocks[selectedNodeId]) {
      return null
    }
    return blocks[selectedNodeId]
  }, [selectedNodeId, blocks])

  // Get block configuration from registry
  const blockConfig = useMemo(() => {
    if (!selectedBlock) return null
    try {
      return getBlock(selectedBlock.type)
    } catch (error) {
      console.error('Failed to get block config:', error)
      return null
    }
  }, [selectedBlock])

  // Generate docs URL for the selected block
  const docsUrl = useMemo(() => {
    if (!selectedBlock || !blockConfig) return null
    return getBlockDocsUrl(selectedBlock.type, blockConfig.category)
  }, [selectedBlock, blockConfig])

  // Filter subBlocks based on conditions, mode, and visibility
  const visibleSubBlocks = useMemo(() => {
    if (!blockConfig?.subBlocks || !selectedBlock) return []

    const isAdvancedMode = selectedBlock.advancedMode ?? false
    const isTriggerMode = selectedBlock.triggerMode ?? false

    // Get the current state values to evaluate conditions
    const stateToUse = subBlockValues || {}

    // Filter visible blocks based on the same logic as workflow-block
    const filteredSubBlocks = blockConfig.subBlocks.filter((block) => {
      // Skip hidden blocks
      if (block.hidden) return false

      // Special handling for trigger mode
      if (block.type === ('trigger-config' as SubBlockType)) {
        // Show trigger-config blocks when in trigger mode OR for pure trigger blocks
        const isPureTriggerBlock =
          blockConfig?.triggers?.enabled && blockConfig.category === 'triggers'
        return isTriggerMode || isPureTriggerBlock
      }

      if (isTriggerMode && block.type !== ('trigger-config' as SubBlockType)) {
        // In trigger mode, hide all non-trigger-config blocks
        return false
      }

      // Filter by mode if specified
      if (block.mode) {
        if (block.mode === 'basic' && isAdvancedMode) return false
        if (block.mode === 'advanced' && !isAdvancedMode) return false
      }

      // If there's no condition, the block should be shown
      if (!block.condition) return true

      // If condition is a function, call it to get the actual condition object
      const actualCondition =
        typeof block.condition === 'function' ? block.condition() : block.condition

      // Get the values of the fields this block depends on from the state
      const rawField = stateToUse[actualCondition.field]
      const extractedFieldValue =
        rawField != null && typeof rawField === 'object' && 'value' in rawField
          ? rawField.value
          : rawField
      // Treat null/undefined as false for boolean conditions (switches initialize with null)
      const fieldValue =
        extractedFieldValue === null || extractedFieldValue === undefined
          ? typeof actualCondition.value === 'boolean'
            ? false
            : extractedFieldValue
          : extractedFieldValue
      const rawAndField = actualCondition.and ? stateToUse[actualCondition.and.field] : undefined
      const extractedAndValue =
        rawAndField != null && typeof rawAndField === 'object' && 'value' in rawAndField
          ? rawAndField.value
          : rawAndField
      const andFieldValue =
        extractedAndValue === null || extractedAndValue === undefined
          ? actualCondition.and && typeof actualCondition.and.value === 'boolean'
            ? false
            : extractedAndValue
          : extractedAndValue

      // Check if the condition value is an array
      const isValueMatch = Array.isArray(actualCondition.value)
        ? fieldValue != null &&
          (actualCondition.not
            ? !actualCondition.value.includes(fieldValue as string | number | boolean)
            : actualCondition.value.includes(fieldValue as string | number | boolean))
        : actualCondition.not
          ? fieldValue !== actualCondition.value
          : fieldValue === actualCondition.value

      // Check both conditions if 'and' is present
      const isAndValueMatch =
        !actualCondition.and ||
        (Array.isArray(actualCondition.and.value)
          ? andFieldValue != null &&
            (actualCondition.and.not
              ? !actualCondition.and.value.includes(andFieldValue as string | number | boolean)
              : actualCondition.and.value.includes(andFieldValue as string | number | boolean))
          : actualCondition.and.not
            ? andFieldValue !== actualCondition.and.value
            : andFieldValue === actualCondition.and.value)

      return isValueMatch && isAndValueMatch
    })

    return filteredSubBlocks
  }, [blockConfig, selectedBlock, subBlockValues])

  if (!selectedNodeId) {
    return (
      <div className='flex h-full flex-col items-center justify-center bg-transparent px-6 py-8 text-center'>
        {/* Company Logo */}
        <div className='mb-6 flex items-center justify-center'>
          <svg
            width='64'
            height='64'
            viewBox='0 0 100 100'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            className='text-primary'
          >
            <circle cx='50' cy='15' r='4' stroke='currentColor' strokeWidth='5' fill='none' />
            <path
              d='M50 15 L50 40'
              stroke='currentColor'
              strokeWidth='5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M50 40 L35 20'
              stroke='currentColor'
              strokeWidth='5'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
            />
            <path
              d='M50 40 L65 20'
              stroke='currentColor'
              strokeWidth='5'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
            />
            <path
              d='M35 20 L20 45 L20 75 Q20 82 30 85 L50 85'
              stroke='currentColor'
              strokeWidth='5'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
            />
            <path
              d='M65 20 L80 45 L80 75 Q80 82 70 85 L50 85'
              stroke='currentColor'
              strokeWidth='5'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
            />
            <circle cx='40' cy='55' r='4' fill='currentColor' />
            <circle cx='60' cy='55' r='4' fill='currentColor' />
            <path
              d='M40 68 Q50 76 60 68'
              stroke='currentColor'
              strokeWidth='5'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
            />
          </svg>
        </div>

        <h3 className='mb-3 font-medium text-foreground text-lg'>Node Properties</h3>
        <p className='max-w-xs text-muted-foreground text-sm leading-relaxed'>
          Click on any node in your workflow to customize its settings and properties
        </p>

        {/* Visual hint */}
        <div className='mt-6 flex items-center text-muted-foreground text-xs'>
          <div className='mr-2 h-2 w-2 animate-pulse rounded-full bg-primary/100' />
          Select a node to get started
        </div>
      </div>
    )
  }

  if (!selectedBlock || !blockConfig) {
    return (
      <div className='flex h-full flex-col items-center justify-center bg-transparent px-6 py-8 text-center'>
        {/* Same happy logo as no selection state */}
        <div className='mb-6 flex items-center justify-center'>
          <svg
            width='64'
            height='64'
            viewBox='0 0 100 100'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            className='text-primary'
          >
            <circle cx='50' cy='15' r='4' stroke='currentColor' strokeWidth='5' fill='none' />
            <path
              d='M50 15 L50 40'
              stroke='currentColor'
              strokeWidth='5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M50 40 L35 20'
              stroke='currentColor'
              strokeWidth='5'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
            />
            <path
              d='M50 40 L65 20'
              stroke='currentColor'
              strokeWidth='5'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
            />
            <path
              d='M35 20 L20 45 L20 75 Q20 82 30 85 L50 85'
              stroke='currentColor'
              strokeWidth='5'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
            />
            <path
              d='M65 20 L80 45 L80 75 Q80 82 70 85 L50 85'
              stroke='currentColor'
              strokeWidth='5'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
            />
            <circle cx='40' cy='55' r='4' fill='currentColor' />
            <circle cx='60' cy='55' r='4' fill='currentColor' />
            <path
              d='M40 68 Q50 76 60 68'
              stroke='currentColor'
              strokeWidth='5'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
            />
          </svg>
        </div>

        <h3 className='mb-3 font-medium text-foreground text-lg'>Node Properties</h3>
        <p className='max-w-xs text-muted-foreground text-sm leading-relaxed'>
          Please select a node to view its properties and settings here
        </p>

        {/* Action hint */}
        <div className='mt-6 flex items-center text-muted-foreground text-xs'>
          <div className='mr-2 h-2 w-2 animate-pulse rounded-full bg-primary/100' />
          Click on any node to see its properties
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className='h-full bg-transparent' hideScrollbar={true}>
      <div className='space-y-6 px-3 py-4'>
        {/* Node Header */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='font-medium text-base'>{selectedBlock.name}</h2>
            <div className='flex items-center gap-1.5'>
              {docsUrl && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={docsUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='group/docs flex h-6 items-center gap-1 rounded-md border border-border/50 bg-muted/30 px-2 font-medium text-[11px] text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary hover:shadow-sm'
                    >
                      <svg
                        width='12'
                        height='12'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        className='transition-colors'
                      >
                        <path d='M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20' />
                      </svg>
                      <span>Docs</span>
                      <ExternalLink className='h-2.5 w-2.5 opacity-0 transition-opacity group-hover/docs:opacity-100' />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>
                    <span>View {blockConfig.name} documentation</span>
                  </TooltipContent>
                </Tooltip>
              )}
              <Badge variant='secondary' className='border-primary/20 bg-primary/10 text-primary'>
                {blockConfig.name}
              </Badge>
            </div>
          </div>
          {blockConfig.description && (
            <p className='text-muted-foreground text-sm leading-relaxed'>
              {blockConfig.description}
            </p>
          )}

          {/* Advanced Mode Toggle - only show for blocks that have advanced sub-blocks, hide for starter blocks */}
          {selectedBlock.type !== 'starter' && blockConfig.subBlocks?.some((sb) => sb.mode === 'advanced') && (
            <div className='flex items-center justify-between pt-2'>
              <span className='text-muted-foreground text-sm'>Advanced Mode</span>
              <button
                onClick={() => {
                  if (selectedNodeId) {
                    collaborativeToggleBlockAdvancedMode(selectedNodeId)
                  }
                }}
                className={`rounded-md border px-3 py-1.5 text-xs transition-all duration-200 ${
                  selectedBlock.advancedMode
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-border bg-transparent text-muted-foreground hover:border-primary hover:text-foreground'
                }`}
              >
                {selectedBlock.advancedMode ? 'Advanced' : 'Basic'}
              </button>
            </div>
          )}
        </div>

        <Separator />

        {/* Node Properties */}
        <div className='space-y-4'>
          {visibleSubBlocks.map((subBlockConfig, index) => {
            // Create a unique key that incorporates the block ID, subBlock ID, and index
            const uniqueKey = `${selectedNodeId}-${subBlockConfig.id}-${index}`

            return (
              <div key={uniqueKey} className='w-full'>
                <SubBlock
                  key={`${uniqueKey}-subblock`}
                  blockId={selectedNodeId}
                  config={subBlockConfig}
                  isConnecting={false}
                  isPreview={false}
                  subBlockValues={subBlockValues}
                  disabled={false}
                />
              </div>
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
}
