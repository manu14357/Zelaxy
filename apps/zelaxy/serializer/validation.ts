/**
 * Additive, visibility-aware serializer validation.
 *
 * This module carries two things and changes NO serialized output:
 *
 * 1. `WorkflowValidationError` — a typed error the serializer throws instead of a plain `Error`.
 *    It preserves the exact human-readable message the old code produced (so existing callers and
 *    tests keep working) while additionally carrying `blockId` / `blockType` / `blockName` / the
 *    offending `fields`, so UIs and the copilot can point the user at the exact block.
 *
 * 2. `collectBlockFieldIssues` — a required-field check that mirrors the editor's sub-block
 *    visibility filter (see the workflow-block component's `visibleSubBlocks` logic). A field is
 *    only "required and missing" when it is actually visible in the UI for the block's current
 *    state (mode / trigger-mode / conditional visibility). This avoids false positives on
 *    conditionally-hidden fields.
 */

import type { SubBlockConfig, SubBlockType } from '@/blocks/types'

export interface WorkflowValidationErrorInfo {
  blockId: string
  blockType: string
  blockName: string
  /** Display titles (or ids) of the fields that failed validation. */
  fields?: string[]
}

/**
 * Structured error raised during serialization when a block is missing required user-provided
 * fields. The `message` is kept byte-for-byte compatible with the previous plain `Error` so
 * message-matching assertions and error surfaces are unaffected.
 */
export class WorkflowValidationError extends Error {
  readonly blockId: string
  readonly blockType: string
  readonly blockName: string
  readonly fields: string[]

  constructor(message: string, info: WorkflowValidationErrorInfo) {
    super(message)
    this.name = 'WorkflowValidationError'
    this.blockId = info.blockId
    this.blockType = info.blockType
    this.blockName = info.blockName
    this.fields = info.fields ?? []
    // Restore prototype chain for `instanceof` after transpilation to ES5-ish targets.
    Object.setPrototypeOf(this, WorkflowValidationError.prototype)
  }
}

/** Context that drives which sub-blocks are visible, mirroring the editor's state flags. */
export interface VisibilityContext {
  /** The block's advanced-mode toggle. */
  isAdvancedMode?: boolean
  /** The block's trigger-mode toggle. */
  isTriggerMode?: boolean
  /** True when the block itself is a pure trigger block (`triggers.enabled` + `triggers` category). */
  isTriggerBlock?: boolean
}

type SubBlockCondition = {
  field: string
  value: string | number | boolean | Array<string | number | boolean> | undefined
  not?: boolean
  and?: {
    field: string
    value: string | number | boolean | Array<string | number | boolean> | undefined
    not?: boolean
  }
}

/**
 * Evaluates one side of a condition against a flat field-value map, mirroring the editor exactly:
 * null/undefined coerce to `false` when the expected value is a boolean; array values use
 * `includes`; `not` inverts the match.
 */
function matchesSide(
  field: string,
  expected: SubBlockCondition['value'],
  not: boolean | undefined,
  values: Record<string, any>
): boolean {
  const raw = values[field]
  const fieldValue =
    raw === null || raw === undefined ? (typeof expected === 'boolean' ? false : raw) : raw

  if (Array.isArray(expected)) {
    return (
      fieldValue != null &&
      (not
        ? !expected.includes(fieldValue as string | number | boolean)
        : expected.includes(fieldValue as string | number | boolean))
    )
  }
  return not ? fieldValue !== expected : fieldValue === expected
}

function evaluateCondition(condition: SubBlockCondition, values: Record<string, any>): boolean {
  const isValueMatch = matchesSide(condition.field, condition.value, condition.not, values)
  const isAndValueMatch =
    !condition.and ||
    matchesSide(condition.and.field, condition.and.value, condition.and.not, values)
  return isValueMatch && isAndValueMatch
}

/**
 * Returns whether a sub-block is currently visible in the editor, given the block's field values
 * and state flags. This mirrors the `visibleSubBlocks` filter in the workflow-block component so
 * validation and the UI agree on what the user can actually see and fill in.
 */
export function isSubBlockVisible(
  sub: SubBlockConfig,
  values: Record<string, any>,
  ctx: VisibilityContext = {}
): boolean {
  if (sub.hidden) return false

  const triggerConfigType = 'trigger-config' as SubBlockType
  if (sub.type === triggerConfigType) {
    // trigger-config blocks show in trigger mode or for pure trigger blocks; nowhere else.
    return Boolean(ctx.isTriggerMode || ctx.isTriggerBlock)
  }

  // In trigger mode, every non-trigger-config sub-block is hidden.
  if (ctx.isTriggerMode) return false

  if (sub.mode) {
    if (sub.mode === 'basic' && ctx.isAdvancedMode) return false
    if (sub.mode === 'advanced' && !ctx.isAdvancedMode) return false
  }

  if (!sub.condition) return true
  const actualCondition = typeof sub.condition === 'function' ? sub.condition() : sub.condition
  return evaluateCondition(actualCondition as SubBlockCondition, values)
}

export interface BlockFieldIssue {
  /** The sub-block id. */
  fieldId: string
  /** The sub-block's display title, falling back to its id. */
  fieldTitle: string
}

function isEmptyValue(value: any): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  )
}

/**
 * Collects required sub-blocks that are (a) currently visible per the editor's rules and
 * (b) empty. `values` is the flat `{ subBlockId: value }` map (i.e. the serializer's extracted
 * params or an unwrapped copy of a block's sub-block values).
 */
export function collectBlockFieldIssues(
  blockConfig: { subBlocks?: SubBlockConfig[] } | undefined,
  values: Record<string, any>,
  ctx: VisibilityContext = {}
): BlockFieldIssue[] {
  if (!blockConfig) return []
  const issues: BlockFieldIssue[] = []
  for (const sub of blockConfig.subBlocks || []) {
    if (!sub.required) continue
    if (!isSubBlockVisible(sub, values, ctx)) continue
    if (isEmptyValue(values[sub.id])) {
      issues.push({ fieldId: sub.id, fieldTitle: sub.title || sub.id })
    }
  }
  return issues
}
