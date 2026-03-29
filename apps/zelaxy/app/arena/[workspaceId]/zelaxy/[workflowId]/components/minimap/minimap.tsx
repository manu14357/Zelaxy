'use client'

import { MiniMap as ReactFlowMiniMap } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { getBlock } from '@/blocks'
import { useExecutionStore } from '@/stores/execution/store'
import { useCurrentWorkflow } from '../../hooks'
import styles from './minimap.module.css'

interface MiniMapProps {
  className?: string
  pannable?: boolean
  zoomable?: boolean
  ariaLabel?: string
}

// Color mapping for different block types
const getNodeColor = (type: string): string => {
  // Get block config to determine category
  const blockConfig = getBlock(type)

  // Special cases for container nodes
  if (type === 'loop' || type === 'loopNode') return '#5DCAA5' // Teal
  if (type === 'parallel' || type === 'parallelNode') return '#F59E0B' // Amber

  // Block category colors based on BlockCategory type
  if (blockConfig?.category) {
    switch (blockConfig.category) {
      case 'triggers':
        return '#6ede87' // Light green for triggers
      case 'tools':
        return '#ff0072' // Pink/magenta for tools
      case 'blocks':
        return '#6865A5' // Purple for blocks
      default:
        return '#6B7280' // Gray for unknown
    }
  }

  // Fallback colors based on block type
  switch (type) {
    case 'starter':
      return '#6ede87' // Light green
    case 'webhook':
      return '#ff0072' // Pink/magenta for webhooks
    case 'schedule':
      return '#6ede87' // Light green for schedules
    case 'response':
      return '#6865A5' // Purple for output
    case 'output':
      return '#6865A5' // Purple for output
    default:
      return '#ff0072' // Default pink/magenta
  }
}

// Enhanced node color function that considers block state
const NodeColorComponent = () => {
  const currentWorkflow = useCurrentWorkflow()
  const { activeBlockIds, pendingBlocks } = useExecutionStore()

  return (node: any) => {
    const block = currentWorkflow.getBlockById(node.id)

    // Handle diff mode coloring (highest priority)
    if (currentWorkflow.isDiffMode && block) {
      const diffStatus = (block as any).is_diff
      if (diffStatus === 'new') return '#6ede87' // Light green for new blocks
      if (diffStatus === 'deleted') return '#ff0072' // Pink/magenta for deleted blocks
      if (diffStatus === 'edited') return '#F59E0B' // Orange for edited blocks
    }

    // Handle execution status (second priority)
    if (activeBlockIds.has(node.id)) {
      return '#6ede87' // Light green for currently executing
    }

    if (pendingBlocks.includes(node.id)) {
      return '#F59E0B' // Orange for pending execution
    }

    // Handle disabled blocks (third priority)
    if (block && !block.enabled) {
      return '#9CA3AF' // Gray for disabled blocks
    }

    // Default color based on type
    return getNodeColor(node.type || 'default')
  }
}

export function MiniMap({
  className,
  pannable = true,
  zoomable = true,
  ariaLabel = 'Workflow MiniMap',
}: MiniMapProps) {
  const currentWorkflow = useCurrentWorkflow()
  const { activeBlockIds, pendingBlocks } = useExecutionStore()

  // Create the nodeColor function with execution state
  const nodeColor = NodeColorComponent()

  // Don't render anything if no blocks exist
  if (!currentWorkflow.hasBlocks()) {
    return null
  }

  // Helper function to detect dark theme
  const isDarkTheme = () => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  }

  return (
    <ReactFlowMiniMap
      nodeColor={nodeColor}
      nodeStrokeColor={(node) => {
        // Add stroke for better visibility with theme awareness
        const block = currentWorkflow.getBlockById(node.id)
        const isDark = isDarkTheme()

        if (currentWorkflow.isDiffMode && block) {
          const diffStatus = (block as any)?.is_diff
          if (diffStatus === 'new') return '#5cc46a' // Darker shade of light green
          if (diffStatus === 'deleted') return '#cc0055' // Darker shade of pink/magenta
          if (diffStatus === 'edited') return '#D97706' // Keep orange for edited
        }
        return isDark ? '#374151' : '#1f2937' // Theme-aware stroke color
      }}
      nodeStrokeWidth={1}
      nodeBorderRadius={8}
      maskColor={isDarkTheme() ? 'rgba(249, 115, 22, 0.04)' : 'rgba(249, 115, 22, 0.06)'}
      maskStrokeColor='#fb923c'
      maskStrokeWidth={1.5}
      pannable={pannable}
      zoomable={zoomable}
      ariaLabel={ariaLabel}
      className={cn(styles.minimapContainer, className)}
    />
  )
}
