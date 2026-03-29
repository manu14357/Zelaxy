import { useEffect } from 'react'
import { EdgeLabelRenderer, type EdgeProps, getSmoothStepPath } from '@xyflow/react'
import { X } from 'lucide-react'
import { useWorkflowDiffStore } from '@/stores/workflow-diff'
import { useCurrentWorkflow } from '../../hooks'

interface WorkflowEdgeProps extends EdgeProps {
  sourceHandle?: string | null
  targetHandle?: string | null
}

export const WorkflowEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  source,
  target,
  sourceHandle,
  targetHandle,
}: WorkflowEdgeProps) => {
  const isHorizontal = sourcePosition === 'right' || sourcePosition === 'left'

  // Softly rounded step paths for clean, modern appearance
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12, // Smooth rounded corners
    offset: 20, // Distance before first turn
  })

  // Use the directly provided isSelected flag instead of computing it
  const isSelected = data?.isSelected ?? false
  const isInsideLoop = data?.isInsideLoop ?? false
  const parentLoopId = data?.parentLoopId

  // Get edge diff status
  const diffAnalysis = useWorkflowDiffStore((state) => state.diffAnalysis)
  const isShowingDiff = useWorkflowDiffStore((state) => state.isShowingDiff)
  const isDiffReady = useWorkflowDiffStore((state) => state.isDiffReady)
  const currentWorkflow = useCurrentWorkflow()

  // Generate edge identifier using block IDs to match diff analysis from zelaxy agent
  // This must exactly match the logic used by the zelaxy agent diff analysis
  const generateEdgeIdentity = (
    sourceId: string,
    targetId: string,
    sourceHandle?: string | null,
    targetHandle?: string | null
  ): string => {
    // The zelaxy agent generates edge identifiers in the format: sourceId-source-targetId-target
    return `${sourceId}-source-${targetId}-target`
  }

  // Generate edge identifier using the exact same logic as the zelaxy agent
  const edgeIdentifier = generateEdgeIdentity(source, target, sourceHandle, targetHandle)

  // Debug logging to understand what's happening
  useEffect(() => {
    if (edgeIdentifier && diffAnalysis?.edge_diff) {
    }
  }, [
    edgeIdentifier,
    diffAnalysis,
    isShowingDiff,
    id,
    sourceHandle,
    targetHandle,
    source,
    target,
    currentWorkflow.isDiffMode,
  ])

  // One-time debug log of full diff analysis
  useEffect(() => {
    if (diffAnalysis && id === Object.keys(currentWorkflow.blocks)[0]) {
      // Only log once per diff
    }
  }, [diffAnalysis, id, currentWorkflow.blocks, currentWorkflow.edges, isShowingDiff])

  // Determine edge diff status
  let edgeDiffStatus: 'new' | 'deleted' | 'unchanged' | null = null

  // Only attempt to determine diff status if all required data is available
  if (diffAnalysis?.edge_diff && edgeIdentifier && isDiffReady) {
    if (isShowingDiff) {
      // In diff view, show new edges
      if (diffAnalysis.edge_diff.new_edges.includes(edgeIdentifier)) {
        edgeDiffStatus = 'new'
      } else if (diffAnalysis.edge_diff.unchanged_edges.includes(edgeIdentifier)) {
        edgeDiffStatus = 'unchanged'
      }
    } else {
      // In original workflow, show deleted edges
      if (diffAnalysis.edge_diff.deleted_edges.includes(edgeIdentifier)) {
        edgeDiffStatus = 'deleted'
      }
    }
  }

  // Merge any style props passed from parent with diff highlighting
  const getEdgeColor = () => {
    if (edgeDiffStatus === 'new') return '#22c55e' // Green for new edges
    if (edgeDiffStatus === 'deleted') return '#ef4444' // Red for deleted edges
    if (isSelected) return '#f97316' // Primary orange for selected
    return '#8b95a8' // Clear slate, visible on white canvas
  }

  const getGradientId = () => `edge-gradient-${id}`

  const edgeStyle = {
    strokeWidth: edgeDiffStatus ? 2.5 : isSelected ? 2.5 : 1.8,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    filter: isSelected
      ? 'drop-shadow(0 0 6px rgba(249,115,22,0.3))'
      : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))',
    opacity: edgeDiffStatus === 'deleted' ? 0.55 : 1,
    ...style,
  }

  return (
    <>
      {/* Define gradients and animations */}
      <defs>
        <linearGradient id={getGradientId()} x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor={getEdgeColor()} stopOpacity='0.6' />
          <stop offset='50%' stopColor={getEdgeColor()} stopOpacity='1' />
          <stop offset='100%' stopColor={getEdgeColor()} stopOpacity='0.6' />
        </linearGradient>
      </defs>

      {/* Dedicated hit-area path for reliable edge selection */}
      <path
        d={edgePath}
        stroke='transparent'
        strokeWidth='32'
        fill='none'
        className='workflow-edge-interaction'
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (data?.onSelect) {
            ;(data.onSelect as () => void)()
          }
        }}
      />

      {/* Main edge path - smooth rounded corners */}
      <path
        id={`path-${id}`}
        d={edgePath}
        data-testid='workflow-edge'
        strokeWidth={edgeStyle.strokeWidth}
        stroke={getEdgeColor()}
        fill='none'
        strokeLinecap={edgeStyle.strokeLinecap as 'round' | 'butt' | 'square'}
        strokeLinejoin={edgeStyle.strokeLinejoin as 'round' | 'bevel' | 'miter'}
        filter={edgeStyle.filter}
        opacity={edgeStyle.opacity}
        data-edge-id={id}
        data-parent-loop-id={parentLoopId}
        data-is-selected={isSelected ? 'true' : 'false'}
        data-is-inside-loop={isInsideLoop ? 'true' : 'false'}
        className='transition-[stroke,stroke-width,opacity,filter] duration-200'
        style={{ pointerEvents: 'none' }}
      />

      {/* Animated flowing dashes — subtle marching ants */}
      <path
        d={edgePath}
        stroke='rgba(255,255,255,0.85)'
        strokeWidth='1.2'
        fill='none'
        strokeLinecap='round'
        strokeDasharray='4 8'
        opacity={isSelected ? '0.7' : '0.4'}
        className='transition-opacity duration-200'
        style={{ pointerEvents: 'none' }}
      >
        <animate
          attributeName='stroke-dashoffset'
          values='0;-12'
          dur='0.8s'
          repeatCount='indefinite'
        />
      </path>

      {/* Wide soft glow when selected */}
      {isSelected && (
        <path
          d={edgePath}
          stroke={getEdgeColor()}
          strokeWidth='8'
          fill='none'
          strokeLinecap='round'
          strokeLinejoin='round'
          opacity='0.1'
          className='transition-opacity duration-200'
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Diff status glow */}
      {edgeDiffStatus === 'new' && (
        <path
          d={edgePath}
          stroke={getEdgeColor()}
          strokeWidth='7'
          fill='none'
          strokeLinecap='round'
          opacity='0.18'
          style={{ pointerEvents: 'none' }}
        />
      )}

      {isSelected && (
        <EdgeLabelRenderer>
          <div
            className='nodrag nopan flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-background shadow-sm transition-all duration-150 hover:scale-110 hover:border-destructive/40 hover:bg-destructive/10'
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 22,
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()

              if (data?.onDelete) {
                // Pass this specific edge's ID to the delete function
                ;(data.onDelete as (id: string) => void)(id)
              }
            }}
          >
            <X className='h-3 w-3 text-muted-foreground hover:text-destructive' />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
