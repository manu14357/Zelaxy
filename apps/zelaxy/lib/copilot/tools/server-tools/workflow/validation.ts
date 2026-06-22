/**
 * Sub-block value validation for AI-built/edited workflows.
 *
 * The copilot stamps whatever values the model emits into a block's sub-blocks. Without validation,
 * invalid dropdown ids (e.g. a schedule frequency of "every-2-hour"), out-of-range sliders, and
 * non-boolean switches ship verbatim and silently break the block at runtime. This module validates
 * and (where safe) normalizes those values in place, and returns human-readable errors that the
 * tool surfaces back to the model so it can self-correct.
 */

import type { BlockConfig, SubBlockConfig } from '@/blocks/types'

export interface InputValidationError {
  block: string
  field: string
  message: string
}

interface WrittenSubBlock {
  id: string
  type: string
  value: any
}

function resolveOptionIds(config: SubBlockConfig): string[] | null {
  if (!config.options) return null
  const opts = typeof config.options === 'function' ? config.options() : config.options
  if (!Array.isArray(opts)) return null
  return opts.map((o) => o.id)
}

/**
 * Validates / normalizes a single value against its sub-block config.
 * Returns the value to store plus an optional error message to report to the model.
 */
export function validateValueForSubBlock(
  config: SubBlockConfig,
  value: any
): { value: any; error?: string } {
  if (value === null || value === undefined) return { value }

  switch (config.type) {
    case 'dropdown':
    case 'combobox': {
      const ids = resolveOptionIds(config)
      if (!ids || ids.length === 0) return { value }
      if (config.multiSelect && Array.isArray(value)) {
        const bad = value.filter((v) => !ids.includes(v))
        if (bad.length === 0) return { value }
        return {
          value,
          error: `invalid value(s) ${JSON.stringify(bad)} for "${config.id}" — allowed: ${ids.join(', ')}`,
        }
      }
      if (!ids.includes(value)) {
        return {
          value,
          error: `invalid value "${value}" for "${config.id}" — allowed: ${ids.join(', ')}`,
        }
      }
      return { value }
    }

    case 'switch': {
      if (typeof value === 'boolean') return { value }
      if (value === 'true' || value === 1 || value === '1') return { value: true }
      if (value === 'false' || value === 0 || value === '0' || value === '') return { value: false }
      return { value: Boolean(value), error: `"${config.id}" expects a boolean (true/false)` }
    }

    case 'slider': {
      const num = typeof value === 'number' ? value : Number(value)
      if (Number.isNaN(num)) return { value, error: `"${config.id}" expects a number` }
      let result = num
      const notes: string[] = []
      if (config.integer && !Number.isInteger(result)) result = Math.round(result)
      if (typeof config.min === 'number' && result < config.min) {
        result = config.min
        notes.push(`min ${config.min}`)
      }
      if (typeof config.max === 'number' && result > config.max) {
        result = config.max
        notes.push(`max ${config.max}`)
      }
      return {
        value: result,
        error: notes.length
          ? `"${config.id}" out of range, clamped to ${result} (${notes.join('/')})`
          : undefined,
      }
    }

    default:
      return { value }
  }
}

export interface WorkflowLintIssue {
  severity: 'error' | 'warning'
  message: string
}

/**
 * Lints a built/edited workflow state for structural problems the model should fix: edges to
 * missing blocks, disconnected (orphan) non-trigger blocks, missing always-required fields, and
 * multiple entry points. Returned to the model so it can issue a corrective follow-up edit.
 */
export function lintWorkflowState(
  blocks: Record<string, any>,
  edges: Array<{ source: string; target: string }>,
  blockRegistry: Map<string, BlockConfig>
): WorkflowLintIssue[] {
  const issues: WorkflowLintIssue[] = []
  const blockIds = new Set(Object.keys(blocks))

  // Edges referencing blocks that don't exist.
  for (const e of edges) {
    if (!blockIds.has(e.source)) {
      issues.push({
        severity: 'error',
        message: `Edge references missing source block "${e.source}"`,
      })
    }
    if (!blockIds.has(e.target)) {
      issues.push({
        severity: 'error',
        message: `Edge references missing target block "${e.target}"`,
      })
    }
  }

  const hasIncoming = new Set<string>()
  const hasOutgoing = new Set<string>()
  for (const e of edges) {
    hasOutgoing.add(e.source)
    hasIncoming.add(e.target)
  }

  let triggerCount = 0
  for (const [id, block] of Object.entries(blocks)) {
    const cfg = blockRegistry.get(block.type)
    const isTrigger = cfg?.category === 'triggers' || block.type === 'starter'
    if (isTrigger) triggerCount++

    // Orphan: a non-trigger block wired to nothing (only meaningful with >1 block).
    if (blockIds.size > 1 && !isTrigger && !hasIncoming.has(id) && !hasOutgoing.has(id)) {
      issues.push({
        severity: 'warning',
        message: `Block "${block.name || id}" (${block.type}) is not connected to anything`,
      })
    }

    // Missing ALWAYS-required fields (skip conditionally-shown ones to avoid false positives).
    for (const sub of cfg?.subBlocks || []) {
      if (!sub.required || sub.condition) continue
      const val = block.subBlocks?.[sub.id]?.value
      const empty =
        val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)
      if (empty) {
        issues.push({
          severity: 'warning',
          message: `Block "${block.name || id}" is missing required field "${sub.id}"`,
        })
      }
    }
  }

  if (triggerCount > 1) {
    issues.push({
      severity: 'warning',
      message: `Workflow has ${triggerCount} trigger/start blocks — there should usually be exactly one entry point`,
    })
  }

  return issues
}

/**
 * Validates & normalizes every written sub-block value for a block IN PLACE.
 * `subBlocks` is the `{ id, type, value }` map that build/edit produce.
 */
export function validateBlockSubBlocks(
  blockType: string,
  blockConfig: BlockConfig | undefined,
  subBlocks: Record<string, WrittenSubBlock>
): InputValidationError[] {
  if (!blockConfig) return []
  const errors: InputValidationError[] = []
  const configMap = new Map<string, SubBlockConfig>()
  for (const c of blockConfig.subBlocks || []) configMap.set(c.id, c)

  for (const [key, sb] of Object.entries(subBlocks)) {
    const config = configMap.get(key)
    if (!config) continue
    const { value, error } = validateValueForSubBlock(config, sb.value)
    sb.value = value
    if (error) errors.push({ block: blockType, field: key, message: error })
  }
  return errors
}
