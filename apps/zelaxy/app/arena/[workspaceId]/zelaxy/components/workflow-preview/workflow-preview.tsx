'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeTypes,
  ReactFlow,
  type ReactFlowInstance,
  ReactFlowProvider,
} from '@xyflow/react'
import { cloneDeep } from 'lodash'
import '@xyflow/react/dist/style.css'

import { createLogger } from '@/lib/logs/console/logger'
import { cn } from '@/lib/utils'
import { LoopNodeComponent } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/subflows/loop/loop-node'
import { ParallelNodeComponent } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/subflows/parallel/parallel-node'
import { WorkflowBlock } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-block/workflow-block'
import { WorkflowEdge } from '@/app/arena/[workspaceId]/zelaxy/[workflowId]/components/workflow-edge/workflow-edge'
import { getBlock } from '@/blocks'
import type { WorkflowState } from '@/stores/workflows/workflow/types'

const logger = createLogger('WorkflowPreview')

interface WorkflowPreviewProps {
  workflowState: WorkflowState
  showSubBlocks?: boolean
  className?: string
  height?: string | number
  width?: string | number
  isPannable?: boolean
  defaultPosition?: { x: number; y: number }
  defaultZoom?: number
  onNodeClick?: (blockId: string, mousePosition: { x: number; y: number }) => void
  /** When true, reveal blocks one-by-one (in build order) the first time a workflow appears — the
   * canvas stays fit to the full layout (nodes are hidden, not absent) so nothing jumps. */
  animateReveal?: boolean
}

// Define node types - the components now handle preview mode internally
const nodeTypes: NodeTypes = {
  workflowBlock: WorkflowBlock,
  loopNode: LoopNodeComponent,
  parallelNode: ParallelNodeComponent,
}

// Define edge types
const edgeTypes: EdgeTypes = {
  workflowEdge: WorkflowEdge,
}

export function WorkflowPreview({
  workflowState,
  showSubBlocks = true,
  height = '100%',
  width = '100%',
  isPannable = false,
  defaultPosition,
  defaultZoom,
  onNodeClick,
  animateReveal = false,
}: WorkflowPreviewProps) {
  // Resolve dark mode for ReactFlow colorMode
  const [resolvedColorMode, setResolvedColorMode] = useState<'light' | 'dark'>('light')
  useEffect(() => {
    const root = document.documentElement
    const update = () => setResolvedColorMode(root.classList.contains('dark') ? 'dark' : 'light')
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Check if the workflow state is valid
  const isValidWorkflowState = workflowState?.blocks && workflowState.edges

  const blocksStructure = useMemo(() => {
    if (!isValidWorkflowState) return { count: 0, ids: '' }
    return {
      count: Object.keys(workflowState.blocks || {}).length,
      ids: Object.keys(workflowState.blocks || {}).join(','),
    }
  }, [workflowState.blocks, isValidWorkflowState])

  const loopsStructure = useMemo(() => {
    if (!isValidWorkflowState) return { count: 0, ids: '' }
    return {
      count: Object.keys(workflowState.loops || {}).length,
      ids: Object.keys(workflowState.loops || {}).join(','),
    }
  }, [workflowState.loops, isValidWorkflowState])

  const parallelsStructure = useMemo(() => {
    if (!isValidWorkflowState) return { count: 0, ids: '' }
    return {
      count: Object.keys(workflowState.parallels || {}).length,
      ids: Object.keys(workflowState.parallels || {}).join(','),
    }
  }, [workflowState.parallels, isValidWorkflowState])

  const edgesStructure = useMemo(() => {
    if (!isValidWorkflowState) return { count: 0, ids: '' }
    return {
      count: workflowState.edges?.length || 0,
      ids: workflowState.edges?.map((e) => e.id).join(',') || '',
    }
  }, [workflowState.edges, isValidWorkflowState])

  const calculateAbsolutePosition = (
    block: any,
    blocks: Record<string, any>
  ): { x: number; y: number } => {
    if (!block.data?.parentId) {
      return block.position
    }

    const parentBlock = blocks[block.data.parentId]
    if (!parentBlock) {
      logger.warn(`Parent block not found for child block: ${block.id}`)
      return block.position
    }

    const parentAbsolutePosition = calculateAbsolutePosition(parentBlock, blocks)

    return {
      x: parentAbsolutePosition.x + block.position.x,
      y: parentAbsolutePosition.y + block.position.y,
    }
  }

  const nodes: Node[] = useMemo(() => {
    if (!isValidWorkflowState) return []

    const nodeArray: Node[] = []

    Object.entries(workflowState.blocks || {}).forEach(([blockId, block]) => {
      if (!block || !block.type) {
        logger.warn(`Skipping invalid block: ${blockId}`)
        return
      }

      const absolutePosition = calculateAbsolutePosition(block, workflowState.blocks)

      if (block.type === 'loop') {
        nodeArray.push({
          id: block.id,
          type: 'loopNode',
          position: absolutePosition,
          extent: block.data?.extent || undefined,
          draggable: false,
          data: {
            ...block.data,
            width: block.data?.width || 500,
            height: block.data?.height || 300,
            state: 'valid',
            isPreview: true,
          },
        })
        return
      }

      if (block.type === 'parallel') {
        nodeArray.push({
          id: block.id,
          type: 'parallelNode',
          position: absolutePosition,
          extent: block.data?.extent || undefined,
          draggable: false,
          data: {
            ...block.data,
            width: block.data?.width || 500,
            height: block.data?.height || 300,
            state: 'valid',
            isPreview: true,
          },
        })
        return
      }

      const blockConfig = getBlock(block.type)
      if (!blockConfig) {
        logger.error(`No configuration found for block type: ${block.type}`, { blockId })
        return
      }

      const subBlocksClone = block.subBlocks ? cloneDeep(block.subBlocks) : {}

      nodeArray.push({
        id: blockId,
        type: 'workflowBlock',
        position: absolutePosition,
        draggable: false,
        data: {
          type: block.type,
          config: blockConfig,
          name: block.name,
          blockState: block,
          canEdit: false,
          isPreview: true,
          subBlockValues: subBlocksClone,
        },
      })

      if (block.type === 'loop') {
        const childBlocks = Object.entries(workflowState.blocks || {}).filter(
          ([_, childBlock]) => childBlock.data?.parentId === blockId
        )

        childBlocks.forEach(([childId, childBlock]) => {
          const childConfig = getBlock(childBlock.type)

          if (childConfig) {
            nodeArray.push({
              id: childId,
              type: 'workflowBlock',
              position: {
                x: block.position.x + 50,
                y: block.position.y + (childBlock.position?.y || 100),
              },
              data: {
                type: childBlock.type,
                config: childConfig,
                name: childBlock.name,
                blockState: childBlock,
                showSubBlocks,
                isChild: true,
                parentId: blockId,
                canEdit: false,
                isPreview: true,
              },
              draggable: false,
            })
          }
        })
      }
    })

    return nodeArray
  }, [
    blocksStructure,
    loopsStructure,
    parallelsStructure,
    showSubBlocks,
    workflowState.blocks,
    isValidWorkflowState,
  ])

  const edges: Edge[] = useMemo(() => {
    if (!isValidWorkflowState) return []

    return (workflowState.edges || []).map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: 'workflowEdge',
    }))
  }, [edgesStructure, workflowState.edges, isValidWorkflowState])

  // Block-by-block reveal: grow `revealCount` from 0 → all over the first appearance, then settle.
  // Replays whenever the block set changes (a fresh build).
  const totalNodes = nodes.length
  const [revealCount, setRevealCount] = useState(animateReveal ? 0 : Number.POSITIVE_INFINITY)
  useEffect(() => {
    if (!animateReveal) {
      setRevealCount(Number.POSITIVE_INFINITY)
      return
    }
    setRevealCount(0)
    if (totalNodes === 0) return
    let i = 0
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      i += 1
      setRevealCount(i)
      if (i < totalNodes) timer = setTimeout(tick, 130)
    }
    timer = setTimeout(tick, 130)
    return () => clearTimeout(timer)
    // Replay the reveal only when the block set changes (a fresh build), not on every render.
  }, [animateReveal, totalNodes, blocksStructure.ids])

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    // Delay fitView to ensure nodes are measured in the DOM. `minZoom` stops a long workflow from
    // shrinking to an unreadable hairline — it fits as much as it can at ≥0.55 scale (blocks stay
    // legible) and the user pans to see the rest; `maxZoom` lets a tiny 1–2 block flow zoom IN.
    // `includeHiddenNodes` keeps the view fit to the FULL layout during the block-by-block reveal.
    requestAnimationFrame(() => {
      instance.fitView({
        padding: 0.18,
        duration: 300,
        minZoom: 0.55,
        maxZoom: 1.25,
        includeHiddenNodes: true,
      })
    })
  }, [])

  // Handle migrated logs that don't have complete workflow state
  if (!isValidWorkflowState) {
    return (
      <div
        style={{ height, width }}
        className='flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
      >
        <div className='text-center text-gray-500 dark:text-gray-400'>
          <div className='mb-2 font-medium text-lg'>⚠️ Logged State Not Found</div>
          <div className='text-sm'>
            This log was migrated from the old system and doesn't contain workflow state data.
          </div>
        </div>
      </div>
    )
  }

  // During the reveal, hide (not remove) the not-yet-revealed blocks + their edges so the canvas
  // stays fit to the full layout and blocks simply pop in one after another.
  const revealing = animateReveal && revealCount < totalNodes
  const displayNodes = revealing
    ? nodes.map((n, i) => (i < revealCount ? n : { ...n, hidden: true }))
    : nodes
  const revealedIds = revealing ? new Set(nodes.slice(0, revealCount).map((n) => n.id)) : null
  const displayEdges = revealedIds
    ? edges.map((e) =>
        revealedIds.has(e.source) && revealedIds.has(e.target) ? e : { ...e, hidden: true }
      )
    : edges

  return (
    <ReactFlowProvider>
      <div style={{ height, width }} className={cn('preview-mode')}>
        <ReactFlow
          colorMode={resolvedColorMode}
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineType={ConnectionLineType.Step}
          connectionLineStyle={{
            stroke: '#f97316',
            strokeWidth: 2,
            strokeDasharray: '6,6',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }}
          fitView
          fitViewOptions={{
            padding: 0.18,
            minZoom: 0.55,
            maxZoom: 1.25,
            includeHiddenNodes: true,
          }}
          onInit={handleInit}
          panOnScroll={false}
          panOnDrag={isPannable}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          preventScrolling={true}
          draggable={false}
          minZoom={0.05}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          elementsSelectable={false}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={
            onNodeClick
              ? (event, node) => {
                  logger.debug('Node clicked:', { nodeId: node.id, event })
                  onNodeClick(node.id, { x: event.clientX, y: event.clientY })
                }
              : undefined
          }
        >
          <Background
            id='preview-dots-small'
            variant={BackgroundVariant.Dots}
            color='hsl(var(--workflow-dots))'
            size={1}
            gap={20}
            style={{
              backgroundColor: 'hsl(var(--workflow-background))',
            }}
          />
          {/* Secondary larger dots for visual depth */}
          <Background
            id='preview-dots-large'
            variant={BackgroundVariant.Dots}
            color='hsl(var(--workflow-dots))'
            size={1.8}
            gap={100}
            style={{
              opacity: 0.4,
            }}
          />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  )
}
