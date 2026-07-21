import { z } from 'zod'

const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

// Schema for auto-connect edge data
const AutoConnectEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  type: z.string().optional(),
})

export const BlockOperationSchema = z.object({
  operation: z.enum([
    'add',
    'remove',
    'update-position',
    'update-name',
    'toggle-enabled',
    'update-parent',
    'update-wide',
    'update-advanced-mode',
    'update-trigger-mode',
    'toggle-handles',
    'duplicate',
  ]),
  target: z.literal('block'),
  payload: z.object({
    id: z.string(),
    sourceId: z.string().optional(), // For duplicate operations
    type: z.string().optional(),
    name: z.string().optional(),
    position: PositionSchema.optional(),
    data: z.record(z.any()).optional(),
    subBlocks: z.record(z.any()).optional(),
    outputs: z.record(z.any()).optional(),
    parentId: z.string().nullable().optional(),
    extent: z.enum(['parent']).nullable().optional(),
    enabled: z.boolean().optional(),
    horizontalHandles: z.boolean().optional(),
    isWide: z.boolean().optional(),
    advancedMode: z.boolean().optional(),
    triggerMode: z.boolean().optional(),
    height: z.number().optional(),
    autoConnectEdge: AutoConnectEdgeSchema.optional(), // Add support for auto-connect edges
  }),
  timestamp: z.number(),
  operationId: z.string().optional(),
})

export const EdgeOperationSchema = z.object({
  operation: z.enum(['add', 'remove']),
  target: z.literal('edge'),
  payload: z.object({
    id: z.string(),
    source: z.string().optional(),
    target: z.string().optional(),
    sourceHandle: z.string().nullable().optional(),
    targetHandle: z.string().nullable().optional(),
  }),
  timestamp: z.number(),
  operationId: z.string().optional(),
})

// Batch operations on multiple blocks at once (target: 'blocks'). These let a
// multi-select drag or delete emit ONE collaborative op instead of N single-block
// ops. Additive: the single-block BlockOperationSchema above is unchanged.
export const BatchUpdatePositionsSchema = z.object({
  operation: z.literal('batch-update-positions'),
  target: z.literal('blocks'),
  payload: z.object({
    updates: z.array(
      z.object({
        id: z.string(),
        position: PositionSchema,
      })
    ),
  }),
  timestamp: z.number(),
  operationId: z.string().optional(),
})

export const BatchAddBlocksSchema = z.object({
  operation: z.literal('batch-add-blocks'),
  target: z.literal('blocks'),
  payload: z.object({
    blocks: z.array(z.record(z.any())),
    edges: z.array(z.record(z.any())).optional(),
    loops: z.record(z.any()).optional(),
    parallels: z.record(z.any()).optional(),
    subBlockValues: z.record(z.record(z.any())).optional(),
  }),
  timestamp: z.number(),
  operationId: z.string().optional(),
})

export const BatchRemoveBlocksSchema = z.object({
  operation: z.literal('batch-remove-blocks'),
  target: z.literal('blocks'),
  payload: z.object({
    ids: z.array(z.string()),
  }),
  timestamp: z.number(),
  operationId: z.string().optional(),
})

export const BlocksOperationSchema = z.union([
  BatchUpdatePositionsSchema,
  BatchAddBlocksSchema,
  BatchRemoveBlocksSchema,
])

// Batch operations on multiple edges at once (target: 'edges').
export const BatchRemoveEdgesSchema = z.object({
  operation: z.literal('batch-remove-edges'),
  target: z.literal('edges'),
  payload: z.object({
    ids: z.array(z.string()),
  }),
  timestamp: z.number(),
  operationId: z.string().optional(),
})

// Only one edges-batch op today; alias directly (z.union needs 2+ members).
export const EdgesOperationSchema = BatchRemoveEdgesSchema

export const SubflowOperationSchema = z.object({
  operation: z.enum(['add', 'remove', 'update']),
  target: z.literal('subflow'),
  payload: z.object({
    id: z.string(),
    type: z.enum(['loop', 'parallel']).optional(),
    config: z.record(z.any()).optional(),
  }),
  timestamp: z.number(),
  operationId: z.string().optional(),
})

export const VariableOperationSchema = z.union([
  z.object({
    operation: z.literal('add'),
    target: z.literal('variable'),
    payload: z.object({
      id: z.string(),
      name: z.string(),
      type: z.any(),
      value: z.any(),
      workflowId: z.string(),
    }),
    timestamp: z.number(),
    operationId: z.string().optional(),
  }),
  z.object({
    operation: z.literal('remove'),
    target: z.literal('variable'),
    payload: z.object({
      variableId: z.string(),
    }),
    timestamp: z.number(),
    operationId: z.string().optional(),
  }),
  z.object({
    operation: z.literal('duplicate'),
    target: z.literal('variable'),
    payload: z.object({
      sourceVariableId: z.string(),
      id: z.string(),
    }),
    timestamp: z.number(),
    operationId: z.string().optional(),
  }),
])

export const WorkflowOperationSchema = z.union([
  BlockOperationSchema,
  BatchUpdatePositionsSchema,
  BatchAddBlocksSchema,
  BatchRemoveBlocksSchema,
  EdgeOperationSchema,
  BatchRemoveEdgesSchema,
  SubflowOperationSchema,
  VariableOperationSchema,
])

export { PositionSchema, AutoConnectEdgeSchema }
