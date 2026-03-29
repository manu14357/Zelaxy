import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Filter, Search, X } from 'lucide-react'
import { extractFieldsFromSchema, parseResponseFormatSafely } from '@/lib/response-format'
import { cn } from '@/lib/utils'
import { getBlock } from '@/blocks'
import { useWorkflowDiffStore } from '@/stores/workflow-diff/store'
import { useSubBlockStore } from '@/stores/workflows/subblock/store'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'

interface OutputSelectProps {
  workflowId: string | null
  selectedOutputs: string[]
  onOutputSelect: (outputIds: string[]) => void
  disabled?: boolean
  placeholder?: string
}

export function OutputSelect({
  workflowId,
  selectedOutputs = [],
  onOutputSelect,
  disabled = false,
  placeholder = 'Select output sources',
}: OutputSelectProps) {
  const [isOutputDropdownOpen, setIsOutputDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const blocks = useWorkflowStore((state) => state.blocks)
  const { isShowingDiff, isDiffReady, diffWorkflow } = useWorkflowDiffStore()

  // Track subblock store state to ensure proper reactivity
  const subBlockValues = useSubBlockStore((state) =>
    workflowId ? state.workflowValues[workflowId] : null
  )

  // Use diff blocks when in diff mode AND diff is ready, otherwise use main blocks
  const workflowBlocks = isShowingDiff && isDiffReady && diffWorkflow ? diffWorkflow.blocks : blocks

  // Get workflow outputs for the dropdown
  const workflowOutputs = useMemo(() => {
    const outputs: {
      id: string
      label: string
      blockId: string
      blockName: string
      blockType: string
      path: string
    }[] = []

    if (!workflowId) return outputs

    // Check if workflowBlocks is defined
    if (!workflowBlocks || typeof workflowBlocks !== 'object') {
      return outputs
    }

    // Check if we actually have blocks to process
    const blockArray = Object.values(workflowBlocks)
    if (blockArray.length === 0) {
      return outputs
    }

    // Process blocks to extract outputs
    blockArray.forEach((block) => {
      // Skip starter/start blocks
      if (block.type === 'starter') return

      // Add defensive check to ensure block exists and has required properties
      if (!block || !block.id || !block.type) {
        return
      }

      // Add defensive check to ensure block.name exists and is a string
      const blockName =
        block.name && typeof block.name === 'string'
          ? block.name.replace(/\s+/g, '').toLowerCase()
          : `block-${block.id}`

      // Get block configuration from registry to get outputs
      const blockConfig = getBlock(block.type)

      // Check for custom response format first
      // In diff mode, get value from diff blocks; otherwise use store
      const responseFormatValue =
        isShowingDiff && isDiffReady && diffWorkflow
          ? diffWorkflow.blocks[block.id]?.subBlocks?.responseFormat?.value
          : subBlockValues?.[block.id]?.responseFormat
      const responseFormat = parseResponseFormatSafely(responseFormatValue, block.id)

      let outputsToProcess: Record<string, any> = {}

      if (responseFormat) {
        // Use custom schema properties if response format is specified
        const schemaFields = extractFieldsFromSchema(responseFormat)
        if (schemaFields.length > 0) {
          // Convert schema fields to output structure
          schemaFields.forEach((field) => {
            outputsToProcess[field.name] = { type: field.type }
          })
        } else {
          // Fallback to block config outputs if schema extraction failed
          outputsToProcess = blockConfig?.outputs || {}
        }
      } else {
        // Use block config outputs instead of block.outputs
        outputsToProcess = blockConfig?.outputs || {}
      }

      // Add response outputs
      if (Object.keys(outputsToProcess).length > 0) {
        const addOutput = (path: string, outputObj: any, prefix = '') => {
          const fullPath = prefix ? `${prefix}.${path}` : path

          // If not an object or is null, treat as leaf node
          if (typeof outputObj !== 'object' || outputObj === null) {
            const output = {
              id: `${block.id}_${fullPath}`,
              label: `${blockName}.${fullPath}`,
              blockId: block.id,
              blockName: block.name || `Block ${block.id}`,
              blockType: block.type,
              path: fullPath,
            }
            outputs.push(output)
            return
          }

          // If has 'type' property, treat as schema definition (leaf node)
          if ('type' in outputObj && typeof outputObj.type === 'string') {
            const output = {
              id: `${block.id}_${fullPath}`,
              label: `${blockName}.${fullPath}`,
              blockId: block.id,
              blockName: block.name || `Block ${block.id}`,
              blockType: block.type,
              path: fullPath,
            }
            outputs.push(output)
            return
          }

          // For objects without type, recursively add each property
          if (!Array.isArray(outputObj)) {
            Object.entries(outputObj).forEach(([key, value]) => {
              addOutput(key, value, fullPath)
            })
          } else {
            // For arrays, treat as leaf node
            outputs.push({
              id: `${block.id}_${fullPath}`,
              label: `${blockName}.${fullPath}`,
              blockId: block.id,
              blockName: block.name || `Block ${block.id}`,
              blockType: block.type,
              path: fullPath,
            })
          }
        }

        // Process all output properties directly (flattened structure)
        Object.entries(outputsToProcess).forEach(([key, value]) => {
          addOutput(key, value)
        })
      }
    })

    return outputs
  }, [workflowBlocks, workflowId, isShowingDiff, isDiffReady, diffWorkflow, blocks, subBlockValues])

  // Get selected outputs display text
  const selectedOutputsDisplayText = useMemo(() => {
    if (!selectedOutputs || selectedOutputs.length === 0) {
      return placeholder
    }

    // Ensure all selected outputs exist in the workflowOutputs array
    const validOutputs = selectedOutputs.filter((id) => workflowOutputs.some((o) => o.id === id))

    if (validOutputs.length === 0) {
      return placeholder
    }

    if (validOutputs.length === 1) {
      const output = workflowOutputs.find((o) => o.id === validOutputs[0])
      if (output) {
        // Add defensive check for output.blockName
        const blockNameText =
          output.blockName && typeof output.blockName === 'string'
            ? output.blockName.replace(/\s+/g, '').toLowerCase()
            : `block-${output.blockId}`
        return `${blockNameText}.${output.path}`
      }
      return placeholder
    }

    return `${validOutputs.length} outputs selected`
  }, [selectedOutputs, workflowOutputs, placeholder])

  // Get first selected output info for display icon
  const selectedOutputInfo = useMemo(() => {
    if (!selectedOutputs || selectedOutputs.length === 0) return null

    const validOutputs = selectedOutputs.filter((id) => workflowOutputs.some((o) => o.id === id))
    if (validOutputs.length === 0) return null

    const output = workflowOutputs.find((o) => o.id === validOutputs[0])
    if (!output) return null

    return {
      blockName: output.blockName,
      blockId: output.blockId,
      blockType: output.blockType,
      path: output.path,
    }
  }, [selectedOutputs, workflowOutputs])

  // Filter and group output options by block
  const { groupedOutputs, availableBlocks } = useMemo(() => {
    const groups: Record<string, typeof workflowOutputs> = {}
    const blockDistances: Record<string, number> = {}
    const edges = useWorkflowStore.getState().edges

    // Find the starter block
    const starterBlock = Object.values(blocks).find((block) => block.type === 'starter')
    const starterBlockId = starterBlock?.id

    // Calculate distances from starter block if it exists
    if (starterBlockId) {
      // Build an adjacency list for faster traversal
      const adjList: Record<string, string[]> = {}
      for (const edge of edges) {
        if (!adjList[edge.source]) {
          adjList[edge.source] = []
        }
        adjList[edge.source].push(edge.target)
      }

      // BFS to find distances from starter block
      const visited = new Set<string>()
      const queue: [string, number][] = [[starterBlockId, 0]] // [nodeId, distance]

      while (queue.length > 0) {
        const [currentNodeId, distance] = queue.shift()!

        if (visited.has(currentNodeId)) continue
        visited.add(currentNodeId)
        blockDistances[currentNodeId] = distance

        // Get all outgoing edges from the adjacency list
        const outgoingNodeIds = adjList[currentNodeId] || []

        // Add all target nodes to the queue with incremented distance
        for (const targetId of outgoingNodeIds) {
          queue.push([targetId, distance + 1])
        }
      }
    }

    // Filter outputs based on search query and block filter
    const filteredOutputs = workflowOutputs.filter((output) => {
      const matchesSearch =
        searchQuery === '' ||
        output.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        output.blockName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesBlockFilter =
        selectedBlockFilter === null || output.blockName === selectedBlockFilter

      return matchesSearch && matchesBlockFilter
    })

    // Group filtered outputs by block name
    filteredOutputs.forEach((output) => {
      if (!groups[output.blockName]) {
        groups[output.blockName] = []
      }
      groups[output.blockName].push(output)
    })

    // Get available block names for filter
    const availableBlockNames = [...new Set(workflowOutputs.map((output) => output.blockName))]

    // Convert to array of [blockName, outputs] for sorting
    const groupsArray = Object.entries(groups).map(([blockName, outputs]) => {
      // Find the blockId for this group (using the first output's blockId)
      const blockId = outputs[0]?.blockId
      // Get the distance for this block (or default to 0 if not found)
      const distance = blockId ? blockDistances[blockId] || 0 : 0
      return { blockName, outputs, distance }
    })

    // Sort by distance (descending - furthest first)
    groupsArray.sort((a, b) => b.distance - a.distance)

    // Convert back to record
    const finalGroups = groupsArray.reduce(
      (acc, { blockName, outputs }) => {
        acc[blockName] = outputs
        return acc
      },
      {} as Record<string, typeof workflowOutputs>
    )

    return {
      groupedOutputs: finalGroups,
      availableBlocks: availableBlockNames,
    }
  }, [workflowOutputs, blocks, searchQuery, selectedBlockFilter])

  // Get block configuration for an output
  const getBlockConfig = (blockType: string) => {
    return getBlock(blockType)
  }

  // Get block color for an output
  const getOutputColor = (blockId: string, blockType: string) => {
    const blockConfig = getBlockConfig(blockType)
    return blockConfig?.bgColor || '#EA580C' // Default blue if not found
  }

  // Get block icon component for an output
  const getBlockIcon = (blockType: string) => {
    const blockConfig = getBlockConfig(blockType)
    return blockConfig?.icon
  }

  // Helper function to render block icon with fallback
  const renderBlockIcon = (blockType: string, className = 'h-4 w-4') => {
    const IconComponent = getBlockIcon(blockType)
    if (IconComponent) {
      return React.createElement(IconComponent, { className })
    }
    // Fallback to letter icon
    return (
      <div className={`${className} flex items-center justify-center rounded-sm bg-primary`}>
        <span className='font-bold text-[10px] text-white'>
          {blockType.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  // Helper function to remove a selected output
  const removeSelectedOutput = (outputId: string) => {
    const newSelectedOutputs = selectedOutputs.filter((id) => id !== outputId)
    onOutputSelect(newSelectedOutputs)
  }

  // Helper function to clear all selections
  const clearAllSelections = () => {
    onOutputSelect([])
  }

  // Helper function to clear search and filters
  const clearSearchAndFilters = () => {
    setSearchQuery('')
    setSelectedBlockFilter(null)
  }

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOutputDropdownOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOutputDropdownOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOutputDropdownOpen(false)
        clearSearchAndFilters()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle output selection - toggle selection
  const handleOutputSelection = (value: string) => {
    let newSelectedOutputs: string[]
    const index = selectedOutputs.indexOf(value)

    if (index === -1) {
      newSelectedOutputs = [...new Set([...selectedOutputs, value])]
    } else {
      newSelectedOutputs = selectedOutputs.filter((id) => id !== value)
    }

    onOutputSelect(newSelectedOutputs)
  }

  return (
    <div className='relative w-full' ref={dropdownRef}>
      {/* Main Input Area with Selected Tags */}
      <div
        className={cn(
          'min-h-[36px] w-full rounded-lg border bg-background/80 px-2.5 py-2 transition-all duration-200',
          'focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 hover:border-border',
          isOutputDropdownOpen && 'border-primary/50 ring-1 ring-primary/20',
          disabled && 'cursor-not-allowed opacity-50',
          'border-border/50'
        )}
      >
        {/* Selected Output Tags */}
        {selectedOutputs.length > 0 && (
          <div className='mb-1.5 flex min-w-0 flex-wrap gap-1'>
            {selectedOutputs.map((outputId) => {
              const output = workflowOutputs.find((o) => o.id === outputId)
              if (!output) return null

              return (
                <div
                  key={outputId}
                  className='group inline-flex min-w-0 items-center gap-1 rounded-md border border-primary/20 bg-primary/100/8 px-1.5 py-0.5 font-medium text-[11px] text-primary dark:text-primary/70'
                >
                  {renderBlockIcon(output.blockType, 'h-3 w-3 flex-shrink-0')}
                  <span className='min-w-0 max-w-[100px] truncate'>
                    {output.blockName}.{output.path}
                  </span>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSelectedOutput(outputId)
                    }}
                    className='ml-0.5 rounded p-0.5 text-primary/60 transition-colors hover:bg-primary/100/15 hover:text-primary'
                    disabled={disabled}
                    title={`Remove ${output.blockName}.${output.path}`}
                    aria-label={`Remove ${output.blockName}.${output.path}`}
                  >
                    <X className='h-2.5 w-2.5' />
                  </button>
                </div>
              )
            })}
            {selectedOutputs.length > 0 && (
              <button
                type='button'
                onClick={clearAllSelections}
                className='inline-flex items-center gap-0.5 rounded-md border border-red-500/15 bg-red-500/8 px-1.5 py-0.5 font-medium text-[11px] text-red-600 transition-colors hover:bg-red-500/15 dark:text-red-400'
                disabled={disabled}
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Search Input and Toggle Button */}
        <div className='flex items-center gap-2'>
          <div className='flex flex-1 items-center gap-1.5'>
            <Search className='h-3.5 w-3.5 text-muted-foreground/50' />
            <input
              ref={searchInputRef}
              type='text'
              placeholder={selectedOutputs.length === 0 ? placeholder : 'Search outputs...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsOutputDropdownOpen(true)}
              className='flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/40'
              disabled={disabled || workflowOutputs.length === 0}
            />
          </div>
          <div className='flex items-center gap-0.5'>
            {selectedBlockFilter && (
              <button
                type='button'
                onClick={() => setSelectedBlockFilter(null)}
                className='inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/30 px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground transition-colors hover:bg-muted/50'
              >
                <Filter className='h-2.5 w-2.5' />
                {selectedBlockFilter}
                <X className='h-2.5 w-2.5' />
              </button>
            )}
            <button
              type='button'
              onClick={() => setIsOutputDropdownOpen(!isOutputDropdownOpen)}
              className='rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-accent/60 hover:text-muted-foreground'
              disabled={workflowOutputs.length === 0 || disabled}
              title={isOutputDropdownOpen ? 'Close output selector' : 'Open output selector'}
              aria-label={isOutputDropdownOpen ? 'Close output selector' : 'Open output selector'}
            >
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  isOutputDropdownOpen && 'rotate-180'
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Dropdown with Search and Filters */}
      {isOutputDropdownOpen && workflowOutputs.length > 0 && (
        <div className='absolute right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-lg border border-border/60 bg-popover/95 shadow-lg backdrop-blur-sm'>
          {/* Filter Header */}
          <div className='border-border/40 border-b bg-muted/20 px-2.5 py-1.5'>
            <div className='flex items-center justify-between'>
              <span className='font-medium text-[11px] text-muted-foreground/70'>
                {Object.keys(groupedOutputs).length} blocks ·{' '}
                {Object.values(groupedOutputs).flat().length} outputs
              </span>
              <div className='flex items-center gap-1'>
                {availableBlocks.slice(0, 3).map((blockName) => (
                  <button
                    key={blockName}
                    type='button'
                    onClick={() =>
                      setSelectedBlockFilter(selectedBlockFilter === blockName ? null : blockName)
                    }
                    className={cn(
                      'rounded-md px-1.5 py-0.5 font-medium text-[10px] transition-all duration-150',
                      selectedBlockFilter === blockName
                        ? 'bg-primary/100 text-white shadow-sm'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
                    )}
                  >
                    {blockName}
                  </button>
                ))}
                {availableBlocks.length > 3 && (
                  <span className='text-[10px] text-muted-foreground/50'>
                    +{availableBlocks.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className='max-h-56 overflow-y-auto'>
            {Object.keys(groupedOutputs).length === 0 ? (
              <div className='px-3 py-6 text-center text-[12px] text-muted-foreground/60'>
                No outputs match your search
              </div>
            ) : (
              Object.entries(groupedOutputs).map(([blockName, outputs]) => (
                <div key={blockName} className='border-border/30 border-b last:border-b-0'>
                  <div className='flex items-center justify-between bg-muted/10 px-2.5 py-1.5'>
                    <span className='font-semibold text-[11px] text-muted-foreground/70 tracking-tight'>
                      {blockName}
                      <span className='ml-1 font-normal text-muted-foreground/40'>
                        ({outputs.length})
                      </span>
                    </span>
                    <button
                      type='button'
                      onClick={() => {
                        const blockOutputIds = outputs.map((o) => o.id)
                        const allSelected = blockOutputIds.every((id) =>
                          selectedOutputs.includes(id)
                        )

                        if (allSelected) {
                          const newSelection = selectedOutputs.filter(
                            (id) => !blockOutputIds.includes(id)
                          )
                          onOutputSelect(newSelection)
                        } else {
                          const newSelection = [...new Set([...selectedOutputs, ...blockOutputIds])]
                          onOutputSelect(newSelection)
                        }
                      }}
                      className='font-medium text-[10px] text-primary transition-colors hover:text-primary'
                    >
                      {outputs.every((o) => selectedOutputs.includes(o.id))
                        ? 'Deselect all'
                        : 'Select all'}
                    </button>
                  </div>
                  <div className='p-0.5'>
                    {outputs.map((output) => (
                      <button
                        key={output.id}
                        type='button'
                        onClick={() => handleOutputSelection(output.id)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] transition-all duration-150',
                          'hover:bg-accent/60 focus:bg-accent/60 focus:outline-none',
                          selectedOutputs.includes(output.id) &&
                            'bg-primary/100/5 text-primary dark:text-primary/70'
                        )}
                      >
                        {renderBlockIcon(output.blockType, 'h-3.5 w-3.5 flex-shrink-0')}
                        <span className='flex-1 truncate text-left font-medium'>{output.path}</span>
                        {selectedOutputs.includes(output.id) && (
                          <Check className='h-3.5 w-3.5 flex-shrink-0 text-primary' />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
