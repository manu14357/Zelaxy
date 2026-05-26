/**
 * Enum defining all supported block types in the executor.
 * This centralizes block type definitions and eliminates magic strings.
 */
export enum BlockType {
  PARALLEL = 'parallel',
  LOOP = 'loop',
  ROUTER = 'router',
  ROUTER_V2 = 'router_v2',
  CONDITION = 'condition',
  FUNCTION = 'function',
  AGENT = 'agent',
  API = 'api',
  EVALUATOR = 'evaluator',
  RESPONSE = 'response',
  WORKFLOW = 'workflow',
  STARTER = 'starter',
  SCHEDULE = 'schedule',
  WEBHOOK_TRIGGER = 'webhook_trigger',
  SWITCH = 'switch',
  // New types
  HUMAN_IN_THE_LOOP = 'human_in_the_loop',
  WAIT = 'wait',
  VARIABLES = 'variables',
  CREDENTIAL = 'credential',
  ZELAXY_ARENA = 'zelaxy-arena',
  NOTE = 'note',
  // Sentinel types for DAG loop/parallel construction
  SENTINEL_START = 'sentinel_start',
  SENTINEL_END = 'sentinel_end',
}

export type SentinelType = 'start' | 'end'

export const TRIGGER_BLOCK_TYPES = [BlockType.STARTER, BlockType.SCHEDULE, BlockType.WEBHOOK_TRIGGER] as const

export const METADATA_ONLY_BLOCK_TYPES = [BlockType.LOOP, BlockType.PARALLEL, BlockType.NOTE] as const

export function isTriggerBlockType(type: string | undefined): boolean {
  return TRIGGER_BLOCK_TYPES.includes(type as any)
}

export function isMetadataOnlyBlockType(type: string | undefined): boolean {
  return METADATA_ONLY_BLOCK_TYPES.includes(type as any)
}

export function isConditionBlockType(type: string | undefined): boolean {
  return type === BlockType.CONDITION
}

export function isRouterBlockType(type: string | undefined): boolean {
  return type === BlockType.ROUTER
}

export function isRouterV2BlockType(type: string | undefined): boolean {
  return type === BlockType.ROUTER_V2
}

export const EDGE = {
  CONDITION_PREFIX: 'condition-',
  CONDITION_TRUE: 'condition-true',
  CONDITION_FALSE: 'condition-false',
  ROUTER_PREFIX: 'router-',
  LOOP_CONTINUE: 'loop_continue',
  LOOP_CONTINUE_ALT: 'loop-continue-source',
  LOOP_EXIT: 'loop_exit',
  PARALLEL_CONTINUE: 'parallel_continue',
  PARALLEL_EXIT: 'parallel_exit',
  ERROR: 'error',
  SOURCE: 'source',
  DEFAULT: 'default',
} as const

export const LOOP = {
  TYPE: {
    FOR: 'for' as const,
    FOR_EACH: 'forEach' as const,
    WHILE: 'while' as const,
    DO_WHILE: 'doWhile' as const,
  },
  SENTINEL: {
    PREFIX: 'loop-',
    START_SUFFIX: '-sentinel-start',
    END_SUFFIX: '-sentinel-end',
    START_TYPE: 'start' as SentinelType,
    END_TYPE: 'end' as SentinelType,
    START_NAME_PREFIX: 'Loop Start',
    END_NAME_PREFIX: 'Loop End',
  },
} as const

export const PARALLEL = {
  TYPE: {
    COLLECTION: 'collection' as const,
    COUNT: 'count' as const,
  },
  BRANCH: {
    PREFIX: '₍',
    SUFFIX: '₎',
  },
  SENTINEL: {
    PREFIX: 'parallel-',
    START_SUFFIX: '-sentinel-start',
    END_SUFFIX: '-sentinel-end',
    START_TYPE: 'start' as SentinelType,
    END_TYPE: 'end' as SentinelType,
    START_NAME_PREFIX: 'Parallel Start',
    END_NAME_PREFIX: 'Parallel End',
  },
  DEFAULT_COUNT: 1,
} as const

export const DEFAULTS = {
  MAX_ITERATIONS: 5,
  MAX_PARALLEL_BRANCHES: 100,
} as const

/**
 * Array of all block types for iteration and validation
 */
export const ALL_BLOCK_TYPES = Object.values(BlockType) as string[]

/**
 * Type guard to check if a string is a valid block type
 */
export function isValidBlockType(type: string): type is BlockType {
  return ALL_BLOCK_TYPES.includes(type)
}
